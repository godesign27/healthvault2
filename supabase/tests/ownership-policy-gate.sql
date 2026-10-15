-- Read-only release guard. Run against the deployment target, not just a local schema.
-- Catches disabled RLS and unconditional authenticated/public policies on private tables.
-- Behavioral rollback tests remain necessary: this is not a complete policy proof.
begin;
do $$
declare
  target text;
  oid_value oid;
  policy record;
begin
  foreach target in array array[
    'patient_profiles','form_responses','form_answer_proposals',
    'share_events','share_confirmation_receipts','health_import_proposals',
    'conditions','medications','allergies','health_records','appointments'
  ] loop
    oid_value := to_regclass('public.' || target);
    if oid_value is null then raise exception 'Missing private table: %',target; end if;
    if not (select relrowsecurity from pg_class where oid=oid_value) then
      raise exception 'RLS disabled on %',target;
    end if;
    for policy in select * from pg_policies
      where schemaname='public' and tablename=target
        and roles && array['public','authenticated','anon']::name[]
    loop
      if policy.qual in ('true','(true)') or policy.with_check in ('true','(true)') then
        raise exception 'Unconditional client policy on %: %',target,policy.policyname;
      end if;
    end loop;
  end loop;
end $$;
select 'PASS: private-table RLS enabled; no unconditional client policies in release scope' as result;
rollback;
