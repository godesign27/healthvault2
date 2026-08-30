/* Synthetic-only provider clinical package quarantine. */
CREATE TABLE public.provider_clinical_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_account_id uuid NOT NULL REFERENCES public.provider_accounts(id) ON DELETE CASCADE,
  provider_patient_identity_id uuid NOT NULL REFERENCES public.provider_patient_identities(id) ON DELETE CASCADE,
  source_format text NOT NULL CHECK (source_format IN ('health_vault_clinical_json_v1', 'fhir_r4_bundle')),
  source_label text NOT NULL,
  source_digest text NOT NULL,
  synthetic boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'quarantined' CHECK (status IN ('quarantined', 'validated', 'released', 'rejected')),
  validation_errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  validated_at timestamptz,
  released_at timestamptz,
  CHECK (synthetic), CHECK (jsonb_typeof(validation_errors) = 'array'),
  UNIQUE (provider_account_id, source_digest)
);
CREATE TABLE public.provider_clinical_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.provider_clinical_packages(id) ON DELETE CASCADE,
  provider_patient_identity_id uuid NOT NULL REFERENCES public.provider_patient_identities(id) ON DELETE CASCADE,
  resource_type text NOT NULL CHECK (resource_type IN ('health_record', 'lab', 'medication', 'condition', 'allergy', 'immunization', 'vital')),
  external_resource_id text NOT NULL,
  occurred_at timestamptz,
  title text NOT NULL,
  provider_name text,
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (package_id, resource_type, external_resource_id)
);
CREATE INDEX idx_provider_clinical_packages_patient_status ON public.provider_clinical_packages (provider_patient_identity_id, status, created_at DESC);
CREATE INDEX idx_provider_clinical_resources_package_type ON public.provider_clinical_resources (package_id, resource_type);
ALTER TABLE public.provider_clinical_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_clinical_resources ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.provider_clinical_packages FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.provider_clinical_resources FROM PUBLIC, anon, authenticated;
COMMENT ON TABLE public.provider_clinical_packages IS 'Synthetic-only, provider-scoped quarantine packages. Validation does not grant practitioner access or attach data to a patient vault.';
COMMENT ON TABLE public.provider_clinical_resources IS 'Normalized quarantined clinical resources. Browser access is revoked; patient release requires separate consent and identity-safe transaction.';
