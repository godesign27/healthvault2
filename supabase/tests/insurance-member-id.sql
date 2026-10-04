-- Run after explicit-member-ID migration in a rollback-only preview transaction.
insert into auth.users(id,email) values
 ('ea912451-c759-4944-9f89-21c067122101','member-owner@example.invalid'),
 ('ea912451-c759-4944-9f89-21c067122102','member-other@example.invalid');
insert into public.insurance_providers(id,name,slug) values
 ('ea912451-c759-4944-9f89-21c067122001','QA synthetic insurer','qa-member-id-rollback');
insert into public.insurance_coverages(id,user_id,provider_id,plan_name,member_id_hash,effective_start) values
 ('ea912451-c759-4944-9f89-21c067122011','ea912451-c759-4944-9f89-21c067122101','ea912451-c759-4944-9f89-21c067122001','QA legacy','ambiguous-original',now());
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"ea912451-c759-4944-9f89-21c067122101","role":"authenticated"}',true);
do $$ begin
 if exists(select 1 from public.insurance_coverages where id='ea912451-c759-4944-9f89-21c067122011' and member_id is not null) then raise exception 'Legacy value guessed'; end if;
 update public.insurance_coverages set member_id='QA-EXPLICIT-1234',member_id_hash=''
 where id='ea912451-c759-4944-9f89-21c067122011';
 if not exists(select 1 from public.insurance_coverages where id='ea912451-c759-4944-9f89-21c067122011' and member_id='QA-EXPLICIT-1234' and member_id_hash='') then raise exception 'Owner round trip failed'; end if;
 begin
  update public.insurance_coverages set member_id='  ' where id='ea912451-c759-4944-9f89-21c067122011';
  raise exception 'Blank ID accepted';
 exception when check_violation then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"ea912451-c759-4944-9f89-21c067122102","role":"authenticated"}',true);
do $$ begin
 if exists(select 1 from public.insurance_coverages where id='ea912451-c759-4944-9f89-21c067122011') then raise exception 'Foreign read allowed'; end if;
 update public.insurance_coverages set member_id='FOREIGN' where id='ea912451-c759-4944-9f89-21c067122011';
 if found then raise exception 'Foreign write allowed'; end if;
end $$;
reset role;
select 'PASS explicit member ID round trip, no guessed legacy ID, blank denial and foreign read/write denial' as result;
