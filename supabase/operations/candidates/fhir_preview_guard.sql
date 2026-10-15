-- Preview-only candidate. Both writes serialize with the account erasure interlock.
create or replace function public.refresh_fhir_connection(
 p_user_id uuid,p_connection_id uuid,p_expected_token text,p_access_token text,
 p_refresh_token text,p_expires_at timestamptz)
returns boolean language plpgsql security invoker set search_path='' as $$
declare affected integer;
begin
 perform pg_advisory_xact_lock(hashtextextended('hv-account:'||p_user_id::text,0));
 if exists(select 1 from public.account_erasure_blocks where user_id=p_user_id)
 or not account_control_private.import_account_exists(p_user_id)
 or coalesce(length(p_access_token),0)=0 then return false; end if;
 update public.provider_connections set fhir_access_token=p_access_token,
 fhir_refresh_token=p_refresh_token,token_expires_at=p_expires_at,updated_at=now()
 where id=p_connection_id and user_id=p_user_id and status='active'
 and fhir_access_token is not distinct from p_expected_token;
 get diagnostics affected=row_count;
 return affected=1;
end;
$$;
revoke all on function public.refresh_fhir_connection(uuid,uuid,text,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.refresh_fhir_connection(uuid,uuid,text,text,text,timestamptz) to service_role;

create or replace function public.save_fhir_preview(
 p_user_id uuid,p_connection_id uuid,p_expected_token text,p_preview jsonb,p_counts jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare c public.provider_connections; job_id uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended('hv-account:'||p_user_id::text,0));
 if exists(select 1 from public.account_erasure_blocks where user_id=p_user_id)
 or not account_control_private.import_account_exists(p_user_id) then return null; end if;
 select * into c from public.provider_connections
 where id=p_connection_id and user_id=p_user_id and status='active' for update;
 if not found or c.fhir_access_token is distinct from p_expected_token
 or coalesce(length(p_expected_token),0)=0 then return null; end if;
 insert into public.record_import_jobs(user_id,provider_connection_id,strategy,status,preview_data,counts)
 values(p_user_id,c.id,c.connection_method,'preview',p_preview,p_counts) returning id into job_id;
 -- Preview is not an import. Do not advance the completed-sync timestamp.
 return job_id;
end;
$$;
revoke all on function public.save_fhir_preview(uuid,uuid,text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.save_fhir_preview(uuid,uuid,text,jsonb,jsonb) to service_role;
