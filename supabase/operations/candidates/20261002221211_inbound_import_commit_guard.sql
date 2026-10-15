-- PREVIEW ONLY. Requires account_erasure_access_block candidate first.
-- The journal survives Auth deletion and tracks every object before upload.
create table public.inbound_upload_attempts (
 id uuid primary key,
 user_id uuid not null,
 storage_path text unique,
 state text not null default 'prepared' check (state in ('prepared','committed','abandoned')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (storage_path is null or storage_path = user_id::text || '/' || id::text)
);
alter table public.inbound_upload_attempts enable row level security;
revoke all on public.inbound_upload_attempts from public,anon,authenticated;
grant all on public.inbound_upload_attempts to service_role;
create index inbound_upload_attempts_unfinished on public.inbound_upload_attempts(updated_at)
 where state <> 'committed';

-- Both finalization and reviewed blocking hold this same transaction-scoped lock.
-- Service-role imports cannot commit after this block returns successfully.
create or replace function public.operator_block_reviewed_account(p_user_id uuid,p_request_id uuid)
returns void language plpgsql security invoker set search_path='' as $$
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('hv-account:' || p_user_id::text,0));
 perform 1 from public.account_deletion_requests
 where id=p_request_id and user_id=p_user_id and confirmed and status='reviewing' for update;
 if not found then raise exception 'An exact reviewed deletion request is required'; end if;
 insert into public.account_erasure_blocks(user_id,request_id) values(p_user_id,p_request_id)
 on conflict(user_id) do nothing;
end;
$$;
revoke all on function public.operator_block_reviewed_account(uuid,uuid) from public,anon,authenticated;
grant execute on function public.operator_block_reviewed_account(uuid,uuid) to service_role;

create function public.finalize_inbound_upload(p_attempt_id uuid,p_record jsonb)
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
 or not exists(select 1 from auth.users where id=a.user_id and (banned_until is null or banned_until<=now()))
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

-- Serialize compensation with finalization: never delete a committed file,
-- including when finalization succeeded but its HTTP response was lost.
create function public.abandon_inbound_upload(p_attempt_id uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare a public.inbound_upload_attempts; result jsonb;
begin
 select * into strict a from public.inbound_upload_attempts where id=p_attempt_id for update;
 if a.state='committed' then
   select jsonb_build_object('id',id,'title',title,'kind',kind) into result
   from public.health_records where id=a.id and user_id=a.user_id::text;
   return jsonb_build_object('state','committed','record',result);
 end if;
 update public.inbound_upload_attempts set state='abandoned',updated_at=now() where id=a.id;
 return jsonb_build_object('state','abandoned','storage_path',a.storage_path);
end;
$$;
revoke all on function public.abandon_inbound_upload(uuid) from public,anon,authenticated;
grant execute on function public.abandon_inbound_upload(uuid) to service_role;
