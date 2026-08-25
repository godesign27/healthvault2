-- Ensure the two-step medical-form confirmation workflow has durable,
-- short-lived proposal storage.
--
-- The MCP server writes validated answers here during the review step. A
-- separate explicit confirmation consumes the proposal and writes the
-- authoritative form response. Proposals are always scoped to one signed-in
-- user and expire after the application-defined review window.

create table if not exists public.form_answer_proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  patient_id uuid not null,
  response_id uuid,
  template_id text not null,
  template_version text not null,
  proposed_answers jsonb not null default '{}'::jsonb,
  expected_response_updated_at timestamptz,
  expires_at timestamptz not null,
  status text not null default 'pending',
  confirmed_at timestamptz,
  consumed_at timestamptz,
  used_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint form_answer_proposals_answers_are_object
    check (jsonb_typeof(proposed_answers) = 'object')
);

-- Keep this migration safe to apply after an incomplete/manual table creation.
alter table public.form_answer_proposals
  add column if not exists status text not null default 'pending',
  add column if not exists confirmed_at timestamptz,
  add column if not exists consumed_at timestamptz,
  add column if not exists used_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

-- Early/manual versions of this table used an integer here, but catalog
-- versions such as "2025.01" are application strings.
alter table public.form_answer_proposals
  alter column template_version type text using template_version::text;

comment on table public.form_answer_proposals is
  'Short-lived, user-scoped proposals used by the medical-form preview then explicit-confirmation workflow.';

comment on column public.form_answer_proposals.expected_response_updated_at is
  'Optimistic-concurrency value captured when the proposal is prepared.';

create index if not exists form_answer_proposals_user_created_idx
  on public.form_answer_proposals (user_id, created_at desc);

create index if not exists form_answer_proposals_user_status_idx
  on public.form_answer_proposals (user_id, status);

create index if not exists form_answer_proposals_expires_at_idx
  on public.form_answer_proposals (expires_at);

create index if not exists form_answer_proposals_response_id_idx
  on public.form_answer_proposals (response_id)
  where response_id is not null;

alter table public.form_answer_proposals enable row level security;
alter table public.form_answer_proposals force row level security;

drop policy if exists "Users can read their own form answer proposals"
  on public.form_answer_proposals;
create policy "Users can read their own form answer proposals"
  on public.form_answer_proposals
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own form answer proposals"
  on public.form_answer_proposals;
create policy "Users can create their own form answer proposals"
  on public.form_answer_proposals
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own form answer proposals"
  on public.form_answer_proposals;
create policy "Users can update their own form answer proposals"
  on public.form_answer_proposals
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own form answer proposals"
  on public.form_answer_proposals;
create policy "Users can delete their own form answer proposals"
  on public.form_answer_proposals
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.form_answer_proposals from public;
revoke all on table public.form_answer_proposals from anon;
grant select, insert, update, delete
  on table public.form_answer_proposals
  to authenticated;
