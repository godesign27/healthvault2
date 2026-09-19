-- Confirmation receipts are private to the authenticated owner. A pending
-- receipt never expires automatically: a lost response must not resend email.
create table public.share_confirmation_receipts (
  user_id uuid not null default auth.uid(),
  kind text not null check (kind in ('health_share', 'medical_form_email')),
  request_key text not null check (request_key ~ '^[a-f0-9]{64}$'),
  operation_id uuid not null default gen_random_uuid(),
  status text not null default 'pending' check (status in ('pending', 'completed')),
  result jsonb,
  created_at timestamptz not null default now(),
  primary key (user_id, kind, request_key),
  unique (operation_id)
);
alter table public.share_confirmation_receipts enable row level security;
revoke all on public.share_confirmation_receipts from public, anon;
grant select, insert, update on public.share_confirmation_receipts to authenticated;
create policy "Owners read share confirmation receipts" on public.share_confirmation_receipts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Owners insert share confirmation receipts" on public.share_confirmation_receipts
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Owners update share confirmation receipts" on public.share_confirmation_receipts
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create function public.claim_share_confirmation(p_kind text, p_request_key text)
returns jsonb language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  owner_id uuid := auth.uid();
  receipt public.share_confirmation_receipts%rowtype;
  active_share boolean;
begin
  if owner_id is null then raise exception 'Authentication required'; end if;
  if p_kind is null or p_kind not in ('health_share','medical_form_email') or p_request_key is null or p_request_key !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid confirmation request';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(owner_id::text || ':' || p_kind || ':' || p_request_key, 0));
  select * into receipt from public.share_confirmation_receipts
    where user_id=owner_id and kind=p_kind and request_key=p_request_key for update;
  if found then
    if receipt.status='pending' then
      return jsonb_build_object('status','pending','id',receipt.operation_id);
    end if;
    select exists(select 1 from public.share_events where id=receipt.operation_id
      and not coalesce(is_revoked,false) and status<>'revoked'
      and expires_at > now()) into active_share;
    if active_share then return jsonb_build_object('status','completed','result',receipt.result); end if;
    -- A newly confirmed request may replace a revoked/expired/deleted link.
    update public.share_confirmation_receipts set operation_id=gen_random_uuid(),
      status='pending', result=null, created_at=now()
      where user_id=owner_id and kind=p_kind and request_key=p_request_key returning * into receipt;
  else
    insert into public.share_confirmation_receipts(user_id,kind,request_key)
      values(owner_id,p_kind,p_request_key) returning * into receipt;
  end if;
  return jsonb_build_object('status','claimed','id',receipt.operation_id);
end $$;

create function public.complete_share_confirmation(p_operation_id uuid, p_result jsonb)
returns void language plpgsql security invoker set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_result->>'id' is distinct from p_operation_id::text
    or not exists(select 1 from public.share_events where id=p_operation_id) then
    raise exception 'Share confirmation does not match an accessible share';
  end if;
  update public.share_confirmation_receipts set status='completed', result=p_result
    where user_id=auth.uid() and operation_id=p_operation_id and status='pending';
  if not found then raise exception 'Share confirmation is not pending'; end if;
end $$;
revoke all on function public.claim_share_confirmation(text,text) from public, anon;
revoke all on function public.complete_share_confirmation(uuid,jsonb) from public, anon;
grant execute on function public.claim_share_confirmation(text,text) to authenticated;
grant execute on function public.complete_share_confirmation(uuid,jsonb) to authenticated;
