CREATE INDEX IF NOT EXISTS idx_practitioner_profiles_provider_account
  ON public.practitioner_profiles (provider_account_id, status);

CREATE INDEX IF NOT EXISTS idx_practitioner_profiles_credential_reviewer
  ON public.practitioner_profiles (credential_reviewed_by)
  WHERE credential_reviewed_by IS NOT NULL;
