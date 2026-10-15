-- Replace legacy demo-wide reads with the same owner boundary used for writes.
-- No rows, ownership values, grants, or service-role sharing behavior are changed.
alter table public.patient_profiles enable row level security;
alter table public.form_responses enable row level security;

drop policy if exists "Users can view all patient profiles (demo)" on public.patient_profiles;
drop policy if exists "Users can view own patient profiles" on public.patient_profiles;
create policy "Users can view own patient profiles"
on public.patient_profiles for select to authenticated
using (user_id = (select auth.uid())::text);

drop policy if exists "Users can view all form responses (demo)" on public.form_responses;
drop policy if exists "Users can view own form responses" on public.form_responses;
create policy "Users can view own form responses"
on public.form_responses for select to authenticated
using (
  patient_id in (
    select id from public.patient_profiles
    where user_id = (select auth.uid())::text
  )
);
