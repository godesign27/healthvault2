-- Preview only. Requires upload-recovery and account-access candidates.
create table public.inbound_import_batches (
 id uuid primary key default gen_random_uuid(), user_id uuid not null,
 key_hash text not null check(key_hash ~ '^[a-f0-9]{64}$'),
 payload_hash text not null check(payload_hash ~ '^[a-f0-9]{64}$'),
 record_count integer not null check(record_count between 1 and 20),
 created_at timestamptz not null default now(), unique(user_id,key_hash)
);
alter table public.inbound_import_batches enable row level security;
revoke all on public.inbound_import_batches from public,anon,authenticated;
grant all on public.inbound_import_batches to service_role;
alter table public.inbound_upload_attempts
 add column inbound_batch_id uuid references public.inbound_import_batches(id),
 add column inbound_record_index integer,
 add constraint inbound_receipt_slot check (
  (inbound_batch_id is null and inbound_record_index is null) or
  (inbound_batch_id is not null and inbound_record_index is not null
   and inbound_record_index between 0 and 19 and request_id is null and storage_bucket='inbound-records'));
create unique index inbound_receipt_slot_unique on public.inbound_upload_attempts(inbound_batch_id,inbound_record_index)
 where inbound_batch_id is not null;

create function public.reserve_inbound_batch(p_user_id uuid,p_key_hash text,p_payload_hash text,p_count integer)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare b public.inbound_import_batches;
begin
 perform pg_advisory_xact_lock(hashtextextended('hv-account:'||p_user_id::text,0));
 if exists(select 1 from public.account_erasure_blocks where user_id=p_user_id)
 or not account_control_private.import_account_exists(p_user_id)
 then raise exception 'Account unavailable' using errcode='42501'; end if;
 select * into b from public.inbound_import_batches where user_id=p_user_id and key_hash=p_key_hash for update;
 if found then
  if b.payload_hash is distinct from p_payload_hash or b.record_count is distinct from p_count
  then return jsonb_build_object('state','conflict'); end if;
 else
  insert into public.inbound_import_batches(user_id,key_hash,payload_hash,record_count)
  values(p_user_id,p_key_hash,p_payload_hash,p_count) returning * into b;
 end if;
 return jsonb_build_object('state','ready','id',b.id);
end;
$$;
create function public.reserve_inbound_record(p_batch_id uuid,p_index integer,p_attempt_id uuid,p_has_file boolean)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare b public.inbound_import_batches; a public.inbound_upload_attempts; receipt jsonb;
begin
 select * into strict b from public.inbound_import_batches where id=p_batch_id;
 perform pg_advisory_xact_lock(hashtextextended('hv-account:'||b.user_id::text,0));
 select * into strict b from public.inbound_import_batches where id=p_batch_id for update;
 if p_index is null or p_index<0 or p_index>=b.record_count or p_has_file is null then raise exception 'Invalid slot'; end if;
 if exists(select 1 from public.account_erasure_blocks where user_id=b.user_id)
 or not account_control_private.import_account_exists(b.user_id)
 then raise exception 'Account unavailable' using errcode='42501'; end if;
 select * into a from public.inbound_upload_attempts
 where inbound_batch_id=b.id and inbound_record_index=p_index for update;
 if found then
  if a.state='committed' then
   select jsonb_build_object('id',id,'title',title,'kind',kind) into receipt
   from public.health_records where id=a.id and user_id=b.user_id::text;
   if receipt is null then raise exception 'Receipt unavailable'; end if;
   return jsonb_build_object('state','committed','record',receipt);
  end if;
  if a.state='prepared' then return jsonb_build_object('state','busy','attemptId',a.id); end if;
  update public.inbound_upload_attempts set inbound_batch_id=null,inbound_record_index=null where id=a.id;
 end if;
 insert into public.inbound_upload_attempts(id,user_id,storage_path,inbound_batch_id,inbound_record_index)
 values(p_attempt_id,b.user_id,case when p_has_file then b.user_id::text||'/'||p_attempt_id::text end,b.id,p_index);
 return jsonb_build_object('state','prepared');
end;
$$;
revoke all on function public.reserve_inbound_batch(uuid,text,text,integer),public.reserve_inbound_record(uuid,integer,uuid,boolean) from public,anon,authenticated;
grant execute on function public.reserve_inbound_batch(uuid,text,text,integer),public.reserve_inbound_record(uuid,integer,uuid,boolean) to service_role;
