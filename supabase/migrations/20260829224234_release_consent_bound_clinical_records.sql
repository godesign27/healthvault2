/* Patient-owned snapshots released only after explicit clinical consent and identity match. */
CREATE TABLE public.patient_clinical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_principal_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  provider_account_id uuid NOT NULL REFERENCES public.provider_accounts(id) ON DELETE RESTRICT,
  provider_patient_identity_id uuid NOT NULL,
  source_package_id uuid NOT NULL,
  source_resource_id uuid NOT NULL,
  resource_type text NOT NULL CHECK (resource_type IN ('health_record', 'lab', 'medication', 'condition', 'allergy', 'immunization', 'vital')),
  external_resource_id text NOT NULL,
  title text NOT NULL,
  occurred_at timestamptz,
  provider_name text,
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  provenance jsonb NOT NULL CHECK (jsonb_typeof(provenance) = 'object'),
  consent_receipt_id uuid NOT NULL REFERENCES public.patient_access_consent_receipts(id) ON DELETE RESTRICT,
  released_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (consumer_principal_id, source_resource_id)
);

CREATE TABLE public.patient_clinical_release_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid NOT NULL REFERENCES public.patient_access_invitations(id) ON DELETE RESTRICT,
  consumer_principal_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  provider_patient_identity_id uuid NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('released', 'blocked_identity_mismatch', 'no_validated_packages')),
  package_count integer NOT NULL DEFAULT 0 CHECK (package_count >= 0),
  resource_count integer NOT NULL DEFAULT 0 CHECK (resource_count >= 0),
  reason text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (invitation_id)
);

ALTER TABLE public.health_records
  ADD COLUMN provider_clinical_resource_id uuid;
CREATE UNIQUE INDEX idx_health_records_provider_clinical_resource
  ON public.health_records (user_id, provider_clinical_resource_id)
  WHERE provider_clinical_resource_id IS NOT NULL;

CREATE INDEX idx_patient_clinical_records_owner_date
  ON public.patient_clinical_records (consumer_principal_id, occurred_at DESC);
CREATE INDEX idx_patient_clinical_records_patient
  ON public.patient_clinical_records (provider_patient_identity_id, released_at DESC);

ALTER TABLE public.patient_clinical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_clinical_release_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.patient_clinical_records FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.patient_clinical_release_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.patient_clinical_records TO authenticated;
CREATE POLICY patient_reads_owned_clinical_records
  ON public.patient_clinical_records FOR SELECT TO authenticated
  USING ((select auth.uid()) = consumer_principal_id);

