-- Patient-owned, consent-bound imports from ChatGPT Health and direct provider sources.

create schema if not exists private;

create table if not exists public.health_import_proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_kind text not null check (source_kind in ('chatgpt_health_apple_health', 'chatgpt_health_medical_records', 'provider_fhir')),
  source_name text not null check (char_length(source_name) between 1 and 160),
  idempotency_key uuid not null,
  payload_hash text not null check (payload_hash ~ '^[a-f0-9]{64}$'),
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 262144),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'expired', 'cancelled')),
  result jsonb,
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create table if not exists public.health_import_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  proposal_id uuid not null unique references public.health_import_proposals(id),
  source_kind text not null,
  source_name text not null,
  imported_count integer not null default 0 check (imported_count >= 0),
  duplicate_count integer not null default 0 check (duplicate_count >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.vital_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  import_batch_id uuid references public.health_import_batches(id),
  metric text not null check (metric in ('heart_rate', 'blood_pressure', 'respiratory_rate', 'oxygen_saturation', 'body_temperature', 'weight', 'blood_glucose', 'steps', 'sleep_duration', 'active_energy', 'workout_duration')),
  value numeric not null,
  secondary_value numeric,
  unit text not null check (char_length(unit) between 1 and 32),
  observed_at timestamptz not null,
  source_kind text not null,
  source_name text not null check (char_length(source_name) between 1 and 160),
  source_record_id text check (source_record_id is null or char_length(source_record_id) <= 240),
  device_name text check (device_name is null or char_length(device_name) <= 160),
  fingerprint text not null check (fingerprint ~ '^[a-f0-9]{64}$'),
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, fingerprint),
  check ((metric = 'blood_pressure' and secondary_value is not null) or (metric <> 'blood_pressure' and secondary_value is null)),
  check (
    (metric = 'heart_rate' and unit = 'bpm' and value between 20 and 300) or
    (metric = 'blood_pressure' and unit = 'mmHg' and value between 40 and 300 and secondary_value between 20 and 200) or
    (metric = 'respiratory_rate' and unit = 'breaths/min' and value between 3 and 80) or
    (metric = 'oxygen_saturation' and unit = '%' and value between 0 and 100) or
    (metric = 'body_temperature' and ((unit = 'Cel' and value between 25 and 45) or (unit = '[degF]' and value between 77 and 113))) or
    (metric = 'weight' and ((unit = 'kg' and value between 0.5 and 1000) or (unit = 'lb' and value between 1 and 2205))) or
    (metric = 'blood_glucose' and ((unit = 'mg/dL' and value between 10 and 2000) or (unit = 'mmol/L' and value between 0.5 and 111))) or
    (metric = 'steps' and unit = 'count' and value between 0 and 1000000) or
    (metric = 'sleep_duration' and ((unit = 'min' and value between 0 and 1440) or (unit = 'h' and value between 0 and 24))) or
    (metric = 'active_energy' and unit = 'kcal' and value between 0 and 100000) or
    (metric = 'workout_duration' and ((unit = 'min' and value between 0 and 1440) or (unit = 'h' and value between 0 and 24)))
  )
);

create index if not exists vital_measurements_user_observed_idx
  on public.vital_measurements (user_id, observed_at desc);
create index if not exists health_import_proposals_user_status_idx
  on public.health_import_proposals (user_id, status, created_at desc);

alter table public.health_import_proposals enable row level security;
alter table public.health_import_batches enable row level security;
alter table public.vital_measurements enable row level security;

create policy health_import_proposals_select_own on public.health_import_proposals
  for select to authenticated using ((select auth.uid()) is not null and user_id = (select auth.uid()));
create policy health_import_proposals_insert_own on public.health_import_proposals
  for insert to authenticated with check ((select auth.uid()) is not null and user_id = (select auth.uid()) and status = 'pending');
create policy health_import_batches_select_own on public.health_import_batches
  for select to authenticated using ((select auth.uid()) is not null and user_id = (select auth.uid()));
create policy vital_measurements_select_own on public.vital_measurements
  for select to authenticated using ((select auth.uid()) is not null and user_id = (select auth.uid()));

revoke all on public.health_import_proposals, public.health_import_batches, public.vital_measurements from anon;
grant select, insert on public.health_import_proposals to authenticated;
grant select on public.health_import_batches, public.vital_measurements to authenticated;

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
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into v_proposal
  from public.health_import_proposals
  where id = p_proposal_id and user_id = v_user_id
  for update;

  if not found then raise exception 'Import proposal not found'; end if;
  if v_proposal.status = 'confirmed' then return v_proposal.result; end if;
  if v_proposal.status <> 'pending' then raise exception 'Import proposal is no longer available'; end if;
  if v_proposal.expires_at <= now() then raise exception 'Import proposal has expired. Preview the information again.'; end if;

  v_requested := jsonb_array_length(coalesce(v_proposal.payload->'vitals', '[]'::jsonb));
  insert into public.health_import_batches (user_id, proposal_id, source_kind, source_name)
  values (v_user_id, v_proposal.id, v_proposal.source_kind, v_proposal.source_name)
  returning id into v_batch_id;

  insert into public.vital_measurements (
    user_id, import_batch_id, metric, value, secondary_value, unit, observed_at,
    source_kind, source_name, source_record_id, device_name, fingerprint, provenance
  )
  select
    v_user_id,
    v_batch_id,
    item->>'metric',
    (item->>'value')::numeric,
    case when item ? 'secondaryValue' then (item->>'secondaryValue')::numeric else null end,
    item->>'unit',
    (item->>'observedAt')::timestamptz,
    v_proposal.source_kind,
    v_proposal.source_name,
    nullif(item->>'sourceRecordId', ''),
    nullif(item->>'deviceName', ''),
    item->>'fingerprint',
    jsonb_build_object('proposalId', v_proposal.id, 'payloadHash', v_proposal.payload_hash)
  from jsonb_array_elements(coalesce(v_proposal.payload->'vitals', '[]'::jsonb)) item
  on conflict (user_id, fingerprint) do nothing;

  get diagnostics v_imported = row_count;
  update public.health_import_batches
  set imported_count = v_imported, duplicate_count = v_requested - v_imported
  where id = v_batch_id;

  v_result := jsonb_build_object(
    'batchId', v_batch_id,
    'importedCount', v_imported,
    'duplicateCount', v_requested - v_imported,
    'sourceKind', v_proposal.source_kind,
    'sourceName', v_proposal.source_name
  );

  update public.health_import_proposals
  set status = 'confirmed', confirmed_at = now(), result = v_result
  where id = v_proposal.id;

  return v_result;
end;
$$;

revoke all on function private.confirm_health_import_proposal(uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.confirm_health_import_proposal(uuid) to authenticated;

create or replace function public.confirm_health_import_proposal(p_proposal_id uuid)
returns jsonb
language sql
security invoker
set search_path = public, pg_temp
as $$
  select private.confirm_health_import_proposal(p_proposal_id);
$$;

revoke all on function public.confirm_health_import_proposal(uuid) from public, anon;
grant execute on function public.confirm_health_import_proposal(uuid) to authenticated;
