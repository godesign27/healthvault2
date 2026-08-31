ALTER TABLE public.provider_clinical_packages
  ADD COLUMN source_batch_digest text;

UPDATE public.provider_clinical_packages
SET source_batch_digest = source_digest
WHERE source_batch_digest IS NULL;

ALTER TABLE public.provider_clinical_packages
  ALTER COLUMN source_batch_digest SET NOT NULL,
  DROP CONSTRAINT provider_clinical_packages_source_format_check,
  ADD CONSTRAINT provider_clinical_packages_source_format_check
    CHECK (source_format IN ('health_vault_clinical_json_v1', 'health_vault_clinical_bulk_json_v1', 'fhir_r4_bundle'));

CREATE INDEX idx_provider_clinical_packages_batch
  ON public.provider_clinical_packages (provider_account_id, source_batch_digest, created_at DESC);

COMMENT ON COLUMN public.provider_clinical_packages.source_batch_digest IS
  'SHA-256 of the original provider upload. A bulk file creates one separately releasable package per roster patient.';
