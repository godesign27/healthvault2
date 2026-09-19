-- Run after atomic_wellness_confirmation. All fixture rows are rolled back.
begin;
set local role authenticated;
do $$
declare
  user_a text := 'c9e106c0-d497-45ed-a681-72e402d596bd';
  user_b text := '94184c3c-4db5-471c-a0c3-3d9bf87b3f80';
  diet jsonb := '[{"event_time":"2040-01-02T08:00:00Z","meal_type":"breakfast","items":[{"name":"Isolation fixture","amount":null,"notes":null}],"notes":"rollback-only"}]';
  signal jsonb := '[{"event_time":"2040-01-02T08:00:00Z","energy":3,"sleep":3,"mood":3,"stress":3,"pain":3}]';
  first_result jsonb;
  repeated_result jsonb;
  affected integer;
begin
  perform set_config('request.jwt.claim.sub', user_a, true);
  first_result := public.confirm_wellness_entries('diet', diet);
  repeated_result := public.confirm_wellness_entries('diet', diet);
  assert first_result = repeated_result, 'Repeated diet confirmation changed the row';
  assert (select count(*) from public.diet_log_entries where user_id=user_a)=1, 'Duplicate diet row';
  first_result := public.confirm_wellness_entries('life_signal', signal);
  repeated_result := public.confirm_wellness_entries('life_signal', signal);
  assert first_result = repeated_result, 'Repeated signal confirmation changed the row';
  assert (select count(*) from public.life_signal_entries where user_id=user_a)=1, 'Duplicate signal row';

  -- A malformed second entry must roll back the entire batch, including its first insert.
  begin
    perform public.confirm_wellness_entries('diet', '[{"event_time":"2040-01-03T08:00:00Z","meal_type":"breakfast","items":[{"name":"Rollback fixture"}]},{"meal_type":"breakfast","items":[{"name":"Missing time"}]}]');
    raise exception 'Invalid batch unexpectedly succeeded';
  exception when others then
    assert sqlerrm like '%explicit event time%', 'Unexpected validation error';
  end;
  assert (select count(*) from public.diet_log_entries where user_id=user_a)=1, 'Partial batch persisted';

  perform set_config('request.jwt.claim.sub', user_b, true);
  assert (select count(*) from public.diet_log_entries where user_id=user_a)=0, 'Cross-account diet read';
  assert (select count(*) from public.life_signal_entries where user_id=user_a)=0, 'Cross-account signal read';
  update public.diet_log_entries set notes='forbidden' where user_id=user_a;
  get diagnostics affected = row_count;
  assert affected=0, 'Cross-account update';
  begin
    insert into public.diet_log_entries(user_id,meal_type,items) values(user_a,'breakfast','[]');
    raise exception 'Cross-account insert succeeded';
  exception when insufficient_privilege then null;
  end;
  repeated_result := public.confirm_wellness_entries('life_signal', signal);
  assert repeated_result->0->>'user_id'=user_b, 'Wrong owner on save';
  assert repeated_result->0->>'id'<>first_result->0->>'id', 'Cross-account duplicate result';
  perform set_config('request.jwt.claim.sub', '', true);
  begin
    perform public.confirm_wellness_entries('diet', diet);
    raise exception 'Missing identity accepted';
  exception when others then
    assert sqlerrm='Authentication required', 'Unexpected anonymous error';
  end;
  perform set_config('health_vault.test_result','PASS: repeats, batch rollback, two-identity read/write isolation, missing identity',true);
exception when others then
  perform set_config('health_vault.test_result','FAIL: ' || sqlerrm,true);
end $$;
select current_setting('health_vault.test_result') as result;
rollback;
