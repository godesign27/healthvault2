CREATE INDEX IF NOT EXISTS idx_provider_import_jobs_source ON public.provider_import_jobs (import_source_id);
CREATE INDEX IF NOT EXISTS idx_provider_import_jobs_created_by ON public.provider_import_jobs (created_by);
CREATE INDEX IF NOT EXISTS idx_provider_import_jobs_committed_by ON public.provider_import_jobs (committed_by) WHERE committed_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_provider_import_jobs_rolled_back_by ON public.provider_import_jobs (rolled_back_by) WHERE rolled_back_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_provider_import_rows_committed_identity ON public.provider_import_rows (committed_patient_identity_id) WHERE committed_patient_identity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_provider_import_exceptions_job ON public.provider_import_exceptions (import_job_id);
CREATE INDEX IF NOT EXISTS idx_provider_import_exceptions_row ON public.provider_import_exceptions (import_row_id) WHERE import_row_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_provider_import_reconciliations_job ON public.provider_import_reconciliations (import_job_id);
