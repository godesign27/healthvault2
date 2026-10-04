-- Abort rather than choosing a winner if historical duplicate primaries exist.
create unique index if not exists insurance_coverages_one_primary_per_user
  on public.insurance_coverages (user_id) where is_primary = true;

create or replace function public.set_primary_insurance(p_coverage_id uuid)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_target uuid;
begin
  if v_user is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text, 42));
  select id into v_target from public.insurance_coverages
    where id = p_coverage_id and user_id = v_user and coverage_status = 'active'
    for update;
  if v_target is null then raise exception 'Active coverage not found' using errcode = 'P0002'; end if;
  update public.insurance_coverages set is_primary = false, updated_at = now()
    where user_id = v_user and is_primary = true;
  update public.insurance_coverages set is_primary = true, updated_at = now()
    where id = v_target and user_id = v_user;
  if not found then raise exception 'Coverage update failed'; end if;
  return v_target;
end;
$$;
revoke all on function public.set_primary_insurance(uuid) from public, anon;
grant execute on function public.set_primary_insurance(uuid) to authenticated;
