-- Requires two existing auth users; uses their IDs only, never their health data.
-- Set health_vault.test_owner_a and health_vault.test_owner_b in this session first.
-- Fixture proposals are rolled back and cannot save a real form.
begin;
set local role authenticated;
do $$
declare
  a text := current_setting('health_vault.test_owner_a');
  b text := current_setting('health_vault.test_owner_b');
  proposal uuid;
  affected integer;
begin
  assert a<>b,'Two distinct fixture owners are required';
  perform set_config('request.jwt.claim.sub',a,true);
  insert into public.form_answer_proposals(user_id,patient_id,template_id,template_version,proposed_answers,expires_at)
  values(a::uuid,gen_random_uuid(),'rollback-isolation-test','test-only','{"fixture":true}',now()-interval '1 minute')
  returning id into proposal;
  assert (select count(*)=1 from public.form_answer_proposals where id=proposal),'Owner cannot read own proposal';
  perform set_config('request.jwt.claim.sub',b,true);
  assert (select count(*)=0 from public.form_answer_proposals where id=proposal),'Other account reads proposal';
  update public.form_answer_proposals set confirmed_at=now() where id=proposal;
  get diagnostics affected=row_count;
  assert affected=0,'Other account confirms proposal';
  delete from public.form_answer_proposals where id=proposal;
  get diagnostics affected=row_count;
  assert affected=0,'Other account deletes proposal';
  begin
    insert into public.form_answer_proposals(user_id,patient_id,template_id,template_version,proposed_answers,expires_at)
    values(a::uuid,gen_random_uuid(),'rollback-isolation-test','test-only','{"fixture":true}',now()-interval '1 minute');
    raise exception 'Forged proposal owner accepted';
  exception when insufficient_privilege then null;
  end;
  perform set_config('request.jwt.claim.sub',a,true);
  begin
    update public.form_answer_proposals set user_id=b::uuid where id=proposal;
    raise exception 'Proposal owner reassignment accepted';
  exception when insufficient_privilege then null;
  end;
  assert (select confirmed_at is null and proposed_answers='{"fixture":true}'::jsonb from public.form_answer_proposals where id=proposal),'Proposal changed';
end $$;
select 'PASS: owner read, cross-account read/confirm/delete denied, forged owner and reassignment denied' as result;
rollback;
