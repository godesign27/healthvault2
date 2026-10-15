-- Synthetic identities only. All fixtures roll back; no emails or external calls.
begin;
set local role authenticated;
do $$
declare
  a text := 'c9e106c0-d497-45ed-a681-72e402d596bd';
  b text := '94184c3c-4db5-471c-a0c3-3d9bf87b3f80';
  fixture jsonb;
  first_row jsonb;
  repeated jsonb;
  other_row jsonb;
  changed jsonb;
  affected integer;
  visible integer;
begin
  for fixture in select value from jsonb_array_elements('[
    {"kind":"conditions","value":{"name":"Rollback condition","status":"Active","diagnosed_on":null,"managing_physician":null,"notes":null}},
    {"kind":"medications","value":{"name":"Rollback medication","dosage":null,"frequency":null,"prescribed_by":null,"start_date":null,"end_date":null,"notes":null}},
    {"kind":"allergies","value":{"allergen":"Rollback allergy","reaction":null,"severity":null,"diagnosed_on":null,"notes":null}},
    {"kind":"health_records","value":{"title":"Rollback record","kind":"other","provider_name":null,"service_date":null,"ai_summary":null,"tags":["one","two"],"source":"shared"}},
    {"kind":"appointments","value":{"provider_name":"Rollback provider","appointment_type":"Test","scheduled_at":"2099-01-01T15:00:00Z","location":null,"notes":null,"status":"scheduled"}}
  ]'::jsonb) loop
    perform set_config('request.jwt.claim.sub',a,true);
    first_row := public.confirm_health_record(fixture->>'kind',fixture->'value');
    repeated := public.confirm_health_record(fixture->>'kind',fixture->'value');
    assert first_row->>'id'=repeated->>'id','Replay created a duplicate';
    assert first_row->>'user_id'=a,'Incorrect owner';
    changed := fixture->'value' || case when fixture->>'kind'='health_records'
      then '{"tags":["one"]}'::jsonb else '{"notes":"Different details"}'::jsonb end;
    begin
      perform public.confirm_health_record(fixture->>'kind',changed);
      raise exception 'Conflicting details accepted';
    exception when others then
      assert sqlerrm like 'A matching record already exists%', 'Unexpected conflict result: ' || sqlerrm;
    end;
    begin
      perform public.confirm_health_record(fixture->>'kind',fixture->'value' || jsonb_build_object('user_id',b));
      raise exception 'Forged ownership accepted';
    exception when others then
      assert sqlerrm='Confirmation fields do not match the review','Unexpected ownership validation';
    end;
    perform set_config('request.jwt.claim.sub',b,true);
    execute format('select count(*) from public.%I where id=$1::uuid',fixture->>'kind') into visible using first_row->>'id';
    assert visible=0,'Other owner can read fixture';
    execute format('delete from public.%I where id=$1::uuid',fixture->>'kind') using first_row->>'id';
    get diagnostics affected=row_count;
    assert affected=0,'Other owner deleted fixture';
    other_row := public.confirm_health_record(fixture->>'kind',fixture->'value');
    assert other_row->>'id'<>first_row->>'id' and other_row->>'user_id'=b,'Owners shared a result';
    perform set_config('request.jwt.claim.sub',a,true);
    repeated := public.confirm_health_record(fixture->>'kind',fixture->'value');
    assert repeated=first_row,'Other owner changed original fixture';
  end loop;
  perform set_config('request.jwt.claim.sub','',true);
  begin
    perform public.confirm_health_record('conditions','{}');
    raise exception 'Unauthenticated call accepted';
  exception when others then
    assert sqlerrm='Authentication required','Unexpected missing identity result';
  end;
  perform set_config('health_vault.test_result','PASS: five kinds, exact retries, conflict rejection, owner isolation, forged owner and missing identity rejection',true);
exception when others then
  perform set_config('health_vault.test_result','FAIL: ' || sqlerrm,true);
end $$;
select current_setting('health_vault.test_result') as result;
rollback;