CREATE OR REPLACE FUNCTION public.release_consented_provider_clinical_records()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  receipt public.patient_access_consent_receipts%ROWTYPE;
  roster public.provider_import_rows%ROWTYPE;
  profile public.user_profiles%ROWTYPE;
  package_count integer := 0;
  resource_count integer := 0;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM 'accepted' OR NEW.status <> 'accepted' THEN RETURN NEW; END IF;
  IF NEW.consent_version <> 'health-vault-synthetic-pilot-access-v3'
     OR NOT ('clinical.imported_records' = ANY(NEW.requested_scope)) THEN RETURN NEW; END IF;

  SELECT * INTO receipt FROM public.patient_access_consent_receipts
  WHERE invitation_id = NEW.id
    AND consumer_principal_id = NEW.response_principal_id
    AND consent_version = NEW.consent_version
    AND 'clinical.imported_records' = ANY(scope);
  IF NOT FOUND THEN RAISE EXCEPTION 'matching clinical consent receipt required'; END IF;

  SELECT * INTO roster FROM public.provider_import_rows
  WHERE committed_patient_identity_id = NEW.provider_patient_identity_id
  ORDER BY created_at DESC LIMIT 1;
  SELECT * INTO profile FROM public.user_profiles
  WHERE user_id = NEW.response_principal_id::text LIMIT 1;

  IF roster.id IS NULL OR profile.user_id IS NULL
     OR lower(trim(profile.first_name)) <> lower(trim(roster.given_name))
     OR lower(trim(profile.last_name)) <> lower(trim(roster.family_name))
     OR profile.date_of_birth IS DISTINCT FROM roster.birth_date THEN
    INSERT INTO public.patient_clinical_release_events (
      invitation_id, consumer_principal_id, provider_patient_identity_id, outcome, reason
    ) VALUES (NEW.id, NEW.response_principal_id, NEW.provider_patient_identity_id,
      'blocked_identity_mismatch', 'profile name and date of birth must match the provider roster');
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.patient_identity_links link
    JOIN public.provider_access_grants grant_row
      ON grant_row.provider_patient_identity_id = link.provider_patient_identity_id
     AND grant_row.consumer_principal_id = link.consumer_principal_id
    WHERE link.provider_patient_identity_id = NEW.provider_patient_identity_id
      AND link.consumer_principal_id = NEW.response_principal_id AND link.status = 'active'
      AND grant_row.status = 'active' AND 'clinical.imported_records' = ANY(grant_row.scope)
      AND (grant_row.expires_at IS NULL OR grant_row.expires_at > now())
  ) THEN RAISE EXCEPTION 'active consent-bound identity link required'; END IF;

  SELECT count(*) INTO package_count FROM public.provider_clinical_packages
  WHERE provider_patient_identity_id = NEW.provider_patient_identity_id
    AND provider_account_id = NEW.provider_account_id AND status = 'validated' AND synthetic;
  IF package_count = 0 THEN
    INSERT INTO public.patient_clinical_release_events (
      invitation_id, consumer_principal_id, provider_patient_identity_id, outcome, reason
    ) VALUES (NEW.id, NEW.response_principal_id, NEW.provider_patient_identity_id,
      'no_validated_packages', 'no validated synthetic clinical packages were available');
    RETURN NEW;
  END IF;

  INSERT INTO public.patient_clinical_records (
    consumer_principal_id, provider_account_id, provider_patient_identity_id,
    source_package_id, source_resource_id, resource_type, external_resource_id,
    title, occurred_at, provider_name, payload, provenance, consent_receipt_id
  )
  SELECT NEW.response_principal_id, NEW.provider_account_id, NEW.provider_patient_identity_id,
    package.id, resource.id, resource.resource_type, resource.external_resource_id,
    resource.title, resource.occurred_at, resource.provider_name, resource.payload,
    jsonb_build_object('sourceFormat', package.source_format, 'sourceLabel', package.source_label,
      'sourceDigest', package.source_digest, 'batchDigest', package.source_batch_digest,
      'synthetic', package.synthetic, 'invitationId', NEW.id), receipt.id
  FROM public.provider_clinical_packages package
  JOIN public.provider_clinical_resources resource ON resource.package_id = package.id
  WHERE package.provider_patient_identity_id = NEW.provider_patient_identity_id
    AND package.provider_account_id = NEW.provider_account_id
    AND package.status = 'validated' AND package.synthetic
  ON CONFLICT (consumer_principal_id, source_resource_id) DO NOTHING;
  GET DIAGNOSTICS resource_count = ROW_COUNT;

  INSERT INTO public.health_records (
    user_id, kind, title, provider_name, provider_id, service_date, received_at,
    source, ai_summary, tags, fhir_ref, provider_clinical_resource_id
  )
  SELECT NEW.response_principal_id::text,
    CASE WHEN record.resource_type = 'lab' THEN 'lab' ELSE 'other' END,
    record.title, record.provider_name, NEW.provider_account_id::text,
    record.occurred_at::date, record.released_at, 'connected',
    record.payload->>'summary', ARRAY[record.resource_type, 'provider-imported', 'synthetic'],
    jsonb_build_object('providerClinicalResourceId', record.source_resource_id,
      'externalResourceId', record.external_resource_id, 'provenance', record.provenance,
      'payload', record.payload), record.source_resource_id
  FROM public.patient_clinical_records record
  WHERE record.consumer_principal_id = NEW.response_principal_id
    AND record.provider_patient_identity_id = NEW.provider_patient_identity_id
    AND record.consent_receipt_id = receipt.id
  ON CONFLICT (user_id, provider_clinical_resource_id)
    WHERE provider_clinical_resource_id IS NOT NULL DO NOTHING;

  UPDATE public.provider_clinical_packages SET status = 'released', released_at = now()
  WHERE provider_patient_identity_id = NEW.provider_patient_identity_id
    AND provider_account_id = NEW.provider_account_id AND status = 'validated' AND synthetic;

  INSERT INTO public.patient_clinical_release_events (
    invitation_id, consumer_principal_id, provider_patient_identity_id,
    outcome, package_count, resource_count
  ) VALUES (NEW.id, NEW.response_principal_id, NEW.provider_patient_identity_id,
    'released', package_count, resource_count);
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.release_consented_provider_clinical_records() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS release_consented_provider_clinical_records_on_acceptance ON public.patient_access_invitations;
CREATE TRIGGER release_consented_provider_clinical_records_on_acceptance
  AFTER UPDATE OF status ON public.patient_access_invitations
  FOR EACH ROW EXECUTE FUNCTION public.release_consented_provider_clinical_records();

COMMENT ON TABLE public.patient_clinical_records IS
  'Patient-owned immutable snapshots of provider-imported records released after explicit clinical consent and exact roster/profile identity matching.';
COMMENT ON FUNCTION public.release_consented_provider_clinical_records() IS
  'Fail-closed synthetic pilot release: requires consent v3, clinical scope, receipt, active matching link/grant, and exact name plus date-of-birth match.';
