-- CANDIDATE: applied to disposable preview only. Do not deploy to production until
-- bearer-link, privileged-job and complete ownership inventory gates are satisfied.
create schema if not exists account_control_private;
revoke all on schema account_control_private from public,anon;
grant usage on schema account_control_private to authenticated,service_role;
create table public.account_erasure_blocks (
 user_id uuid primary key, -- intentionally survives Auth removal; no cascading FK
 request_id uuid not null,
 blocked_at timestamptz not null default now()
);
alter table public.account_erasure_blocks enable row level security;
revoke all on public.account_erasure_blocks from public,anon,authenticated;
grant all on public.account_erasure_blocks to service_role;

-- A narrowly scoped, caller-bound lookup. No user-supplied target, no row data.
create function account_control_private.current_account_allowed()
returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null
   and exists(select 1 from auth.users u where u.id=auth.uid()
     and (u.banned_until is null or u.banned_until <= now()))
   and not exists(select 1 from public.account_erasure_blocks b where b.user_id=auth.uid());
$$;
revoke all on function account_control_private.current_account_allowed() from public,anon;
grant execute on function account_control_private.current_account_allowed() to authenticated,service_role;
create function public.current_account_access_allowed()
returns boolean language sql stable security invoker set search_path='' as $$
 select account_control_private.current_account_allowed();
$$;
revoke all on function public.current_account_access_allowed() from public,anon;
grant execute on function public.current_account_access_allowed() to authenticated,service_role;

create function public.operator_block_reviewed_account(p_user_id uuid,p_request_id uuid)
returns void language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.account_deletion_requests
   where id=p_request_id and user_id=p_user_id and confirmed and status='reviewing') then
   raise exception 'An exact reviewed deletion request is required';
 end if;
 insert into public.account_erasure_blocks(user_id,request_id) values(p_user_id,p_request_id)
 on conflict(user_id) do nothing;
end;
$$;
revoke all on function public.operator_block_reviewed_account(uuid,uuid) from public,anon,authenticated;
grant execute on function public.operator_block_reviewed_account(uuid,uuid) to service_role;

-- Restrictive policies supplement existing ownership policies, never replace them.
do $$ declare t text; begin
 foreach t in array array[
 'account_deletion_requests','user_profiles','patient_profiles','user_addresses','user_preferences',
 'conditions','medications','allergies','immunizations','encounters','appointments','care_team',
 'preventive_care','providers','pharmacies','insurance_coverages','insurance_policies','claims',
 'health_records','health_record_requests','medical_form_uploads','provider_connections',
 'diet_log_entries','life_signal_entries','vital_measurements','connected_health_records',
 'wellness_check_ins','wellness_insights','wellness_insight_feedback','wellness_partner_enrollments',
 'form_responses','share_events','patient_clinical_records','provider_access_grants',
 'form_answer_proposals','health_import_proposals','health_import_batches','record_request_files','record_import_jobs'
 ] loop
   if not exists(select 1 from pg_class c join pg_namespace n on c.relnamespace=n.oid
     where n.nspname='public' and c.relname=t and c.relrowsecurity) then
     raise exception 'Missing RLS table %; inspect schema before applying',t;
   end if;
   execute format('create policy account_erasure_access_gate on public.%I as restrictive for all to authenticated using ((select account_control_private.current_account_allowed())) with check ((select account_control_private.current_account_allowed()))',t);
 end loop;
end $$;
create policy account_erasure_access_gate on storage.objects as restrictive for all to authenticated
 using ((select account_control_private.current_account_allowed()))
 with check ((select account_control_private.current_account_allowed()));
