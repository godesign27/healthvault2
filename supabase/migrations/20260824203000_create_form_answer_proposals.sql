-- Pending, user-approved medical-form mutations.
--
-- The ChatGPT flow first writes a short-lived proposal containing validated
-- answers. A separate confirmation call consumes that proposal and updates the
-- authoritative form response. This table must never be exposed across users.

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
  confirmed_at timestamptz,
  used_at timestamptz,
  consumed_at timestamptz,
  cancelled_at timestamptz,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint form_answer_proposals_answers_are_object
    check (jsonb_typeof(proposed_answers) = 'object')
);

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

create policy "Users can read their own form answer proposals"
  on public.form_answer_proposals
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own form answer proposals"
  on public.form_answer_proposals
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own form answer proposals"
  on public.form_answer_proposals
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own form answer proposals"
  on public.form_answer_proposals
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.form_answer_proposals from anon;
grant select, insert, update, delete on table public.form_answer_proposals to authenticated;
