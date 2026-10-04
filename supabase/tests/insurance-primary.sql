-- Run after migration inside a rollback-only transaction on isolated preview.
insert into auth.users(id,email) values
 ('ea912451-c759-4944-9f89-21c067122101','primary-owner@example.invalid'),
 ('ea912451-c759-4944-9f89-21c067122102','primary-other@example.invalid');
insert into public.insurance_providers(id,name,slug) values
 ('ea912451-c759-4944-9f89-21c067122001','QA synthetic insurer','qa-atomic-primary-rollback');
insert into public.insurance_coverages(id,user_id,provider_id,plan_name,member_id_hash,effective_start,is_primary,coverage_status) values
 ('ea912451-c759-4944-9f89-21c067122011','ea912451-c759-4944-9f89-21c067122101','ea912451-c759-4944-9f89-21c067122001','QA one','synthetic',now(),true,'active'),
 ('ea912451-c759-4944-9f89-21c067122012','ea912451-c759-4944-9f89-21c067122101','ea912451-c759-4944-9f89-21c067122001','QA two','synthetic',now(),false,'active'),
 ('ea912451-c759-4944-9f89-21c067122013','ea912451-c759-4944-9f89-21c067122102','ea912451-c759-4944-9f89-21c067122001','QA other owner','synthetic',now(),true,'active'),
 ('ea912451-c759-4944-9f89-21c067122014','ea912451-c759-4944-9f89-21c067122101','ea912451-c759-4944-9f89-21c067122001','QA stopped','synthetic',now(),false,'stopped');
-- Inject a failure after the old primary was cleared, proving statement rollback.
create function public.qa_primary_failure() returns trigger language plpgsql as $$
begin
 if current_setting('hv.qa_fail_primary',true) = 'on' and new.is_primary then
  raise exception 'Synthetic second-write failure' using errcode='23514';
 end if;
 return new;
end $$;
create trigger qa_primary_failure before update on public.insurance_coverages
 for each row execute function public.qa_primary_failure();
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"ea912451-c759-4944-9f89-21c067122101","role":"authenticated"}',true);
do $$ begin
 perform public.set_primary_insurance('ea912451-c759-4944-9f89-21c067122012');
 perform public.set_primary_insurance('ea912451-c759-4944-9f89-21c067122012');
 if (select count(*) from public.insurance_coverages where user_id=auth.uid() and is_primary) <> 1 then raise exception 'Expected one primary'; end if;
 if not (select is_primary from public.insurance_coverages where id='ea912451-c759-4944-9f89-21c067122012') then raise exception 'Wrong primary'; end if;
 begin
  perform public.set_primary_insurance('ea912451-c759-4944-9f89-21c067122013');
  raise exception 'Foreign target accepted';
 exception when no_data_found then null; end;
 begin
  perform public.set_primary_insurance('ea912451-c759-4944-9f89-21c067122014');
  raise exception 'Stopped target accepted';
 exception when no_data_found then null; end;
 if not (select is_primary from public.insurance_coverages where id='ea912451-c759-4944-9f89-21c067122012') then raise exception 'Failure lost current primary'; end if;
 perform set_config('hv.qa_fail_primary','on',true);
 begin
  perform public.set_primary_insurance('ea912451-c759-4944-9f89-21c067122011');
  raise exception 'Expected synthetic failure';
 exception when check_violation then null; end;
 perform set_config('hv.qa_fail_primary','off',true);
 if not (select is_primary from public.insurance_coverages where id='ea912451-c759-4944-9f89-21c067122012') then raise exception 'Second-write failure lost primary'; end if;
 begin
  update public.insurance_coverages set is_primary=true where id='ea912451-c759-4944-9f89-21c067122011';
  raise exception 'Duplicate primary allowed';
 exception when unique_violation then null; end;
end $$;
reset role;
select 'PASS owner, replay, foreign/stopped denial, second-write rollback and unique constraint' as result;
