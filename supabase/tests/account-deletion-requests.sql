-- Rollback-only regression. Supply two existing auth user UUIDs as session settings.
begin;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub',current_setting('health_vault.test_owner_a'),'role','authenticated')::text,true);
do $$ begin
  insert into public.account_deletion_requests(user_id,confirmed) values (auth.uid(),true);
  if (select count(*) from public.account_deletion_requests where user_id=auth.uid() and status='requested') <> 1 then raise exception 'Owner read failed'; end if;
  begin
    insert into public.account_deletion_requests(user_id,confirmed) values (auth.uid(),true);
    raise exception 'Duplicate accepted';
  exception when unique_violation then null; end;
  begin
    insert into public.account_deletion_requests(user_id,confirmed,status) values (auth.uid(),true,'completed');
    raise exception 'Forged completion accepted';
  exception when insufficient_privilege then null; end;
  begin
    update public.account_deletion_requests set status='completed' where user_id=auth.uid();
    raise exception 'Owner can claim completed';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims', json_build_object('sub',current_setting('health_vault.test_owner_b'),'role','authenticated')::text,true);
do $$ begin
  if exists (select id from public.account_deletion_requests where user_id=current_setting('health_vault.test_owner_a')::uuid) then raise exception 'Foreign receipt visible'; end if;
  begin
    insert into public.account_deletion_requests(user_id,confirmed) values (current_setting('health_vault.test_owner_a')::uuid,true);
    raise exception 'Foreign request accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.account_deletion_requests(user_id,confirmed) values (auth.uid(),false);
    raise exception 'Unconfirmed request accepted';
  exception when check_violation or insufficient_privilege then null; end;
end $$;
set local role anon;
do $$ begin
  begin
    perform id from public.account_deletion_requests;
    raise exception 'Anonymous access allowed';
  exception when insufficient_privilege then null; end;
end $$;
rollback;
select 'PASS: owner receipt, duplicate protection, foreign/anonymous denial, confirmation and operator-only completion' as result;
