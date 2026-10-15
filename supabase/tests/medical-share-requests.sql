-- Run after the migration in a disposable preview database.
begin;
do $$
begin
 if not (select relrowsecurity from pg_class where oid='public.medical_share_requests'::regclass) then
  raise exception 'Share request RLS is disabled';
 end if;
 if has_table_privilege('authenticated','public.medical_share_requests','SELECT')
 or has_table_privilege('authenticated','public.medical_share_requests','INSERT')
 or has_table_privilege('anon','public.medical_share_requests','SELECT') then
  raise exception 'Private share claims exposed';
 end if;
 if not exists(select 1 from pg_constraint where conrelid='public.medical_share_requests'::regclass and contype='p' and pg_get_constraintdef(oid)='PRIMARY KEY (owner_id, request_id)') then
  raise exception 'Atomic owner/request uniqueness missing';
 end if;
 if (select count(*) from information_schema.columns where table_schema='public'
     and table_name='medical_share_requests'
     and column_name in ('share_event_id','email_attempt_started_at','provider_message_id','provider_accepted_at')) <> 4 then
  raise exception 'Share correlation migration missing';
 end if;
 if not exists(select 1 from pg_index i join pg_class c on c.oid=i.indexrelid
     where c.relname='medical_share_requests_share_event_id_key' and i.indisunique) then
  raise exception 'Unique share correlation missing';
 end if;
end $$;
rollback;
