alter table public.deletion_digest_settings add column activated_at timestamptz;
create or replace view public.deletion_digest_health with (security_invoker=true) as
with expected as (
 select max(d::date) as expected_date from public.deletion_digest_settings s,
 lateral generate_series((now() at time zone 'America/Denver')::date - 7,
   (now() at time zone 'America/Denver')::date, interval '1 day') d
 where extract(isodow from d) between 1 and 5
   and d + interval '9 hours 45 minutes' <= now() at time zone 'America/Denver'
   and d + interval '9 hours' >= s.activated_at at time zone 'America/Denver'
)
select s.enabled, e.expected_date, r.state, r.checked_at, r.accepted_at, r.error_code,
  case when not s.enabled then 'disabled'
       when e.expected_date is null then 'awaiting_first_run'
       when r.state in ('empty','accepted') then 'ok' else 'needs_attention' end as health
from public.deletion_digest_settings s cross join expected e
left join public.deletion_digest_runs r on r.run_key='digest/' || e.expected_date::text;
