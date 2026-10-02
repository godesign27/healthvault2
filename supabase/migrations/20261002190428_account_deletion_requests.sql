-- A request queue, not an erasure function. No account/data is deleted here.
create table public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete set null,
  confirmed boolean not null check (confirmed),
  status text not null default 'requested' check (status in ('requested','reviewing','completed','declined')),
  requested_at timestamptz not null default now(),
  resolved_at timestamptz,
  user_message text,
  check ((status in ('completed','declined')) = (resolved_at is not null))
);
-- Retain a non-identifying receipt after eventual approved erasure.
alter table public.account_deletion_requests alter column user_id drop not null;
create unique index account_deletion_requests_one_open on public.account_deletion_requests(user_id)
  where status in ('requested','reviewing');
alter table public.account_deletion_requests enable row level security;
revoke all on public.account_deletion_requests from public, anon, authenticated;
grant select (id,user_id,status,requested_at,resolved_at,user_message) on public.account_deletion_requests to authenticated;
grant insert (user_id,confirmed) on public.account_deletion_requests to authenticated;
grant all on public.account_deletion_requests to service_role;
create policy deletion_request_owner_read on public.account_deletion_requests for select to authenticated
  using (user_id = (select auth.uid()));
create policy deletion_request_owner_insert on public.account_deletion_requests for insert to authenticated
  with check (user_id = (select auth.uid()) and confirmed = true and status = 'requested');
comment on table public.account_deletion_requests is 'User-confirmed deletion requests for operator review. Receipt is not evidence of completed erasure. No automated deletion.';
