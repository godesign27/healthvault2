/*
  Explicitly reconcile the legacy organization model with the canonical
  provider security foundation.

  Safety boundary:
  - provider accounts remain draft;
  - legacy staff memberships remain suspended with no permissions;
  - legacy patient assignments become quarantined roster identities;
  - no practitioner profile, patient identity link, consent record, or access
    grant is created by this migration.
*/

INSERT INTO public.provider_accounts (
  legacy_organization_id,
  legal_name,
  display_name,
  slug,
  provider_type,
  status
)
SELECT
  organization.id,
  organization.name,
  organization.name,
  'legacy-' || organization.slug || '-' || left(organization.id::text, 8),
  'healthcare_provider',
  'draft'
FROM public.organizations AS organization
ON CONFLICT (legacy_organization_id) DO NOTHING;

INSERT INTO public.provider_memberships (
  provider_account_id,
  principal_id,
  status,
  roles,
  permissions,
  invited_at,
  suspended_at
)
SELECT
  provider.id,
  legacy_admin.user_id,
  'suspended',
  CASE legacy_admin.role
    WHEN 'owner' THEN ARRAY['organization_owner', 'provider_admin']::text[]
    WHEN 'admin' THEN ARRAY['provider_admin']::text[]
    ELSE ARRAY['operations_staff']::text[]
  END,
  ARRAY[]::text[],
  COALESCE(legacy_admin.created_at, now()),
  now()
FROM public.organization_admins AS legacy_admin
JOIN public.provider_accounts AS provider
  ON provider.legacy_organization_id = legacy_admin.organization_id
ON CONFLICT (provider_account_id, principal_id) DO NOTHING;

INSERT INTO public.provider_patient_identities (
  provider_account_id,
  external_patient_id,
  organization_patient_number,
  status,
  source_system,
  created_at,
  updated_at
)
SELECT
  provider.id,
  legacy_patient.id::text,
  legacy_patient.patient_number,
  'quarantined',
  'legacy_organization_patient',
  COALESCE(legacy_patient.assigned_at, now()),
  now()
FROM public.organization_patients AS legacy_patient
JOIN public.provider_accounts AS provider
  ON provider.legacy_organization_id = legacy_patient.organization_id
ON CONFLICT (provider_account_id, source_system, external_patient_id) DO NOTHING;

INSERT INTO public.admin_audit_events (
  provider_account_id,
  action,
  target_type,
  target_ref,
  authorization_context,
  reason,
  outcome,
  request_id,
  metadata
)
SELECT
  provider.id,
  'legacy_provider_records.quarantined',
  'provider_account',
  provider.id::text,
  jsonb_build_object('migration', '20260830003923_quarantine_legacy_provider_records'),
  'Explicit legacy-model reconciliation; activation requires platform-owner review.',
  'succeeded',
  'migration:20260830003923:' || provider.id::text,
  jsonb_build_object(
    'legacy_organization_id', provider.legacy_organization_id,
    'membership_count', (
      SELECT count(*)
      FROM public.provider_memberships AS membership
      WHERE membership.provider_account_id = provider.id
        AND membership.status = 'suspended'
    ),
    'quarantined_patient_count', (
      SELECT count(*)
      FROM public.provider_patient_identities AS patient
      WHERE patient.provider_account_id = provider.id
        AND patient.source_system = 'legacy_organization_patient'
        AND patient.status = 'quarantined'
    )
  )
FROM public.provider_accounts AS provider
WHERE provider.legacy_organization_id IS NOT NULL;
