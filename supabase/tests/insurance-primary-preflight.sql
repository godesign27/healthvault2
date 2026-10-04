-- Read-only rollout preflight. Run on the explicitly approved deployment target.
-- A nonzero duplicate count blocks the unique index. Do not choose a winner automatically.
select count(*) as owners_with_duplicate_primaries
from (
  select user_id from public.insurance_coverages
  where is_primary = true group by user_id having count(*) > 1
) duplicate_owners;

-- Review historical primary flags that would not be selectable by the new RPC.
select count(*) as inactive_primary_rows
from public.insurance_coverages
where is_primary = true and coverage_status is distinct from 'active';

-- Confirm RLS is enabled and inspect whether this migration has already been installed.
select relrowsecurity as coverage_rls_enabled
from pg_class where oid = 'public.insurance_coverages'::regclass;
select to_regprocedure('public.set_primary_insurance(uuid)') as primary_rpc,
       to_regclass('public.insurance_coverages_one_primary_per_user') as primary_unique_index;
