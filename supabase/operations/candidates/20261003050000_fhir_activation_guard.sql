-- Callback activation must serialize with account erasure and refuse stale/replayed activation.
create or replace function public.activate_fhir_connection(p_state_id uuid,p_access_token text,p_refresh_token text,p_patient_id text,p_expires_at timestamptz)
returns boolean language plpgsql security invoker set search_path='' as $$
declare s public.fhir_oauth_states; affected integer;
begin
 select * into s from public.fhir_oauth_states where id=p_state_id;
 if not found then return false; end if;
 perform pg_advisory_xact_lock(hashtextextended('hv-account:'||s.user_id::text,0));
 if exists(select 1 from public.account_erasure_blocks where user_id=s.user_id)
 or not account_control_private.import_account_exists(s.user_id) then return false; end if;
 select * into s from public.fhir_oauth_states where id=p_state_id for update;
 if not found or s.consumed_at is null or s.expires_at<=now()
 or coalesce(length(p_access_token),0)=0 or coalesce(length(p_patient_id),0)=0 then return false; end if;
 update public.provider_connections set status='active',fhir_access_token=p_access_token,
 fhir_refresh_token=p_refresh_token,fhir_patient_id=p_patient_id,token_expires_at=p_expires_at,updated_at=now()
 where id=s.connection_id and user_id=s.user_id and provider_organization_id=s.provider_organization_id and status='pending';
 get diagnostics affected=row_count;
 return affected=1;
end;
$$;
revoke all on function public.activate_fhir_connection(uuid,text,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.activate_fhir_connection(uuid,text,text,text,timestamptz) to service_role;
