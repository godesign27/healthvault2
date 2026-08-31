CREATE OR REPLACE FUNCTION public.reconcile_patient_access_expiration(
  p_provider_account_id uuid,
  p_actor_principal_id uuid,
  p_request_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  grant_count integer := 0;
  invitation_count integer := 0;
  pending_count integer := 0;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.provider_accounts WHERE id = p_provider_account_id) THEN
    RAISE EXCEPTION 'provider account required';
  END IF;

  UPDATE public.provider_access_grants access_grant
  SET status = 'expired'
  FROM public.provider_patient_identities patient
  WHERE access_grant.provider_patient_identity_id = patient.id
    AND patient.provider_account_id = p_provider_account_id
    AND access_grant.status = 'active'
    AND access_grant.expires_at IS NOT NULL
    AND access_grant.expires_at <= now();
  GET DIAGNOSTICS grant_count = ROW_COUNT;

  UPDATE public.patient_access_invitations
  SET status = 'expired'
  WHERE provider_account_id = p_provider_account_id
    AND status = 'accepted'
    AND access_expires_at <= now();
  GET DIAGNOSTICS invitation_count = ROW_COUNT;

  UPDATE public.patient_access_invitations
  SET status = 'expired'
  WHERE provider_account_id = p_provider_account_id
    AND status = 'pending'
    AND expires_at <= now();
  GET DIAGNOSTICS pending_count = ROW_COUNT;

  IF grant_count + invitation_count + pending_count > 0 THEN
    INSERT INTO public.admin_audit_events (
      actor_principal_id, provider_account_id, action, target_type, target_ref,
      authorization_context, outcome, request_id, metadata
    ) VALUES (
      p_actor_principal_id, p_provider_account_id, 'patient.access.expiration.reconcile',
      'provider_account', p_provider_account_id::text,
      jsonb_build_object('source', 'provider-admin-api', 'automatic', true),
      'succeeded', p_request_id,
      jsonb_build_object('grantsExpired', grant_count, 'acceptedInvitationsExpired', invitation_count, 'pendingInvitationsExpired', pending_count)
    );
  END IF;

  RETURN jsonb_build_object('grants_expired', grant_count, 'accepted_invitations_expired', invitation_count, 'pending_invitations_expired', pending_count);
END;
$$;

REVOKE ALL ON FUNCTION public.reconcile_patient_access_expiration(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_patient_access_expiration(uuid, uuid, text) TO service_role;

CREATE OR REPLACE FUNCTION public.respond_patient_access_invitation(
  p_invitation_id uuid,
  p_accept boolean,
  p_request_id text,
  p_assurance_level text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  current_email text;
  current_email_confirmed_at timestamptz;
  invitation public.patient_access_invitations%ROWTYPE;
  link_id uuid;
  link_consumer_id uuid;
  grant_id uuid;
BEGIN
  IF current_user_id IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  SELECT auth_user.email, auth_user.email_confirmed_at INTO current_email, current_email_confirmed_at
  FROM auth.users auth_user WHERE auth_user.id = current_user_id;
  IF current_email_confirmed_at IS NULL THEN RAISE EXCEPTION 'verified email required'; END IF;

  SELECT * INTO invitation FROM public.patient_access_invitations
  WHERE id = p_invitation_id FOR UPDATE;
  IF NOT FOUND OR invitation.status <> 'pending' THEN RAISE EXCEPTION 'pending invitation required'; END IF;
  IF invitation.expires_at <= now() THEN
    UPDATE public.patient_access_invitations SET status = 'expired' WHERE id = invitation.id;
    RAISE EXCEPTION 'invitation expired';
  END IF;
  IF lower(current_email) <> lower(invitation.email) THEN RAISE EXCEPTION 'invited email required'; END IF;

  IF NOT p_accept THEN
    UPDATE public.patient_access_invitations SET status = 'denied', responded_at = now(), response_principal_id = current_user_id, request_id = p_request_id
    WHERE id = invitation.id;
    INSERT INTO public.admin_audit_events (actor_principal_id, provider_account_id, action, target_type, target_ref, authorization_context, outcome, request_id)
    VALUES (current_user_id, invitation.provider_account_id, 'patient.access.invitation.deny', 'patient_access_invitation', invitation.id::text,
      jsonb_build_object('assuranceLevel', p_assurance_level, 'consentVersion', invitation.consent_version), 'succeeded', p_request_id);
    RETURN jsonb_build_object('invitation_id', invitation.id, 'status', 'denied');
  END IF;

  UPDATE public.provider_access_grants
  SET status = 'expired'
  WHERE provider_patient_identity_id = invitation.provider_patient_identity_id
    AND consumer_principal_id = current_user_id
    AND status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at <= now();

  IF EXISTS (
    SELECT 1 FROM public.provider_access_grants
    WHERE provider_patient_identity_id = invitation.provider_patient_identity_id
      AND consumer_principal_id = current_user_id
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
  ) THEN RAISE EXCEPTION 'active access grant already exists'; END IF;

  SELECT id, consumer_principal_id INTO link_id, link_consumer_id
  FROM public.patient_identity_links
  WHERE provider_patient_identity_id = invitation.provider_patient_identity_id
    AND status = 'active'
  FOR UPDATE;

  IF link_id IS NOT NULL AND link_consumer_id <> current_user_id THEN
    RAISE EXCEPTION 'active identity belongs to another patient account';
  END IF;

  IF link_id IS NULL THEN
    INSERT INTO public.patient_identity_links (provider_patient_identity_id, consumer_principal_id, status, match_method, evidence_ref, decided_at, decided_by)
    VALUES (invitation.provider_patient_identity_id, current_user_id, 'active', 'verified_invitation', 'patient-access-invitation:' || invitation.id::text, now(), current_user_id)
    RETURNING id INTO link_id;
  END IF;

  INSERT INTO public.provider_access_grants (provider_patient_identity_id, consumer_principal_id, scope, purpose, consent_version, status, effective_at, expires_at, granted_at, request_id)
  VALUES (invitation.provider_patient_identity_id, current_user_id, invitation.requested_scope, invitation.purpose, invitation.consent_version, 'active', now(), invitation.access_expires_at, now(), p_request_id)
  RETURNING id INTO grant_id;

  UPDATE public.patient_access_invitations SET status = 'accepted', responded_at = now(), response_principal_id = current_user_id, request_id = p_request_id
  WHERE id = invitation.id;
  INSERT INTO public.admin_audit_events (actor_principal_id, provider_account_id, action, target_type, target_ref, authorization_context, outcome, request_id, metadata)
  VALUES (current_user_id, invitation.provider_account_id, 'patient.access.invitation.accept', 'patient_access_invitation', invitation.id::text,
    jsonb_build_object('assuranceLevel', p_assurance_level, 'consentVersion', invitation.consent_version, 'scope', invitation.requested_scope, 'purpose', invitation.purpose),
    'succeeded', p_request_id, jsonb_build_object('identityLinkId', link_id, 'accessGrantId', grant_id, 'identityLinkReused', link_consumer_id = current_user_id));
  RETURN jsonb_build_object('invitation_id', invitation.id, 'status', 'accepted', 'identity_link_id', link_id, 'access_grant_id', grant_id);
END;
$$;

REVOKE ALL ON FUNCTION public.respond_patient_access_invitation(uuid, boolean, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.respond_patient_access_invitation(uuid, boolean, text, text) TO authenticated;
