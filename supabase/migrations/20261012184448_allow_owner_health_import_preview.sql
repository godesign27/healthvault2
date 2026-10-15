-- Preview was missing the owner policies production already uses.
-- Authenticated users can read and create only their own pending import
-- previews. Confirmation stays in the private security-definer function.

grant select, insert on table public.health_import_proposals to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'health_import_proposals'
      and policyname = 'health_import_proposals_select_own'
  ) then
    create policy health_import_proposals_select_own
      on public.health_import_proposals
      for select
      to authenticated
      using (((select auth.uid()) is not null) and (user_id = (select auth.uid())));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'health_import_proposals'
      and policyname = 'health_import_proposals_insert_own'
  ) then
    create policy health_import_proposals_insert_own
      on public.health_import_proposals
      for insert
      to authenticated
      with check (
        ((select auth.uid()) is not null)
        and (user_id = (select auth.uid()))
        and (status = 'pending')
      );
  end if;
end $$;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.confirm_health_import_proposal(p_proposal_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
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
$function$;

alter function private.confirm_health_import_proposal(uuid) owner to postgres;
revoke all on function private.confirm_health_import_proposal(uuid) from public, anon;
grant execute on function private.confirm_health_import_proposal(uuid) to authenticated;

create or replace function public.confirm_health_import_proposal(p_proposal_id uuid)
returns jsonb
language sql
set search_path to 'public', 'pg_temp'
as $function$
  select private.confirm_health_import_proposal(p_proposal_id);
$function$;

alter function public.confirm_health_import_proposal(uuid) owner to postgres;
revoke all on function public.confirm_health_import_proposal(uuid) from public, anon;
grant execute on function public.confirm_health_import_proposal(uuid) to authenticated, service_role;
