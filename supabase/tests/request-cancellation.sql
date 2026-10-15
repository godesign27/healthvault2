-- Run after candidate in the same BEGIN/ROLLBACK transaction. Synthetic data only.
do $$
declare u uuid:=gen_random_uuid(); other_user uuid:=gen_random_uuid(); r uuid:=gen_random_uuid(); a uuid:=gen_random_uuid(); result jsonb;
begin
 insert into auth.users(id,email) values(u,'cancel-fixture-'||u||'@example.invalid'),(other_user,'cancel-fixture-'||other_user||'@example.invalid');
 insert into public.health_record_requests(id,user_id,provider_name,record_types,status,secure_token,expires_at)
 values(r,u::text,'Synthetic cancellation fixture',array['lab'],'sent','old-token',now()+interval '1 day');
 insert into public.inbound_upload_attempts(id,user_id,request_id,storage_bucket,storage_path,request_fingerprint)
 values(a,u,r,'record-request-files',r::text||'/'||a::text,repeat('a',64));
 result:=public.transition_record_request(r,other_user,'cancel');
 assert result->>'state'='not_found','Cross-owner cancellation accepted';
 result:=public.transition_record_request(r,u,'resend',repeat('b',36));
 assert result->>'state'='sent','Resend failed';
 result:=public.transition_record_request(r,u,'cancel');
 assert result->>'state'='cancelled','Cancel failed';
 assert (select state='abandoned' from public.inbound_upload_attempts where id=a),'Prepared upload retained';
 assert (select secure_token<>repeat('b',36) and expires_at<=now() from public.health_record_requests where id=r),'Link retained';
 assert public.transition_record_request(r,u,'cancel')=result,'Cancellation not idempotent';
 assert public.transition_record_request(r,u,'resend',repeat('c',36))->>'state'='closed','Resend revived cancelled request';
 begin
  perform public.reserve_request_upload(r,repeat('b',36),gen_random_uuid(),repeat('d',64));
  raise exception 'Cancelled upload accepted';
 exception when insufficient_privilege then null; end;
 begin
  perform public.finalize_request_upload(a,repeat('b',36),'{}');
  raise exception 'Cancelled finalization accepted';
 exception when insufficient_privilege then null; end;
 assert not exists(select 1 from public.health_records where id=a),'Record created after cancellation';
 begin
  update public.health_record_requests set status='sent' where id=r;
  raise exception 'Direct update reopened cancellation';
 exception when check_violation then null; end;
 r:=gen_random_uuid();
 insert into public.health_record_requests(id,user_id,provider_name,record_types,status)
 values(r,u::text,'Synthetic received request',array['lab'],'received');
 assert public.transition_record_request(r,u,'cancel')->>'state'='closed','Received request cancelled';
 update auth.users set banned_until=now()+interval '1 hour' where id=u;
 begin
  perform public.transition_record_request(r,u,'cancel');
  raise exception 'Banned owner allowed';
 exception when insufficient_privilege then null; end;
 assert not has_function_privilege('authenticated','public.transition_record_request(uuid,uuid,text,text)','execute'),'Client can forge owner';
 assert not has_function_privilege('anon','public.transition_record_request(uuid,uuid,text,text)','execute'),'Anonymous RPC access';
 perform set_config('health_vault.test_result','PASS: owner isolation, idempotent cancellation, link revocation, upload abandonment, resend refusal, upload refusal, received preservation and RPC permissions',true);
end $$;
select current_setting('health_vault.test_result') as result;
