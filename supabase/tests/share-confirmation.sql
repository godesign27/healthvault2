-- Fixture-only integration test; no email service is called, all rows roll back.
begin;
set local role authenticated;
do $$
declare
  a text := 'c9e106c0-d497-45ed-a681-72e402d596bd';
  b text := '94184c3c-4db5-471c-a0c3-3d9bf87b3f80';
  key text := repeat('a',64);
  first_claim jsonb;
  other_claim jsonb;
  repeated jsonb;
  result jsonb;
  affected integer;
begin
  perform set_config('request.jwt.claim.sub',a,true);
  first_claim := public.claim_share_confirmation('medical_form_email',key);
  assert first_claim->>'status'='claimed', 'First claim unavailable';
  repeated := public.claim_share_confirmation('medical_form_email',key);
  assert repeated->>'status'='pending', 'Pending claim was reissued';
  assert repeated->>'id'=first_claim->>'id', 'Pending identity changed';
  insert into public.share_events(id,patient_id,form_response_ids,method,recipient,status,expires_at,share_token,is_revoked)
    values((first_claim->>'id')::uuid,a,'{}','SecureLink','{"displayName":"Rollback fixture"}','sent',now()+interval '1 day',gen_random_uuid()::text,false);
  result := jsonb_build_object('id',first_claim->>'id','emailDelivery',jsonb_build_object('recipient',jsonb_build_object('sent',true)));
  perform public.complete_share_confirmation((first_claim->>'id')::uuid,result);
  repeated := public.claim_share_confirmation('medical_form_email',key);
  assert repeated->>'status'='completed' and repeated->'result'=result, 'Completed result not reused';

  perform set_config('request.jwt.claim.sub',b,true);
  assert (select count(*) from public.share_confirmation_receipts where user_id=a::uuid)=0, 'Other owner can read receipt';
  assert (select count(*) from public.share_events where patient_id=a)=0, 'Other owner can read share';
  update public.share_events set is_revoked=true where id=(first_claim->>'id')::uuid;
  get diagnostics affected = row_count;
  assert affected=0, 'Other owner revoked share';
  begin
    perform public.complete_share_confirmation((first_claim->>'id')::uuid,result);
    raise exception 'Other owner completed receipt';
  exception when others then
    assert sqlerrm like '%accessible share%', 'Unexpected ownership error';
  end;
  other_claim := public.claim_share_confirmation('medical_form_email',key);
  assert other_claim->>'status'='claimed' and other_claim->>'id'<>first_claim->>'id', 'Owners shared an operation';

  perform set_config('request.jwt.claim.sub',a,true);
  update public.share_events set is_revoked=true where id=(first_claim->>'id')::uuid;
  repeated := public.claim_share_confirmation('medical_form_email',key);
  assert repeated->>'status'='claimed' and repeated->>'id'<>first_claim->>'id', 'Revoked link was reused';
  first_claim := repeated;
  insert into public.share_events(id,patient_id,form_response_ids,method,recipient,status,expires_at,share_token,is_revoked)
    values((first_claim->>'id')::uuid,a,'{}','SecureLink','{}','sent',now()-interval '1 day',gen_random_uuid()::text,false);
  perform public.complete_share_confirmation((first_claim->>'id')::uuid,jsonb_build_object('id',first_claim->>'id'));
  repeated := public.claim_share_confirmation('medical_form_email',key);
  assert repeated->>'status'='claimed' and repeated->>'id'<>first_claim->>'id', 'Expired link was reused';
  perform set_config('health_vault.test_result','PASS: pending lock, result reuse, owner isolation, revoke/expiry replacement',true);
exception when others then
  perform set_config('health_vault.test_result','FAIL: ' || sqlerrm,true);
end $$;
select current_setting('health_vault.test_result') as result;
rollback;
