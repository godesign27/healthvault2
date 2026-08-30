UPDATE public.provider_import_rows AS import_row
SET email = 'godesigngo@aol.com'
FROM public.provider_import_jobs AS import_job
JOIN public.provider_import_sources AS import_source
  ON import_source.id = import_job.import_source_id
JOIN public.provider_accounts AS provider
  ON provider.id = import_job.provider_account_id
WHERE import_row.import_job_id = import_job.id
  AND import_row.committed_patient_identity_id IS NOT NULL
  AND import_source.synthetic = true
  AND provider.id = 'eceb6b6c-fc20-4974-a19a-a1f6443a7dc2'
  AND provider.display_name = 'Health Vault Demo Provider';

INSERT INTO public.admin_audit_events (
  provider_account_id,
  action,
  target_type,
  target_ref,
  authorization_context,
  reason,
  outcome,
  metadata
)
VALUES (
  'eceb6b6c-fc20-4974-a19a-a1f6443a7dc2',
  'provider.synthetic_roster.contact_email.seed',
  'provider_import_rows',
  'committed-synthetic-roster',
  jsonb_build_object('source', 'development_migration', 'syntheticOnly', true),
  'Enable local patient invitation workflow review',
  'succeeded',
  jsonb_build_object('email', 'godesigngo@aol.com')
);
