begin;
do $$
declare u uuid:=gen_random_uuid(); other_user uuid:=gen_random_uuid(); o uuid:=gen_random_uuid(); c uuid:=gen_random_uuid(); j uuid;
begin
 insert into auth.users(id,email) values(u,'fhir-preview-guard-'||u||'@example.invalid'),(other_user,'fhir-preview-guard-'||other_user||'@example.invalid');
 insert into public.provider_organizations(id,name) values(o,'Synthetic preview guard');
 insert into public.provider_connections(id,user_id,provider_organization_id,connection_method,status,fhir_access_token)
 values(c,u,o,'direct_provider_connection','active','old');
 assert public.save_fhir_preview(other_user,c,'old','{}','{}') is null,'Foreign owner preview allowed';
 assert not public.refresh_fhir_connection(other_user,c,'old','new',null,null),'Foreign owner refresh allowed';
 assert not public.refresh_fhir_connection(u,c,'stale','new',null,null),'Stale refresh allowed';
 assert public.refresh_fhir_connection(u,c,'old','new',null,null),'Refresh refused';
 assert public.save_fhir_preview(u,c,'old','{}','{}') is null,'Stale preview allowed';
 j:=public.save_fhir_preview(u,c,'new','{}','{}');assert j is not null,'Valid preview refused';
 assert (select status='preview' and completed_at is null from public.record_import_jobs where id=j),'Preview completed import';
 assert (select last_synced_at is null from public.provider_connections where id=c),'Preview advanced sync marker';
 update auth.users set banned_until=now()+interval '1 hour' where id=u;
 assert public.save_fhir_preview(u,c,'new','{}','{}') is null,'Banned preview allowed';
 assert not public.refresh_fhir_connection(u,c,'new','replacement',null,null),'Banned refresh allowed';
 update auth.users set banned_until=null where id=u;
 insert into public.account_erasure_blocks(user_id,request_id) values(u,gen_random_uuid());
 assert public.save_fhir_preview(u,c,'new','{}','{}') is null,'Blocked preview allowed';
 assert not public.refresh_fhir_connection(u,c,'new','replacement',null,null),'Blocked refresh allowed';
 delete from public.account_erasure_blocks where user_id=u;
 update public.provider_connections set status='pending' where id=c;
 assert public.save_fhir_preview(u,c,'new','{}','{}') is null,'Inactive preview allowed';
 assert not public.refresh_fhir_connection(u,c,'new','replacement',null,null),'Inactive refresh allowed';
 assert (select count(*)=1 from public.record_import_jobs where user_id=u),'Refusal persisted preview';
 assert not has_function_privilege('authenticated','public.save_fhir_preview(uuid,uuid,text,jsonb,jsonb)','execute'),'Client preview RPC allowed';
 assert not has_function_privilege('anon','public.refresh_fhir_connection(uuid,uuid,text,text,text,timestamptz)','execute'),'Anon refresh RPC allowed';
end;
$$;
rollback;
