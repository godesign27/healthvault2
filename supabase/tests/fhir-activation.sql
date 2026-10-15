begin;
do $$
declare u uuid:=gen_random_uuid(); o uuid:=gen_random_uuid(); c uuid:=gen_random_uuid(); s uuid:=gen_random_uuid(); n integer;
begin
 insert into auth.users(id,email) values(u,'fhir-guard-'||u||'@example.invalid');
 insert into public.provider_organizations(id,name) values(o,'Synthetic OAuth guard');
 insert into public.provider_connections(id,user_id,provider_organization_id,connection_method,status) values(c,u,o,'direct_provider_connection','pending');
 insert into public.fhir_oauth_states(id,user_id,connection_id,provider_organization_id,state,code_verifier,connection_method,expires_at)
 values(s,u,c,o,s::text,'synthetic-verifier','direct_provider_connection',now()+interval '10 minutes');
 assert not public.activate_fhir_connection(s,'synthetic',null,'synthetic-patient',now()+interval '1 hour'),'Unclaimed state activated';
 update public.fhir_oauth_states set consumed_at=now() where id=s and consumed_at is null and expires_at>now();
 get diagnostics n=row_count;assert n=1,'First claim failed';
 update public.fhir_oauth_states set consumed_at=now() where id=s and consumed_at is null and expires_at>now();
 get diagnostics n=row_count;assert n=0,'Replay claimed state';
 update auth.users set banned_until=now()+interval '1 hour' where id=u;
 assert not public.activate_fhir_connection(s,'synthetic',null,'synthetic-patient',now()+interval '1 hour'),'Banned account activated';
 update auth.users set banned_until=null where id=u;
 update public.fhir_oauth_states set expires_at=now()-interval '1 second' where id=s;
 assert not public.activate_fhir_connection(s,'synthetic',null,'synthetic-patient',now()+interval '1 hour'),'Expired state activated';
 update public.fhir_oauth_states set expires_at=now()+interval '10 minutes' where id=s;
 assert public.activate_fhir_connection(s,'synthetic',null,'synthetic-patient',now()+interval '1 hour'),'Valid activation failed';
 assert not public.activate_fhir_connection(s,'replacement',null,'synthetic-patient',now()+interval '1 hour'),'Repeat activation allowed';
 assert (select fhir_access_token='synthetic' from public.provider_connections where id=c),'Replay replaced token';
 assert not has_function_privilege('authenticated','public.activate_fhir_connection(uuid,text,text,text,timestamptz)','execute'),'Client activation allowed';
 assert not has_function_privilege('anon','public.activate_fhir_connection(uuid,text,text,text,timestamptz)','execute'),'Anon activation allowed';
end;
$$;
rollback;
