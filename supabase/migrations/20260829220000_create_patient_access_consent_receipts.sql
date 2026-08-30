CREATE TABLE public.patient_access_consent_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid NOT NULL UNIQUE REFERENCES public.patient_access_invitations(id) ON DELETE RESTRICT,
  provider_account_id uuid NOT NULL REFERENCES public.provider_accounts(id) ON DELETE RESTRICT,
  provider_patient_identity_id uuid NOT NULL REFERENCES public.provider_patient_identities(id) ON DELETE RESTRICT,
  consumer_principal_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  scope text[] NOT NULL,
  purpose text NOT NULL,
  consent_version text NOT NULL,
  consented_at timestamptz NOT NULL,
  effective_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  evidence_type text NOT NULL CHECK (evidence_type IN ('verified_email_invitation')),
  evidence_ref text NOT NULL,
  synthetic boolean NOT NULL,
  request_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (cardinality(scope) > 0),
  CHECK (expires_at > effective_at)
);

CREATE INDEX idx_patient_access_consent_receipts_consumer
  ON public.patient_access_consent_receipts (consumer_principal_id, consented_at DESC);
CREATE INDEX idx_patient_access_consent_receipts_provider
  ON public.patient_access_consent_receipts (provider_account_id, consented_at DESC);
CREATE INDEX idx_patient_access_consent_receipts_patient
  ON public.patient_access_consent_receipts (provider_patient_identity_id, consented_at DESC);

ALTER TABLE public.patient_access_consent_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.patient_access_consent_receipts FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.capture_patient_access_consent_receipt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  access_grant public.provider_access_grants%ROWTYPE;
BEGIN
  IF OLD.status IS DISTINCT FROM 'accepted' AND NEW.status = 'accepted' THEN
    IF NEW.response_principal_id IS NULL OR NEW.responded_at IS NULL OR NEW.request_id IS NULL THEN
      RAISE EXCEPTION 'accepted invitation evidence is incomplete';
    END IF;

    SELECT * INTO access_grant
    FROM public.provider_access_grants
    WHERE provider_patient_identity_id = NEW.provider_patient_identity_id
      AND consumer_principal_id = NEW.response_principal_id
      AND request_id = NEW.request_id
      AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;

    IF NOT FOUND OR access_grant.effective_at IS NULL OR access_grant.expires_at IS NULL THEN
      RAISE EXCEPTION 'matching access grant evidence is required';
    END IF;

    INSERT INTO public.patient_access_consent_receipts (
      invitation_id, provider_account_id, provider_patient_identity_id, consumer_principal_id,
      scope, purpose, consent_version, consented_at, effective_at, expires_at,
      evidence_type, evidence_ref, synthetic, request_id
    ) VALUES (
      NEW.id, NEW.provider_account_id, NEW.provider_patient_identity_id, NEW.response_principal_id,
      NEW.requested_scope, NEW.purpose, NEW.consent_version, NEW.responded_at,
      access_grant.effective_at, access_grant.expires_at,
      'verified_email_invitation', 'patient-access-invitation:' || NEW.id::text,
      NEW.synthetic, NEW.request_id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS capture_patient_access_consent_receipt_on_acceptance ON public.patient_access_invitations;
CREATE TRIGGER capture_patient_access_consent_receipt_on_acceptance
  AFTER UPDATE OF status ON public.patient_access_invitations
  FOR EACH ROW EXECUTE FUNCTION public.capture_patient_access_consent_receipt();

CREATE OR REPLACE FUNCTION public.reject_patient_access_consent_receipt_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'consent receipts are append-only' USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER prevent_patient_access_consent_receipt_mutation
  BEFORE UPDATE OR DELETE ON public.patient_access_consent_receipts
  FOR EACH ROW EXECUTE FUNCTION public.reject_patient_access_consent_receipt_mutation();

COMMENT ON TABLE public.patient_access_consent_receipts IS
  'Immutable synthetic-pilot consent evidence. Production use remains blocked pending approved language, evidence, retention, and field scope.';
