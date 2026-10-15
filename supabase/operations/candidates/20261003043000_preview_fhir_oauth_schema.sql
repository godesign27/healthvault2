-- Preview OAuth prerequisites. Does not seed or enable a provider connection.
alter table public.provider_organizations
 add column if not exists authorization_endpoint text,
 add column if not exists token_endpoint text,
 add column if not exists smart_scopes text;

create table if not exists public.fhir_oauth_states (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null,
 connection_id uuid not null references public.provider_connections(id) on delete cascade,
 provider_organization_id uuid not null references public.provider_organizations(id),
 state text not null unique,
 code_verifier text not null,
 connection_method text not null,
 redirect_after text,
 expires_at timestamptz not null,
 consumed_at timestamptz,
 created_at timestamptz not null default now()
);
create index if not exists idx_fhir_oauth_states_expires on public.fhir_oauth_states(expires_at);
alter table public.fhir_oauth_states enable row level security;
revoke all on public.fhir_oauth_states from public, anon, authenticated;
grant all on public.fhir_oauth_states to service_role;
