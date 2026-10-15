-- Preview only. No production scheduling authorized by this file.
begin;
do $$ begin
 if not exists(select 1 from public.upload_recovery_settings where id
   and project_url='https://roeudwddxvniazwufdqf.supabase.co'
   and last_finished_at is not null and failed=0)
 then raise exception 'Verify preview recovery before activation'; end if;
end $$;
update public.upload_recovery_settings set enabled=true where id;
select cron.schedule('health-vault-upload-recovery','*/15 * * * *','select public.dispatch_upload_recovery();');
commit;
