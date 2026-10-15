-- Preview only: rollback-only schedule override and synthetic aggregate fixtures.
begin;
do $$ begin
 if exists(select 1 from auth.users) then raise exception 'Only run on empty preview'; end if;
 if public.deletion_digest_due('2026-10-02 15:00:00+00') is not true
 or public.deletion_digest_due('2026-12-04 16:00:00+00') is not true
 or public.deletion_digest_due('2026-10-03 15:00:00+00') is not false
 or public.deletion_digest_due('2026-10-02 14:59:00+00') is not false
 or public.deletion_digest_due('2026-12-04 15:00:00+00') is not false
 then raise exception 'Timezone/weekday regression'; end if;
 if has_function_privilege('anon','public.claim_deletion_digest(text,boolean)','execute')
 or has_function_privilege('authenticated','public.claim_deletion_digest(text,boolean)','execute')
 or has_function_privilege('service_role','public.dispatch_deletion_digest(boolean)','execute')
 or has_table_privilege('authenticated','public.deletion_digest_runs','select') then
 raise exception 'Client access exposed'; end if;
end $$;
create or replace function public.deletion_digest_due(p_at timestamptz)
returns boolean language sql immutable security invoker set search_path='' as $$ select true; $$;
update public.deletion_digest_settings set enabled=true;
do $$ declare token text; c jsonb; second_claim jsonb; begin
 select decrypted_secret into token from vault.decrypted_secrets where name='deletion_digest_scheduler';
 if public.claim_deletion_digest('wrong',false)->>'state' <> 'unauthorized' then raise exception 'Auth'; end if;
 c:=public.claim_deletion_digest(token,false);
 if c->>'state' <> 'empty' then raise exception 'Empty queue'; end if;
 if not exists(select 1 from public.deletion_digest_runs where state='empty' and checked_at is not null) then raise exception 'No empty receipt'; end if;
 delete from public.deletion_digest_runs;
 insert into public.account_deletion_requests(user_id,confirmed,status,requested_at) values
 (null,true,'requested',now()-interval '2 days'),(null,true,'reviewing',now()-interval '1 day');
 c:=public.claim_deletion_digest(token,false);
 if c->>'state'<>'send' or (c->>'pending_count')::int<>2 then raise exception 'Aggregate'; end if;
 second_claim:=public.claim_deletion_digest(token,false);
 if second_claim->>'state'<>'busy' then raise exception 'Duplicate lease'; end if;
 if public.finish_deletion_digest(c->>'run_key',gen_random_uuid(),'wrong',null) then raise exception 'Wrong lease accepted'; end if;
 perform public.finish_deletion_digest(c->>'run_key',(c->>'lease_token')::uuid,null,'send_failed');
 insert into public.account_deletion_requests(user_id,confirmed,status) values(null,true,'requested');
 second_claim:=public.claim_deletion_digest(token,false);
 if (second_claim->>'pending_count')::int<>2 or second_claim->>'run_key'<>c->>'run_key' then raise exception 'Unstable retry'; end if;
 perform public.finish_deletion_digest(second_claim->>'run_key',(second_claim->>'lease_token')::uuid,'synthetic-provider-id',null);
 if public.claim_deletion_digest(token,false)->>'state'<>'accepted' then raise exception 'Duplicate send'; end if;
 if not exists(select 1 from public.deletion_digest_runs where attempts=2 and accepted_at is not null) then raise exception 'Receipt'; end if;
end $$;
rollback;
