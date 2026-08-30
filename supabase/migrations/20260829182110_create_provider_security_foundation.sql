/*
  M1 provider security foundation. Additive by design: legacy organization,
  provider-directory, and consumer record-import tables remain in place until
  their meaning and deployed RLS have been audited and explicitly migrated.
*/

CREATE TABLE IF NOT EXISTS public.provider_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_organization_id uuid UNIQUE REFERENCES public.organizations(id),
  provider_directory_id uuid UNIQUE REFERENCES public.provider_organizations(id),
  legal_name text NOT NULL,
  display_name text NOT NULL,
  slug text NOT NULL UNIQUE,
  provider_type text NOT NULL DEFAULT 'healthcare_provider',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'verification_pending', 'active', 'degraded', 'suspended', 'archived'
  )),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.provider_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_account_id uuid NOT NULL REFERENCES public.provider_accounts(id) ON DELETE CASCADE,
  principal_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'suspended', 'removed')),
  roles text[] NOT NULL DEFAULT '{}',
  permissions text[] NOT NULL DEFAULT '{}',
  invited_by uuid REFERENCES auth.users(id),
  invited_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  suspended_at timestamptz,
  removed_at timestamptz,
  UNIQUE (provider_account_id, principal_id),
  CONSTRAINT provider_memberships_roles_check CHECK (roles <@ ARRAY[
    'organization_owner', 'provider_admin', 'practitioner', 'operations_staff',
    'integration_operator', 'privacy_auditor'
  ]::text[])
);

CREATE TABLE IF NOT EXISTS public.provider_membership_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_account_id uuid NOT NULL REFERENCES public.provider_accounts(id) ON DELETE CASCADE,
  email text NOT NULL,
  roles text[] NOT NULL DEFAULT '{}',
  permissions text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  invited_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  accepted_by uuid REFERENCES auth.users(id),
  accepted_at timestamptz,
  CONSTRAINT provider_membership_invitations_roles_check CHECK (roles <@ ARRAY[
    'organization_owner', 'provider_admin', 'practitioner', 'operations_staff',
    'integration_operator', 'privacy_auditor'
  ]::text[])
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_membership_invitations_pending_email
  ON public.provider_membership_invitations (provider_account_id, lower(email))
  WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS public.practitioner_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_account_id uuid NOT NULL REFERENCES public.provider_accounts(id) ON DELETE CASCADE,
  membership_id uuid NOT NULL UNIQUE REFERENCES public.provider_memberships(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  specialty text,
  professional_identifier_type text,
  professional_identifier_value text,
  credential_status text NOT NULL DEFAULT 'unverified' CHECK (
    credential_status IN ('unverified', 'pending', 'verified', 'rejected', 'expired')
  ),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.provider_patient_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_account_id uuid NOT NULL REFERENCES public.provider_accounts(id) ON DELETE CASCADE,
  external_patient_id text NOT NULL,
  organization_patient_number text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'merged', 'quarantined')),
  source_system text NOT NULL,
  source_import_job_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_account_id, source_system, external_patient_id)
);

CREATE TABLE IF NOT EXISTS public.patient_identity_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_patient_identity_id uuid NOT NULL REFERENCES public.provider_patient_identities(id) ON DELETE CASCADE,
  consumer_principal_id uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'denied', 'revoked', 'superseded')),
  match_method text NOT NULL CHECK (match_method IN ('patient_claim', 'verified_invitation', 'approved_connected_system', 'manual_review')),
  evidence_ref text,
  decided_at timestamptz,
  decided_by uuid REFERENCES auth.users(id),
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_patient_identity_links_active
  ON public.patient_identity_links (provider_patient_identity_id) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS public.provider_access_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_patient_identity_id uuid NOT NULL REFERENCES public.provider_patient_identities(id) ON DELETE CASCADE,
  consumer_principal_id uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  scope text[] NOT NULL DEFAULT '{}',
  purpose text NOT NULL,
  consent_version text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'denied', 'revoked', 'expired')),
  effective_at timestamptz,
  expires_at timestamptz,
  granted_at timestamptz,
  revoked_at timestamptz,
  request_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT provider_access_grants_period_check CHECK (
    expires_at IS NULL OR effective_at IS NULL OR expires_at > effective_at
  )
);

CREATE TABLE IF NOT EXISTS public.practitioner_patient_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_account_id uuid NOT NULL REFERENCES public.provider_accounts(id) ON DELETE CASCADE,
  practitioner_profile_id uuid NOT NULL REFERENCES public.practitioner_profiles(id) ON DELETE CASCADE,
  provider_patient_identity_id uuid NOT NULL REFERENCES public.provider_patient_identities(id) ON DELETE CASCADE,
  relationship_type text NOT NULL DEFAULT 'care_team',
  assignment_source text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'revoked')),
  effective_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  UNIQUE (practitioner_profile_id, provider_patient_identity_id, effective_at),
  CONSTRAINT practitioner_patient_assignment_period_check CHECK (
    expires_at IS NULL OR expires_at > effective_at
  )
);

