-- Preview candidate. Requires prior inbound upload guard + private Auth lookup.
alter table public.inbound_upload_attempts
 add column request_id uuid,
 add column storage_bucket text not null default 'inbound-records',
 add column cleanup_checked_at timestamptz,
 drop constraint inbound_upload_attempts_check,
 add constraint upload_attempt_location check (
   (request_id is null and storage_bucket='inbound-records' and
     (storage_path is null or storage_path=user_id::text||'/'||id::text)) or
   (request_id is not null and storage_bucket='record-request-files' and
     storage_path is not null and storage_path=request_id::text||'/'||id::text)
 );

create function public.finalize_request_upload(p_attempt_id uuid,p_token text,p_record jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare a public.inbound_upload_attempts; r public.health_record_requests; result jsonb;
begin
 select * into strict a from public.inbound_upload_attempts where id=p_attempt_id;
 perform pg_advisory_xact_lock(hashtextextended('hv-account:'||a.user_id::text,0));
 select * into strict a from public.inbound_upload_attempts where id=p_attempt_id for update;
 if a.request_id is null or a.storage_bucket<>'record-request-files' then raise exception 'Wrong upload type'; end if;
 select * into strict r from public.health_record_requests where id=a.request_id for update;
 if r.user_id<>a.user_id::text or p_token is null or r.secure_token is distinct from p_token
 or (r.expires_at is not null and r.expires_at<=now()) then raise exception 'Request unavailable' using errcode='42501'; end if;
 if exists(select 1 from public.account_erasure_blocks where user_id=a.user_id)
 or not account_control_private.import_account_exists(a.user_id) then raise exception 'Account unavailable' using errcode='42501'; end if;
 if a.state='committed' then
  select jsonb_build_object('id',id,'title',title,'kind',kind) into result from public.health_records where id=a.id;
  return result;
 end if;
 if a.state<>'prepared' or r.status not in ('pending','sent') then raise exception 'Request not accepting uploads'; end if;
 if not exists(select 1 from storage.objects where bucket_id=a.storage_bucket and name=a.storage_path)
 then raise exception 'Upload not present'; end if;
 insert into public.record_request_files(id,request_id,file_name,file_type,file_size_bytes,storage_path,record_kind,provider_notes)
 values(a.id,r.id,p_record->>'file_name',p_record->>'file_type',(p_record->>'file_size_bytes')::integer,a.storage_path,p_record->>'kind',p_record->>'notes');
 insert into public.health_records(id,user_id,kind,title,provider_name,source,file_type,file_size_bytes,preview_url,ai_summary,tags)
 values(a.id,a.user_id::text,p_record->>'kind',p_record->>'title',coalesce(r.doctor_name,r.provider_name),'shared',
 p_record->>'file_type',(p_record->>'file_size_bytes')::integer,
 'hv-storage://record-request-files/'||replace(a.storage_path,'/','%2F'),p_record->>'notes',array[p_record->>'kind','requested']);
 update public.inbound_upload_attempts set state='committed',updated_at=now() where id=a.id;
 return jsonb_build_object('id',a.id,'title',p_record->>'title','kind',p_record->>'kind');
end;
$$;
revoke all on function public.finalize_request_upload(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.finalize_request_upload(uuid,text,jsonb) to service_role;

create function public.complete_request_upload(p_request_id uuid,p_token text,p_attempt_ids uuid[])
returns boolean language plpgsql security invoker set search_path='' as $$
declare r public.health_record_requests;
begin
 select * into strict r from public.health_record_requests where id=p_request_id;
 perform pg_advisory_xact_lock(hashtextextended('hv-account:'||r.user_id,0));
 select * into strict r from public.health_record_requests where id=p_request_id for update;
 if p_token is null or r.secure_token is distinct from p_token
 or (r.expires_at is not null and r.expires_at<=now())
 or exists(select 1 from public.account_erasure_blocks where user_id=r.user_id::uuid)
 or not account_control_private.import_account_exists(r.user_id::uuid)
 then raise exception 'Request unavailable' using errcode='42501'; end if;
 if coalesce(cardinality(p_attempt_ids),0)=0 or exists(
 select 1 from unnest(p_attempt_ids) i where not exists(select 1 from public.inbound_upload_attempts a
 where a.id=i and a.request_id=r.id and a.user_id=r.user_id::uuid and a.state='committed'))
 then raise exception 'Incomplete upload batch'; end if;
 update public.health_record_requests set status='received',submitted_at=now(),updated_at=now() where id=r.id;
 return true;
end;
$$;
revoke all on function public.complete_request_upload(uuid,text,uuid[]) from public,anon,authenticated;
grant execute on function public.complete_request_upload(uuid,text,uuid[]) to service_role;

create table public.upload_recovery_settings (
 id boolean primary key default true check(id),enabled boolean not null default false,
 project_url text not null check(project_url ~ '^https://[a-z]+\.supabase\.co$'),
 lease uuid,lease_until timestamptz,last_started_at timestamptz,last_finished_at timestamptz,
 checked integer not null default 0,failed integer not null default 0
);
alter table public.upload_recovery_settings enable row level security;
revoke all on public.upload_recovery_settings from public,anon,authenticated;
grant all on public.upload_recovery_settings to service_role;
-- Preview-specific activation is deliberately separate from this migration.
insert into public.upload_recovery_settings(project_url) values('https://roeudwddxvniazwufdqf.supabase.co');
select vault.create_secret(gen_random_uuid()::text||gen_random_uuid()::text,'upload_recovery_scheduler','Internal upload reconciliation credential');

create function public.claim_upload_recovery(p_token text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare s public.upload_recovery_settings; items jsonb;
begin
 if not exists(select 1 from vault.decrypted_secrets where name='upload_recovery_scheduler' and decrypted_secret=p_token)
 then return jsonb_build_object('state','unauthorized'); end if;
 select * into strict s from public.upload_recovery_settings where id for update;
 if not s.enabled then return jsonb_build_object('state','disabled'); end if;
 if s.lease_until>now() then return jsonb_build_object('state','busy'); end if;
 update public.upload_recovery_settings set lease=gen_random_uuid(),lease_until=now()+interval '5 minutes',last_started_at=now()
 where id returning * into s;
 with picked as (
 select id from public.inbound_upload_attempts where state<>'committed' and created_at<now()-interval '1 hour'
 order by cleanup_checked_at nulls first,created_at limit 20 for update skip locked
 ), claimed as (
 update public.inbound_upload_attempts a set cleanup_checked_at=now() from picked where a.id=picked.id
 returning a.id,a.storage_bucket,a.storage_path
 ) select coalesce(jsonb_agg(to_jsonb(claimed)),'[]') into items from claimed;
 return jsonb_build_object('state','run','lease',s.lease,'items',items);
end;
$$;
create function public.finish_upload_recovery(p_lease uuid,p_checked integer,p_failed integer)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
 if p_checked<0 or p_failed<0 or p_failed>p_checked then raise exception 'Invalid counters'; end if;
 update public.upload_recovery_settings set last_finished_at=now(),checked=p_checked,failed=p_failed,lease_until=null
 where id and lease=p_lease;
 return found;
end;
$$;
revoke all on function public.claim_upload_recovery(text),public.finish_upload_recovery(uuid,integer,integer) from public,anon,authenticated;
grant execute on function public.claim_upload_recovery(text),public.finish_upload_recovery(uuid,integer,integer) to service_role;

create function public.dispatch_upload_recovery()
returns bigint language plpgsql security invoker set search_path='' as $$
declare endpoint text; credential text; request bigint;
begin
 select project_url into endpoint from public.upload_recovery_settings where id and enabled;
 if endpoint is null then return null; end if;
 select decrypted_secret into credential from vault.decrypted_secrets where name='upload_recovery_scheduler';
 if credential is null then raise exception 'Recovery credential missing'; end if;
 select net.http_post(url:=endpoint||'/functions/v1/upload-recovery',
 headers:=jsonb_build_object('Content-Type','application/json','x-upload-recovery-key',credential),
 body:='{}'::jsonb,timeout_milliseconds:=60000) into request;
 return request;
end;
$$;
revoke all on function public.dispatch_upload_recovery() from public,anon,authenticated,service_role;

create or replace function public.finalize_inbound_upload(p_attempt_id uuid,p_record jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare a public.inbound_upload_attempts; result jsonb;
begin
 select * into strict a from public.inbound_upload_attempts where id=p_attempt_id;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('hv-account:' || a.user_id::text,0));
 select * into strict a from public.inbound_upload_attempts where id=p_attempt_id for update;
 if a.request_id is not null or a.storage_bucket<>'inbound-records' then raise exception 'Wrong upload type'; end if;
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

