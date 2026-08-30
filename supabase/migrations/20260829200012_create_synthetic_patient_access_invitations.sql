CREATE TABLE public.patient_access_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_account_id uuid NOT NULL REFERENCES public.provider_accounts(id) ON DELETE CASCADE,
  provider_patient_identity_id uuid NOT NULL REFERENCES public.provider_patient_identities(id) ON DELETE CASCADE,
  email text NOT NULL,
  requested_scope text[] NOT NULL,
  purpose text NOT NULL,
  consent_version text NOT NULL,
  synthetic boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'denied', 'revoked', 'expired')),
  expires_at timestamptz NOT NULL,
  access_expires_at timestamptz NOT NULL,
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  response_principal_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  request_id text,
  CHECK (expires_at > created_at),
  CHECK (access_expires_at > expires_at)
);

CREATE UNIQUE INDEX idx_patient_access_invitations_pending
  ON public.patient_access_invitations (provider_patient_identity_id, lower(email))
  WHERE status = 'pending';
CREATE INDEX idx_patient_access_invitations_provider
  ON public.patient_access_invitations (provider_account_id, created_at DESC);
CREATE INDEX idx_patient_access_invitations_invited_by
  ON public.patient_access_invitations (invited_by);
CREATE INDEX idx_patient_access_invitations_response_principal
  ON public.patient_access_invitations (response_principal_id)
  WHERE response_principal_id IS NOT NULL;

ALTER TABLE public.patient_access_invitations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.patient_access_invitations FROM PUBLIC, anon, authenticated;

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

  INSERT INTO public.patient_identity_links (provider_patient_identity_id, consumer_principal_id, status, match_method, evidence_ref, decided_at, decided_by)
  VALUES (invitation.provider_patient_identity_id, current_user_id, 'active', 'verified_invitation', 'patient-access-invitation:' || invitation.id::text, now(), current_user_id)
  RETURNING id INTO link_id;

  INSERT INTO public.provider_access_grants (provider_patient_identity_id, consumer_principal_id, scope, purpose, consent_version, status, effective_at, expires_at, granted_at, request_id)
  VALUES (invitation.provider_patient_identity_id, current_user_id, invitation.requested_scope, invitation.purpose, invitation.consent_version, 'active', now(), invitation.access_expires_at, now(), p_request_id)
  RETURNING id INTO grant_id;

  UPDATE public.patient_access_invitations SET status = 'accepted', responded_at = now(), response_principal_id = current_user_id, request_id = p_request_id
  WHERE id = invitation.id;
  INSERT INTO public.admin_audit_events (actor_principal_id, provider_account_id, action, target_type, target_ref, authorization_context, outcome, request_id, metadata)
  VALUES (current_user_id, invitation.provider_account_id, 'patient.access.invitation.accept', 'patient_access_invitation', invitation.id::text,
    jsonb_build_object('assuranceLevel', p_assurance_level, 'consentVersion', invitation.consent_version, 'scope', invitation.requested_scope, 'purpose', invitation.purpose),
    'succeeded', p_request_id, jsonb_build_object('identityLinkId', link_id, 'accessGrantId', grant_id));
  RETURN jsonb_build_object('invitation_id', invitation.id, 'status', 'accepted', 'identity_link_id', link_id, 'access_grant_id', grant_id);
END;
$$;

REVOKE ALL ON FUNCTION public.respond_patient_access_invitation(uuid, boolean, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.respond_patient_access_invitation(uuid, boolean, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.can_practitioner_access_provider_patient(
  requested_provider_patient_identity_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.provider_patient_identities provider_patient
    JOIN public.provider_memberships membership ON membership.provider_account_id = provider_patient.provider_account_id
    JOIN public.practitioner_profiles practitioner ON practitioner.membership_id = membership.id
    JOIN public.practitioner_patient_assignments assignment
      ON assignment.practitioner_profile_id = practitioner.id
     AND assignment.provider_patient_identity_id = provider_patient.id
    JOIN public.patient_identity_links identity_link
      ON identity_link.provider_patient_identity_id = provider_patient.id
     AND identity_link.status = 'active'
    JOIN public.provider_access_grants access_grant
      ON access_grant.provider_patient_identity_id = provider_patient.id
     AND access_grant.consumer_principal_id = identity_link.consumer_principal_id
    WHERE provider_patient.id = requested_provider_patient_identity_id
      AND membership.principal_id = auth.uid()
      AND membership.status = 'active'
      AND 'patients.read_assigned' = ANY(membership.permissions)
      AND practitioner.status = 'active'
      AND assignment.status = 'active'
      AND assignment.effective_at <= now()
      AND (assignment.expires_at IS NULL OR assignment.expires_at > now())
      AND access_grant.status = 'active'
      AND (access_grant.effective_at IS NULL OR access_grant.effective_at <= now())
      AND (access_grant.expires_at IS NULL OR access_grant.expires_at > now())
  );
$$;

REVOKE ALL ON FUNCTION public.can_practitioner_access_provider_patient(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_practitioner_access_provider_patient(uuid) TO authenticated;

COMMENT ON TABLE public.patient_access_invitations IS
  'Synthetic-pilot patient invitation and consent requests. Production use is blocked pending Privacy/Legal approval.';
