-- Preview candidate. Requires request_upload_receipts and account erasure guards.
alter table public.health_record_requests drop constraint health_record_requests_status_check;
alter table public.health_record_requests add constraint health_record_requests_status_check
 check(status in ('pending','sent','received','failed','cancelled'));

-- Only the verified-user Edge Function may supply p_user_id. Never expose to clients.
create function public.transition_record_request(p_request_id uuid,p_user_id uuid,p_action text,p_token text default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare r public.health_record_requests;
begin
 if p_user_id is null then raise exception 'Unauthorized' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended('hv-account:'||p_user_id::text,0));
 if exists(select 1 from public.account_erasure_blocks where user_id=p_user_id)
 or not account_control_private.import_account_exists(p_user_id)
 then raise exception 'Account unavailable' using errcode='42501'; end if;
 select * into r from public.health_record_requests where id=p_request_id and user_id=p_user_id::text for update;
 if not found then return jsonb_build_object('state','not_found'); end if;
 if p_action='cancel' then
  if r.status='cancelled' then return jsonb_build_object('state','cancelled','id',r.id); end if;
  if r.status not in ('pending','sent','failed') then return jsonb_build_object('state','closed'); end if;
  update public.health_record_requests set status='cancelled',secure_token=gen_random_uuid()::text,
   expires_at=now(),updated_at=now() where id=r.id;
  update public.inbound_upload_attempts set state='abandoned',updated_at=now()
   where request_id=r.id and state='prepared';
  return jsonb_build_object('state','cancelled','id',r.id);
 elsif p_action='resend' then
  if r.status not in ('pending','sent','failed') then return jsonb_build_object('state','closed'); end if;
  if p_token is null or length(p_token)<32 then raise exception 'Invalid token'; end if;
  update public.health_record_requests set status='sent',secure_token=p_token,
   expires_at=now()+interval '10 days',opened_at=null,updated_at=now() where id=r.id returning * into r;
  return jsonb_build_object('state','sent','id',r.id,'expiresAt',r.expires_at);
 else raise exception 'Invalid action'; end if;
end;
$$;
revoke all on function public.transition_record_request(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.transition_record_request(uuid,uuid,text,text) to service_role;

-- Older clients must not revive a cancelled request with a direct table update.
create function public.keep_record_request_cancelled() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if old.status='cancelled' and new.status is distinct from 'cancelled' then
  raise exception 'Cancelled requests cannot be reopened' using errcode='23514';
 end if;
 return new;
end;
$$;
revoke all on function public.keep_record_request_cancelled() from public,anon,authenticated;
create trigger keep_record_request_cancelled before update on public.health_record_requests
 for each row execute function public.keep_record_request_cancelled();
