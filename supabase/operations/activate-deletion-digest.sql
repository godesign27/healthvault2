-- Operator-only, production-specific activation. Run after migration, Edge deployment,
-- and delivery verification. Re-running preserves the original activation date.
begin;
do $$ begin
 if not exists(select 1 from public.deletion_digest_settings
   where project_url='https://sgwekxjlvadvdosyudgj.supabase.co') then
   raise exception 'Wrong project configuration'; end if;
 if not exists(select 1 from public.deletion_digest_runs where verification and state='accepted') then
   raise exception 'Verify delivery before activation'; end if;
end $$;
update public.deletion_digest_settings set enabled=true,activated_at=coalesce(activated_at,now()) where id;
-- UTC polling; the dispatch AND claim functions independently gate America/Denver.
-- First attempt 09:00 local; failed sends retry at 09:15/09:30/09:45, same daily key.
select cron.schedule('health-vault-deletion-digest','0,15,30,45 * * * *',
  'select public.dispatch_deletion_digest(false);');
commit;
