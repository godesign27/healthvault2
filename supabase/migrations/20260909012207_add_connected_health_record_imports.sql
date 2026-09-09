-- Patient-confirmed imports from records already stored in ChatGPT Health.

create table if not exists public.connected_health_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  import_batch_id uuid not null references public.health_import_batches(id),
  record_type text not null check (record_type in ('medication', 'condition', 'allergy', 'immunization', 'lab', 'encounter', 'document')),
  title text not null check (char_length(title) between 1 and 240),
  code text check (code is null or char_length(code) <= 120),
  status text check (status is null or char_length(status) <= 80),
  effective_date date,
  provider_name text check (provider_name is null or char_length(provider_name) <= 160),
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object' and octet_length(details::text) <= 32768),
  source_kind text not null,
  source_name text not null check (char_length(source_name) between 1 and 160),
  source_record_id text check (source_record_id is null or char_length(source_record_id) <= 240),
  fingerprint text not null check (fingerprint ~ '^[a-f0-9]{64}$'),
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, fingerprint)
);

create index if not exists connected_health_records_user_date_idx
  on public.connected_health_records (user_id, effective_date desc, created_at desc);

alter table public.connected_health_records enable row level security;
create policy connected_health_records_select_own on public.connected_health_records
  for select to authenticated using ((select auth.uid()) is not null and user_id = (select auth.uid()));
revoke all on public.connected_health_records from anon;
grant select on public.connected_health_records to authenticated;

create or replace function private.confirm_health_import_proposal(p_proposal_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_proposal public.health_import_proposals%rowtype;
  v_batch_id uuid;
  v_requested integer;
  v_imported integer;
  v_result jsonb;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  select * into v_proposal from public.health_import_proposals
  where id = p_proposal_id and user_id = v_user_id for update;

  if not found then raise exception 'Import proposal not found'; end if;
  if v_proposal.status = 'confirmed' then return v_proposal.result; end if;
  if v_proposal.status <> 'pending' then raise exception 'Import proposal is no longer available'; end if;
  if v_proposal.expires_at <= now() then raise exception 'Import proposal has expired. Preview the information again.'; end if;

  insert into public.health_import_batches (user_id, proposal_id, source_kind, source_name)
  values (v_user_id, v_proposal.id, v_proposal.source_kind, v_proposal.source_name)
  returning id into v_batch_id;

  if v_proposal.payload ? 'records' then
    v_requested := jsonb_array_length(coalesce(v_proposal.payload->'records', '[]'::jsonb));
    insert into public.connected_health_records (
      user_id, import_batch_id, record_type, title, code, status, effective_date,
      provider_name, details, source_kind, source_name, source_record_id, fingerprint, provenance
    )
    select v_user_id, v_batch_id, item->>'recordType', item->>'title', nullif(item->>'code',''),
      nullif(item->>'status',''), case when item ? 'effectiveDate' then (item->>'effectiveDate')::date else null end,
      nullif(item->>'providerName',''), coalesce(item->'details','{}'::jsonb), v_proposal.source_kind,
      v_proposal.source_name, nullif(item->>'sourceRecordId',''), item->>'fingerprint',
      jsonb_build_object('proposalId', v_proposal.id, 'payloadHash', v_proposal.payload_hash)
    from jsonb_array_elements(coalesce(v_proposal.payload->'records', '[]'::jsonb)) item
    on conflict (user_id, fingerprint) do nothing;
  else
    v_requested := jsonb_array_length(coalesce(v_proposal.payload->'vitals', '[]'::jsonb));
    insert into public.vital_measurements (
      user_id, import_batch_id, metric, value, secondary_value, unit, observed_at,
      source_kind, source_name, source_record_id, device_name, fingerprint, provenance
    )
    select v_user_id, v_batch_id, item->>'metric', (item->>'value')::numeric,
      case when item ? 'secondaryValue' then (item->>'secondaryValue')::numeric else null end,
      item->>'unit', (item->>'observedAt')::timestamptz, v_proposal.source_kind, v_proposal.source_name,
      nullif(item->>'sourceRecordId',''), nullif(item->>'deviceName',''), item->>'fingerprint',
      jsonb_build_object('proposalId', v_proposal.id, 'payloadHash', v_proposal.payload_hash)
    from jsonb_array_elements(coalesce(v_proposal.payload->'vitals', '[]'::jsonb)) item
    on conflict (user_id, fingerprint) do nothing;
  end if;

  get diagnostics v_imported = row_count;
  update public.health_import_batches set imported_count = v_imported, duplicate_count = v_requested - v_imported where id = v_batch_id;
  v_result := jsonb_build_object('batchId', v_batch_id, 'importedCount', v_imported,
    'duplicateCount', v_requested - v_imported, 'sourceKind', v_proposal.source_kind,
    'sourceName', v_proposal.source_name);
  update public.health_import_proposals set status = 'confirmed', confirmed_at = now(), result = v_result where id = v_proposal.id;
  return v_result;
end;
$$;

revoke all on function private.confirm_health_import_proposal(uuid) from public;
grant execute on function private.confirm_health_import_proposal(uuid) to authenticated;
