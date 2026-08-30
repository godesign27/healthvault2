CREATE OR REPLACE FUNCTION public.revoke_provider_patient_access(
  p_provider_account_id uuid,
  p_provider_patient_identity_id uuid,
  p_actor_principal_id uuid,
  p_request_id text,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  grant_count integer := 0;
  link_count integer := 0;
  invitation_count integer := 0;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.provider_patient_identities
    WHERE id = p_provider_patient_identity_id
      AND provider_account_id = p_provider_account_id
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'active provider patient required';
  END IF;

  UPDATE public.provider_access_grants
  SET status = 'revoked', revoked_at = now(), request_id = p_request_id
  WHERE provider_patient_identity_id = p_provider_patient_identity_id
    AND status = 'active';
  GET DIAGNOSTICS grant_count = ROW_COUNT;

  UPDATE public.patient_identity_links
  SET status = 'revoked', revoked_at = now(), decided_at = now(), decided_by = p_actor_principal_id
  WHERE provider_patient_identity_id = p_provider_patient_identity_id
    AND status = 'active';
  GET DIAGNOSTICS link_count = ROW_COUNT;

  UPDATE public.patient_access_invitations
  SET status = 'revoked', responded_at = now(), request_id = p_request_id
  WHERE provider_account_id = p_provider_account_id
    AND provider_patient_identity_id = p_provider_patient_identity_id
    AND status = 'accepted';
  GET DIAGNOSTICS invitation_count = ROW_COUNT;

  IF grant_count = 0 AND link_count = 0 AND invitation_count = 0 THEN
    RAISE EXCEPTION 'active patient access required';
  END IF;

  INSERT INTO public.admin_audit_events (
    actor_principal_id, provider_account_id, action, target_type, target_ref,
    authorization_context, reason, outcome, request_id, metadata
  ) VALUES (
    p_actor_principal_id, p_provider_account_id, 'patient.provider_access.super_admin_terminate',
    'provider_patient_identity', p_provider_patient_identity_id::text,
    jsonb_build_object('source', 'platform-admin-provider-api', 'actorType', 'health_vault_super_admin', 'atomic', true),
    p_reason, 'succeeded', p_request_id,
    jsonb_build_object('grantsRevoked', grant_count, 'linksRevoked', link_count, 'invitationsRevoked', invitation_count)
  );

  RETURN jsonb_build_object(
    'patient_id', p_provider_patient_identity_id,
    'status', 'revoked',
    'grants_revoked', grant_count,
    'links_revoked', link_count,
    'invitations_revoked', invitation_count
  );
END;
$$;

REVOKE ALL ON FUNCTION public.revoke_provider_patient_access(uuid, uuid, uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_provider_patient_access(uuid, uuid, uuid, text, text) TO service_role;
