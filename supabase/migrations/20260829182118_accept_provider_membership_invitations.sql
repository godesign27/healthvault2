/*
  Atomic provider invitation acceptance. The authenticated invitee must have a
  confirmed matching email, a verified TOTP factor, and an AAL2 access token.
*/

CREATE OR REPLACE FUNCTION public.accept_provider_membership_invitation(
  p_invitation_id uuid,
  p_request_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  current_user_email text;
  current_email_confirmed_at timestamptz;
  invitation public.provider_membership_invitations%ROWTYPE;
  membership public.provider_memberships%ROWTYPE;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT email, email_confirmed_at INTO current_user_email, current_email_confirmed_at
  FROM auth.users WHERE id = current_user_id;

  IF current_email_confirmed_at IS NULL THEN
    RAISE EXCEPTION 'verified email required' USING ERRCODE = '42501';
  END IF;
  IF COALESCE(auth.jwt() ->> 'aal', '') <> 'aal2' THEN
    RAISE EXCEPTION 'AAL2 authentication required' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM auth.mfa_factors
    WHERE user_id = current_user_id AND factor_type = 'totp' AND status = 'verified'
  ) THEN
    RAISE EXCEPTION 'verified TOTP factor required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO invitation FROM public.provider_membership_invitations
  WHERE id = p_invitation_id FOR UPDATE;
  IF NOT FOUND OR invitation.status <> 'pending' THEN
    RAISE EXCEPTION 'invitation unavailable' USING ERRCODE = 'P0002';
  END IF;
  IF invitation.expires_at <= now() THEN
    UPDATE public.provider_membership_invitations SET status = 'expired' WHERE id = invitation.id;
    RAISE EXCEPTION 'invitation expired' USING ERRCODE = 'P0001';
  END IF;
  IF lower(trim(invitation.email)) <> lower(trim(current_user_email)) THEN
    RAISE EXCEPTION 'invitation email mismatch' USING ERRCODE = '42501';
  END IF;
  IF cardinality(invitation.roles) = 0 THEN
    RAISE EXCEPTION 'invitation has no roles' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.provider_accounts account
    WHERE account.id = invitation.provider_account_id AND account.status = 'active'
  ) THEN
    RAISE EXCEPTION 'provider account is not active' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.provider_memberships (
    provider_account_id, principal_id, status, roles, permissions,
    invited_by, invited_at, activated_at
  ) VALUES (
    invitation.provider_account_id, current_user_id, 'active', invitation.roles,
    invitation.permissions, invitation.invited_by, invitation.invited_at, now()
  ) RETURNING * INTO membership;

  UPDATE public.provider_membership_invitations
  SET status = 'accepted', accepted_by = current_user_id, accepted_at = now()
  WHERE id = invitation.id;

  INSERT INTO public.admin_audit_events (
    actor_principal_id, provider_account_id, action, target_type, target_ref,
    authorization_context, metadata, outcome, request_id
  ) VALUES (
    current_user_id, invitation.provider_account_id,
    'provider.members.invitation.accept', 'provider_membership_invitation', invitation.id::text,
    jsonb_build_object('source', 'accept_provider_membership_invitation', 'assuranceLevel', 'aal2'),
    jsonb_build_object('membershipId', membership.id), 'succeeded', p_request_id
  );

  RETURN jsonb_build_object(
    'id', membership.id,
    'providerAccountId', membership.provider_account_id,
    'status', membership.status,
    'roles', membership.roles,
    'activatedAt', membership.activated_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.accept_provider_membership_invitation(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_provider_membership_invitation(uuid, text) TO authenticated;
