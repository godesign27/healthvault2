-- PREVIEW ONLY. Narrow privileged Auth lookup; no Auth row data or broad table grant.
-- Only service_role can execute. If a caller has a user identity, bind the lookup to it.
create function account_control_private.import_account_exists(p_user_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select (auth.uid() is null or auth.uid()=p_user_id)
 and exists(select 1 from auth.users where id=p_user_id and (banned_until is null or banned_until<=now()));
$$;
revoke all on function account_control_private.import_account_exists(uuid) from public,anon,authenticated;
grant execute on function account_control_private.import_account_exists(uuid) to service_role;

create or replace function public.finalize_inbound_upload(p_attempt_id uuid,p_record jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare a public.inbound_upload_attempts; result jsonb;
begin
 select * into strict a from public.inbound_upload_attempts where id=p_attempt_id;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('hv-account:' || a.user_id::text,0));
 select * into strict a from public.inbound_upload_attempts where id=p_attempt_id for update;
 if a.state='abandoned' then raise exception 'Import abandoned'; end if;
 if a.state='committed' then
   select jsonb_build_object('id',id,'title',title,'kind',kind) into result
   from public.health_records where id=a.id and user_id=a.user_id::text;
   if result is null then raise exception 'Committed record unavailable'; end if;
   return result;
 end if;
 if exists(select 1 from public.account_erasure_blocks where user_id=a.user_id)
 or not account_control_private.import_account_exists(a.user_id)
 then raise exception 'Account unavailable' using errcode='42501'; end if;
 if a.storage_path is not null and not exists(
   select 1 from storage.objects where bucket_id='inbound-records' and name=a.storage_path
 ) then raise exception 'Upload not present'; end if;
 insert into public.health_records(id,user_id,kind,title,provider_name,service_date,source,
   file_type,file_size_bytes,preview_url,tags,fhir_ref)
 values(a.id,a.user_id::text,p_record->>'kind',p_record->>'title',p_record->>'provider_name',
   (p_record->>'service_date')::date,'connected',p_record->>'file_type',
   (p_record->>'file_size_bytes')::integer,
   case when a.storage_path is null then null else 'hv-storage://inbound-records/' || replace(a.storage_path,'/','%2F') end,
   '{}',p_record->'fhir_ref');
 update public.inbound_upload_attempts set state='committed',updated_at=now() where id=a.id;
 return jsonb_build_object('id',a.id,'title',p_record->>'title','kind',p_record->>'kind');
end;
$$;
revoke all on function public.finalize_inbound_upload(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.finalize_inbound_upload(uuid,jsonb) to service_role;

