-- Delivery metadata only; never store email bodies or attachments in the Vault.
create table public.support_email_deliveries (
  email_id uuid primary key,
  first_attempt_at timestamptz not null default now(),
  forwarded_id uuid,
  forwarded_at timestamptz,
  constraint support_email_delivery_completed check ((forwarded_id is null) = (forwarded_at is null))
);
alter table public.support_email_deliveries enable row level security;
revoke all on public.support_email_deliveries from public, anon, authenticated;
grant select, insert, update on public.support_email_deliveries to service_role;
comment on table public.support_email_deliveries is 'Internal Resend support-forwarding receipts. Service-role only. No message content.';
