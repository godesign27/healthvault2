-- Preview candidate; depends on request_upload_recovery. No production rollout.
alter table public.inbound_upload_attempts add column request_fingerprint text
 check(request_fingerprint is null or (request_id is not null and request_fingerprint ~ '^[a-f0-9]{64}$'));
create unique index request_upload_fingerprint_unique on public.inbound_upload_attempts(request_id,request_fingerprint)
 where request_fingerprint is not null;

create function public.reserve_request_upload(p_request_id uuid,p_token text,p_attempt_id uuid,p_fingerprint text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare r public.health_record_requests; a public.inbound_upload_attempts; receipt jsonb;
begin
 if p_fingerprint is null or p_fingerprint !~ '^[a-f0-9]{64}$' then raise exception 'Invalid fingerprint'; end if;
 select * into strict r from public.health_record_requests where id=p_request_id;
 perform pg_advisory_xact_lock(hashtextextended('hv-account:'||r.user_id,0));
 select * into strict r from public.health_record_requests where id=p_request_id for update;
 if p_token is null or r.secure_token is distinct from p_token
 or (r.expires_at is not null and r.expires_at<=now())
 or exists(select 1 from public.account_erasure_blocks where user_id=r.user_id::uuid)
 or not account_control_private.import_account_exists(r.user_id::uuid)
 then raise exception 'Request unavailable' using errcode='42501'; end if;
 if r.status not in ('pending','sent','received') then raise exception 'Request closed'; end if;
 select * into a from public.inbound_upload_attempts
 where request_id=r.id and request_fingerprint=p_fingerprint for update;
 if found then
  if a.state='committed' then
   select jsonb_build_object('id',id,'title',title,'kind',kind) into receipt
   from public.health_records where id=a.id and user_id=r.user_id;
   if receipt is null then raise exception 'Receipt unavailable'; end if;
   return jsonb_build_object('state','committed','record',receipt);
  end if;
  if a.state='prepared' then return jsonb_build_object('state','busy','attemptId',a.id); end if;
 end if;
 if r.status='received' then raise exception 'Request closed'; end if;
 -- An abandoned attempt can never finalize. Preserve its path for late-file cleanup,
 -- but allow a fresh UUID/path to own this fingerprint for the retry.
 if a.id is not null then update public.inbound_upload_attempts set request_fingerprint=null where id=a.id; end if;
 insert into public.inbound_upload_attempts(id,user_id,request_id,storage_bucket,storage_path,request_fingerprint)
 values(p_attempt_id,r.user_id::uuid,r.id,'record-request-files',r.id::text||'/'||p_attempt_id::text,p_fingerprint);
 return jsonb_build_object('state','prepared');
end;
$$;
revoke all on function public.reserve_request_upload(uuid,text,uuid,text) from public,anon,authenticated;
grant execute on function public.reserve_request_upload(uuid,text,uuid,text) to service_role;

create or replace function public.complete_request_upload(p_request_id uuid,p_token text,p_attempt_ids uuid[])
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
 if r.status='received' then return true; end if;
 if r.status not in ('pending','sent') then raise exception 'Request closed'; end if;
 update public.health_record_requests set status='received',submitted_at=now(),updated_at=now() where id=r.id;
 return true;
end;
$$;
revoke all on function public.complete_request_upload(uuid,text,uuid[]) from public,anon,authenticated;
grant execute on function public.complete_request_upload(uuid,text,uuid[]) to service_role;