CREATE TABLE IF NOT EXISTS public.admin_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_principal_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  provider_account_id uuid REFERENCES public.provider_accounts(id) ON DELETE SET NULL,
  product_key text REFERENCES public.admin_products(product_key),
  action text NOT NULL,
  target_type text NOT NULL,
  target_ref text,
  authorization_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  reason text,
  outcome text NOT NULL CHECK (outcome IN ('allowed', 'denied', 'succeeded', 'failed')),
  request_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT admin_audit_authorization_object CHECK (jsonb_typeof(authorization_context) = 'object'),
  CONSTRAINT admin_audit_metadata_object CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_provider_memberships_principal
  ON public.provider_memberships (principal_id, provider_account_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_provider_patient_identities_account
  ON public.provider_patient_identities (provider_account_id, status);
CREATE INDEX IF NOT EXISTS idx_practitioner_patient_assignments_lookup
  ON public.practitioner_patient_assignments (practitioner_profile_id, provider_patient_identity_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_provider_access_grants_patient
  ON public.provider_access_grants (provider_patient_identity_id, status);
CREATE INDEX IF NOT EXISTS idx_admin_audit_events_provider_time
  ON public.admin_audit_events (provider_account_id, occurred_at DESC);

ALTER TABLE public.provider_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_membership_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practitioner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_patient_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_identity_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practitioner_patient_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.provider_accounts, public.provider_memberships, public.provider_membership_invitations,
  public.practitioner_profiles, public.provider_patient_identities,
  public.patient_identity_links, public.provider_access_grants,
  public.practitioner_patient_assignments, public.admin_audit_events
FROM anon, authenticated;

GRANT SELECT ON public.provider_accounts, public.provider_memberships,
  public.practitioner_profiles, public.provider_patient_identities,
  public.patient_identity_links, public.provider_access_grants,
  public.practitioner_patient_assignments
TO authenticated;

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
    JOIN public.provider_memberships membership
      ON membership.provider_account_id = provider_patient.provider_account_id
    JOIN public.practitioner_profiles practitioner
      ON practitioner.membership_id = membership.id
    JOIN public.practitioner_patient_assignments assignment
      ON assignment.practitioner_profile_id = practitioner.id
     AND assignment.provider_patient_identity_id = provider_patient.id
    JOIN public.provider_access_grants access_grant
      ON access_grant.provider_patient_identity_id = provider_patient.id
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

CREATE OR REPLACE FUNCTION public.reject_admin_audit_event_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'admin audit events are append-only' USING ERRCODE = '55000';
END;
$$;

DROP TRIGGER IF EXISTS prevent_admin_audit_event_mutation ON public.admin_audit_events;
CREATE TRIGGER prevent_admin_audit_event_mutation
  BEFORE UPDATE OR DELETE ON public.admin_audit_events
  FOR EACH ROW EXECUTE FUNCTION public.reject_admin_audit_event_mutation();

CREATE POLICY "Members can read their active provider account"
  ON public.provider_accounts FOR SELECT TO authenticated USING (
    status <> 'archived' AND EXISTS (
      SELECT 1 FROM public.provider_memberships membership
      WHERE membership.provider_account_id = provider_accounts.id
        AND membership.principal_id = (SELECT auth.uid())
        AND membership.status = 'active'
    )
  );

CREATE POLICY "Members can read own provider memberships"
  ON public.provider_memberships FOR SELECT TO authenticated
  USING (principal_id = (SELECT auth.uid()) AND status = 'active');

CREATE POLICY "Members can read practitioners in own provider"
  ON public.practitioner_profiles FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.provider_memberships membership
      WHERE membership.provider_account_id = practitioner_profiles.provider_account_id
        AND membership.principal_id = (SELECT auth.uid())
        AND membership.status = 'active'
        AND ('members.read' = ANY(membership.permissions) OR membership.id = practitioner_profiles.membership_id)
    )
  );

CREATE POLICY "Practitioners can read assigned and consented patients"
  ON public.provider_patient_identities FOR SELECT TO authenticated
  USING (public.can_practitioner_access_provider_patient(id));

CREATE POLICY "Consumers can read own provider identity links"
  ON public.patient_identity_links FOR SELECT TO authenticated
  USING (consumer_principal_id = (SELECT auth.uid()));

CREATE POLICY "Consumers can read own provider access grants"
  ON public.provider_access_grants FOR SELECT TO authenticated
  USING (consumer_principal_id = (SELECT auth.uid()));

CREATE POLICY "Practitioners can read own patient assignments"
  ON public.practitioner_patient_assignments FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.practitioner_profiles practitioner
      JOIN public.provider_memberships membership ON membership.id = practitioner.membership_id
      WHERE practitioner.id = practitioner_patient_assignments.practitioner_profile_id
        AND membership.principal_id = (SELECT auth.uid())
        AND membership.status = 'active'
    )
  );

COMMENT ON TABLE public.provider_patient_identities IS
  'Provider-managed identity; never implies a consumer identity, consent, or access grant.';
COMMENT ON TABLE public.admin_audit_events IS
  'Append-only privileged audit envelope; direct authenticated reads and client mutations are denied.';
