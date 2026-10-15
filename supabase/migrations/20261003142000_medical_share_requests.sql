-- Private send receipts; no recipient, form answers, URLs or bearer tokens stored here.
create table if not exists public.medical_share_requests (
  owner_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  payload_hash text not null,
  receipt jsonb,
  created_at timestamptz not null default now(),
  primary key (owner_id, request_id)
);
alter table public.medical_share_requests enable row level security;
revoke all on public.medical_share_requests from anon, authenticated;
grant select, insert, update, delete on public.medical_share_requests to service_role;
comment on table public.medical_share_requests is 'At-most-once form share claims. Pending claims must not be expired/retried automatically; a send may have occurred.';
