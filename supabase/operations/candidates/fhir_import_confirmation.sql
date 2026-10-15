-- Preview candidate: confirm only selections from a persisted provider preview.
alter table public.record_import_jobs add column if not exists confirmation_selection jsonb;
alter table public.record_import_jobs add column if not exists confirmation_result jsonb;
-- Browser clients must not forge previews or completed receipts.
revoke insert,update on public.record_import_jobs from anon,authenticated;
create table if not exists public.fhir_import_items (
 user_id uuid not null references auth.users(id) on delete cascade,
 provider_organization_id uuid not null references public.provider_organizations(id),
 fingerprint text not null,record_id uuid not null,
 primary key(user_id,provider_organization_id,fingerprint)
);
alter table public.fhir_import_items enable row level security;
revoke all on public.fhir_import_items from public,anon,authenticated;
grant all on public.fhir_import_items to service_role;

create or replace function public.confirm_fhir_preview(p_user_id uuid,p_job_id uuid,p_selection jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare j public.record_import_jobs; c public.provider_connections; k text; v jsonb; ix integer;
 item jsonb; normalized jsonb:='{}'; ids jsonb; fingerprint text; rid uuid; inserted integer;
 counts jsonb:='{"conditions":0,"medications":0,"allergies":0,"immunizations":0,"duplicates":0}';
 count_key text; total integer:=0; chosen integer:=0; provider text; summary_id uuid; result jsonb;
begin
 perform pg_advisory_xact_lock(hashtextextended('hv-account:'||p_user_id::text,0));
 if exists(select 1 from public.account_erasure_blocks where user_id=p_user_id)
 or not account_control_private.import_account_exists(p_user_id) then raise exception 'Account unavailable'; end if;
 select * into j from public.record_import_jobs where id=p_job_id and user_id=p_user_id for update;
 if not found then raise exception 'Preview unavailable'; end if;
 if jsonb_typeof(p_selection) is distinct from 'object' then raise exception 'Invalid selection'; end if;
 for k,v in select * from jsonb_each(p_selection) loop
  if k not in ('condition','medication','allergy','immunization') or jsonb_typeof(v)<>'array' then raise exception 'Invalid selection'; end if;
  if exists(select 1 from jsonb_array_elements(v) x where jsonb_typeof(x)<>'number' or x::text !~ '^[0-9]{1,6}$') then raise exception 'Invalid selection index'; end if;
  select coalesce(jsonb_agg(n order by n),'[]') into ids from (select distinct value::text::integer n from jsonb_array_elements(v)) s;
  if jsonb_array_length(ids)>0 then normalized:=normalized||jsonb_build_object(k,ids); end if;
  chosen:=chosen+jsonb_array_length(ids);
 end loop;
 if chosen=0 or chosen>2000 then raise exception 'Select between 1 and 2000 records'; end if;
 if j.status='complete' and j.confirmation_result is not null then
  if j.confirmation_selection is distinct from normalized then raise exception 'This preview was already confirmed with a different selection'; end if;
  return j.confirmation_result;
 end if;
 if j.status<>'preview' or j.created_at<now()-interval '24 hours' then raise exception 'Preview expired or unavailable'; end if;
 select * into c from public.provider_connections where id=j.provider_connection_id and user_id=p_user_id and status='active' for update;
 if not found then raise exception 'Connection unavailable'; end if;
 select name into provider from public.provider_organizations where id=c.provider_organization_id;
 for k,v in select * from jsonb_each(normalized) loop
  count_key:=case k when 'condition' then 'conditions' when 'medication' then 'medications' when 'allergy' then 'allergies' else 'immunizations' end;
  for ix in select value::text::integer from jsonb_array_elements(v) loop
   item:=j.preview_data->k->ix;
   if item is null or coalesce(length(btrim(item->>'name')),0)=0 then raise exception 'Selected record unavailable'; end if;
   fingerprint:=encode(sha256(convert_to(jsonb_build_object('patient',c.fhir_patient_id,'type',k,'item',item-'isDuplicate')::text,'UTF8')),'hex');
   rid:=gen_random_uuid();
   insert into public.fhir_import_items values(p_user_id,c.provider_organization_id,fingerprint,rid) on conflict do nothing;
   get diagnostics inserted=row_count;
   if inserted=0 then counts:=jsonb_set(counts,'{duplicates}',to_jsonb((counts->>'duplicates')::integer+1));continue;end if;
   case k
    when 'condition' then insert into public.conditions(id,user_id,name,diagnosed_on,status,managing_physician)
     values(rid,p_user_id::text,item->>'name',nullif(item->>'date','')::date,item->>'status',item->>'source');
    when 'medication' then insert into public.medications(id,user_id,name,prescribed_by)
     values(rid,p_user_id::text,item->>'name',item->>'source');
    when 'allergy' then insert into public.allergies(id,user_id,allergen) values(rid,p_user_id::text,item->>'name');
    when 'immunization' then insert into public.immunizations(id,user_id,vaccine,administered_on,provider)
     values(rid,p_user_id::text,item->>'name',nullif(item->>'date','')::date,item->>'source');
   end case;
   counts:=jsonb_set(counts,array[count_key],to_jsonb((counts->>count_key)::integer+1));total:=total+1;
  end loop;
 end loop;
 if total>0 then
  insert into public.health_records(user_id,kind,title,provider_name,service_date,source,ai_summary,tags)
  values(p_user_id::text,'specialist_report','Medical Record Import — '||provider,provider,current_date,'connected',
   'Imported '||total||' reviewed records from '||provider||'.',array['import','medical-profile']) returning id into summary_id;
 end if;
 result:=counts||jsonb_build_object('importJobId',j.id,'recordId',summary_id,'status','complete');
 update public.record_import_jobs set status='complete',completed_at=now(),confirmation_selection=normalized,confirmation_result=result where id=j.id;
 update public.provider_connections set last_synced_at=now() where id=c.id;
 return result;
end;
$$;
revoke all on function public.confirm_fhir_preview(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.confirm_fhir_preview(uuid,uuid,jsonb) to service_role;
