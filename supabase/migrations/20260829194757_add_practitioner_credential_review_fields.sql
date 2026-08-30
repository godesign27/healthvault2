ALTER TABLE public.practitioner_profiles
  ADD COLUMN IF NOT EXISTS credential_evidence_ref text,
  ADD COLUMN IF NOT EXISTS credential_review_reason text,
  ADD COLUMN IF NOT EXISTS credential_reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS credential_reviewed_at timestamptz;

COMMENT ON COLUMN public.practitioner_profiles.credential_evidence_ref IS
  'Bounded reference to credential evidence; never store credential documents or secrets here.';

CREATE INDEX IF NOT EXISTS idx_practitioner_profiles_credential_review
  ON public.practitioner_profiles (credential_status, updated_at DESC);
