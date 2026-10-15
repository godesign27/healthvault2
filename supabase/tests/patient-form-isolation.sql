-- Run as the migration/test operator. Fixtures are synthetic and always rolled back.
-- This tests database roles/JWT claims, not two end-to-end OAuth browser sessions.
begin;
insert into public.form_templates(id,title,description,category)
values ('isolation-rollback-fixture','Isolation test','Synthetic rollback only','test');
set local role authenticated;
do $$
declare
  a text := 'c9e106c0-d497-45ed-a681-72e402d596bd';
  b text := '94184c3c-4db5-471c-a0c3-3d9bf87b3f80';
  profile_a uuid;
  profile_b uuid;
  form_a uuid;
  affected integer;
begin
  perform set_config('request.jwt.claim.sub',a,true);
  insert into public.patient_profiles(user_id,name) values (a,'ISOLATION FIXTURE A') returning id into profile_a;
  insert into public.form_responses(template_id,patient_id,answers_json)
  values ('isolation-rollback-fixture',profile_a,'{"fixture":"A"}') returning id into form_a;
  assert (select count(*)=1 from public.patient_profiles where id=profile_a), 'Owner cannot read own profile';
  assert (select count(*)=1 from public.form_responses where id=form_a), 'Owner cannot read own form';
  update public.form_responses set answers_json='{"fixture":"A updated"}' where id=form_a;
  get diagnostics affected=row_count;
  assert affected=1,'Owner cannot update own form';
  update public.patient_profiles set name='ISOLATION FIXTURE A updated' where id=profile_a;
  get diagnostics affected=row_count;
  assert affected=1,'Owner cannot update own profile';

  perform set_config('request.jwt.claim.sub',b,true);
  insert into public.patient_profiles(user_id,name) values (b,'ISOLATION FIXTURE B') returning id into profile_b;
  assert (select count(*)=0 from public.patient_profiles where id=profile_a), 'B can read A profile';
  assert (select count(*)=0 from public.form_responses where id=form_a), 'B can read A form';
  update public.patient_profiles set name='Unexpected' where id=profile_a;
  get diagnostics affected=row_count;
  assert affected=0,'B changed A profile';
  update public.form_responses set answers_json='{"unexpected":true}' where id=form_a;
  get diagnostics affected=row_count;
  assert affected=0,'B changed A form';
  delete from public.form_responses where id=form_a;
  get diagnostics affected=row_count;
  assert affected=0,'B deleted A form';
  delete from public.patient_profiles where id=profile_a;
  get diagnostics affected=row_count;
  assert affected=0,'B deleted A profile';

  begin
    insert into public.patient_profiles(user_id,name) values (a,'FORGED');
    raise exception 'Forged profile accepted';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.form_responses(template_id,patient_id)
    values ('isolation-rollback-fixture',profile_a);
    raise exception 'Forged form accepted';
  exception when insufficient_privilege then null;
  end;

  perform set_config('request.jwt.claim.sub',a,true);
  begin
    update public.patient_profiles set user_id=b where id=profile_a;
    raise exception 'Profile owner reassignment accepted';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.form_responses set patient_id=profile_b where id=form_a;
    raise exception 'Form owner reassignment accepted';
  exception when insufficient_privilege then null;
  end;
  assert (select name='ISOLATION FIXTURE A updated' from public.patient_profiles where id=profile_a), 'A profile altered';
  assert (select answers_json='{"fixture":"A updated"}'::jsonb from public.form_responses where id=form_a), 'A form altered';
  assert (select count(*)=0 from public.patient_profiles where id=profile_b), 'A can read B profile';
  perform set_config('health_vault.fixture_profile',profile_a::text,true);
  perform set_config('health_vault.fixture_form',form_a::text,true);
end $$;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
do $$
begin
  assert (select count(*)=0 from public.patient_profiles where id=current_setting('health_vault.fixture_profile')::uuid), 'Anonymous profile read';
  assert (select count(*)=0 from public.form_responses where id=current_setting('health_vault.fixture_form')::uuid), 'Anonymous form read';
end $$;
select 'PASS: owner read/write, cross-owner read/update/delete denial, forged inserts and reassignments denied, anonymous reads denied' as result;
rollback;
