-- Count-only, operator-authorized monitor. Installing does not activate delivery.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create table public.deletion_digest_settings (
  id boolean primary key default true check (id),
  enabled boolean not null default false,
  project_url text check (project_url ~ '^https://[a-z]+\.supabase\.co$')
);
insert into public.deletion_digest_settings(id) values (true);
create table public.deletion_digest_runs (
  run_key text primary key,
  scheduled_date date not null,
  verification boolean not null default false,
  checked_at timestamptz not null default now(),
  pending_count bigint not null check (pending_count >= 0),
  oldest_date date,
  state text not null check (state in ('empty','sending','failed','accepted')),
  attempts integer not null default 0,
  lease_token uuid,
  lease_until timestamptz,
  provider_id text,
  accepted_at timestamptz,
  error_code text check (error_code is null or error_code in ('send_failed','receipt_failed'))
);
create table public.deletion_digest_dispatches (
  id bigint generated always as identity primary key,
  dispatched_at timestamptz not null default now(),
  verification boolean not null,
  request_id bigint not null
);
alter table public.deletion_digest_settings enable row level security;
alter table public.deletion_digest_runs enable row level security;
alter table public.deletion_digest_dispatches enable row level security;
revoke all on public.deletion_digest_settings, public.deletion_digest_runs, public.deletion_digest_dispatches from public, anon, authenticated;
grant all on public.deletion_digest_settings, public.deletion_digest_runs, public.deletion_digest_dispatches to service_role;
grant usage, select on sequence public.deletion_digest_dispatches_id_seq to service_role;

-- Generated inside the database: never copied into source, browser, or cron text.
select vault.create_secret(gen_random_uuid()::text || gen_random_uuid()::text,
  'deletion_digest_scheduler', 'Internal count-only deletion monitor credential');

create function public.deletion_digest_due(p_at timestamptz)
returns boolean language sql immutable security invoker set search_path = '' as $$
  select extract(isodow from p_at at time zone 'America/Denver') between 1 and 5
    and extract(hour from p_at at time zone 'America/Denver') = 9;
$$;

-- Auth + atomic daily snapshot/lease. No health records or patient identifiers returned.
create function public.claim_deletion_digest(p_token text, p_verification boolean default false)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  local_date date := (now() at time zone 'America/Denver')::date;
  key text := case when p_verification then 'verification/' else 'digest/' end || local_date::text;
  r public.deletion_digest_runs%rowtype;
  n bigint; oldest date;
begin
  if not exists (select 1 from vault.decrypted_secrets where name = 'deletion_digest_scheduler'
    and decrypted_secret = p_token) then
    return jsonb_build_object('state','unauthorized');
  end if;
  if not p_verification and (not public.deletion_digest_due(now()) or
    not (select enabled from public.deletion_digest_settings where id)) then
    return jsonb_build_object('state','outside_schedule');
  end if;
  -- Serializes a date's aggregate and claims, including concurrent first inserts.
  perform pg_advisory_xact_lock(hashtextextended(key, 0));
  select * into r from public.deletion_digest_runs where run_key = key for update;
  if not found then
    if p_verification then n := 0; oldest := null;
    else
      select count(*), (min(requested_at) at time zone 'America/Denver')::date into n, oldest
        from public.account_deletion_requests where status in ('requested','reviewing');
    end if;
    insert into public.deletion_digest_runs(run_key,scheduled_date,verification,pending_count,oldest_date,state)
      values (key,local_date,p_verification,n,oldest,case when n=0 and not p_verification then 'empty' else 'failed' end)
      returning * into r;
  end if;
  if r.state in ('empty','accepted') then return jsonb_build_object('state',r.state); end if;
  if r.lease_until > now() then return jsonb_build_object('state','busy'); end if;
  -- Resend idempotency retention is 24 hours; do not retry an ambiguous old send.
  if r.checked_at < now() - interval '23 hours' then return jsonb_build_object('state','manual_review'); end if;
  update public.deletion_digest_runs set state='sending', attempts=attempts+1,
    lease_token=gen_random_uuid(), lease_until=now()+interval '5 minutes', error_code=null
    where run_key=key returning * into r;
  return jsonb_build_object('state','send','run_key',r.run_key,'lease_token',r.lease_token,
    'pending_count',r.pending_count,'oldest_date',r.oldest_date,'verification',r.verification);
end;
$$;

create function public.finish_deletion_digest(p_key text,p_lease uuid,p_provider_id text,p_error text default null)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  if p_provider_id is null and p_error is null then raise exception 'Result required'; end if;
  update public.deletion_digest_runs set
    state=case when p_provider_id is not null then 'accepted' else 'failed' end,
    provider_id=p_provider_id, accepted_at=case when p_provider_id is not null then now() end,
    error_code=case when p_provider_id is null then p_error end, lease_until=null
    where run_key=p_key and lease_token=p_lease and state='sending';
  return found;
end;
$$;

-- postgres invokes this from cron. Fixed endpoint/body; no caller-selected destination.
create function public.dispatch_deletion_digest(p_verification boolean default false)
returns bigint language plpgsql security invoker set search_path = '' as $$
declare endpoint text; credential text; request bigint;
begin
  select project_url into endpoint from public.deletion_digest_settings where id
    and (enabled or p_verification);
  if endpoint is null or (not p_verification and not public.deletion_digest_due(now())) then return null; end if;
  select decrypted_secret into credential from vault.decrypted_secrets where name='deletion_digest_scheduler';
  if credential is null then raise exception 'Monitor credential missing'; end if;
  select net.http_post(url:=endpoint || '/functions/v1/deletion-digest',
    headers:=jsonb_build_object('Content-Type','application/json','x-deletion-monitor-key',credential,
      'x-monitor-verification',case when p_verification then '1' else '0' end),
    body:='{}'::jsonb, timeout_milliseconds:=60000) into request;
  insert into public.deletion_digest_dispatches(verification,request_id) values(p_verification,request);
  return request;
end;
$$;

-- Restricted operational status: absent/failed daily runs are visible even if mail fails.
create view public.deletion_digest_health with (security_invoker=true) as
with expected as (
 select max(d::date) as expected_date from generate_series(
   (now() at time zone 'America/Denver')::date - 7,
   (now() at time zone 'America/Denver')::date, interval '1 day') d
 where extract(isodow from d) between 1 and 5
   and d + interval '9 hours 45 minutes' <= now() at time zone 'America/Denver'
)
select s.enabled, e.expected_date, r.state, r.checked_at, r.accepted_at, r.error_code,
  case when not s.enabled then 'disabled'
       when r.state in ('empty','accepted') then 'ok' else 'needs_attention' end as health
from public.deletion_digest_settings s cross join expected e
left join public.deletion_digest_runs r on r.run_key='digest/' || e.expected_date::text;
revoke all on public.deletion_digest_health from public,anon,authenticated;
grant select on public.deletion_digest_health to service_role;
revoke all on function public.deletion_digest_due(timestamptz),
 public.claim_deletion_digest(text,boolean), public.finish_deletion_digest(text,uuid,text,text),
 public.dispatch_deletion_digest(boolean) from public,anon,authenticated;
grant execute on function public.deletion_digest_due(timestamptz),
 public.claim_deletion_digest(text,boolean), public.finish_deletion_digest(text,uuid,text,text) to service_role;
-- dispatch is only for the database operator/cron, never callable by app roles.
revoke all on function public.dispatch_deletion_digest(boolean) from service_role;
