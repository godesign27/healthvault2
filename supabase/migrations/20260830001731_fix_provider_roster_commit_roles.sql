/* Repair roster lifecycle RPCs to use the deployed role-array membership model. */
CREATE OR REPLACE FUNCTION public.commit_provider_roster_import(requested_import_job_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  target_job public.provider_import_jobs%ROWTYPE;
  inserted_rows integer := 0;
BEGIN
  IF current_user_id IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  SELECT * INTO target_job FROM public.provider_import_jobs
  WHERE id = requested_import_job_id FOR UPDATE;
  IF NOT FOUND OR target_job.status <> 'validated' OR target_job.invalid_row_count <> 0 THEN
    RAISE EXCEPTION 'validated import job required';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.provider_memberships membership
    WHERE membership.provider_account_id = target_job.provider_account_id
      AND membership.principal_id = current_user_id
      AND membership.status = 'active'
      AND membership.roles && ARRAY['organization_owner', 'provider_admin', 'integration_operator']::text[]
  ) THEN RAISE EXCEPTION 'import management permission required'; END IF;

  INSERT INTO public.provider_patient_identities (
    provider_account_id, external_patient_id, organization_patient_number,
    source_system, source_import_job_id
  )
  SELECT target_job.provider_account_id, row.external_patient_id,
    NULLIF(row.organization_patient_number, ''), source.source_system, target_job.id
  FROM public.provider_import_rows row
  JOIN public.provider_import_sources source ON source.id = target_job.import_source_id
  WHERE row.import_job_id = target_job.id AND row.validation_status = 'valid'
  ON CONFLICT (provider_account_id, source_system, external_patient_id) DO NOTHING;
  GET DIAGNOSTICS inserted_rows = ROW_COUNT;

  UPDATE public.provider_import_rows row SET committed_patient_identity_id = patient.id
  FROM public.provider_patient_identities patient, public.provider_import_sources source
  WHERE row.import_job_id = target_job.id AND source.id = target_job.import_source_id
    AND patient.provider_account_id = target_job.provider_account_id
    AND patient.source_system = source.source_system
    AND patient.external_patient_id = row.external_patient_id;
  INSERT INTO public.provider_import_reconciliations (import_job_id, inserted_count, unchanged_count)
  VALUES (target_job.id, inserted_rows, target_job.valid_row_count - inserted_rows);
  UPDATE public.provider_import_jobs
  SET status = 'committed', committed_by = current_user_id, committed_at = now()
  WHERE id = target_job.id;
  RETURN jsonb_build_object('import_job_id', target_job.id,
    'inserted_count', inserted_rows,
    'unchanged_count', target_job.valid_row_count - inserted_rows);
END;
$$;

CREATE OR REPLACE FUNCTION public.rollback_provider_roster_import(requested_import_job_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  target_job public.provider_import_jobs%ROWTYPE;
  removed_rows integer := 0;
BEGIN
  IF current_user_id IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  SELECT * INTO target_job FROM public.provider_import_jobs
  WHERE id = requested_import_job_id FOR UPDATE;
  IF NOT FOUND OR target_job.status <> 'committed' THEN
    RAISE EXCEPTION 'committed import job required';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.provider_memberships membership
    WHERE membership.provider_account_id = target_job.provider_account_id
      AND membership.principal_id = current_user_id
      AND membership.status = 'active'
      AND membership.roles && ARRAY['organization_owner', 'provider_admin']::text[]
  ) THEN RAISE EXCEPTION 'provider administrator permission required'; END IF;
  DELETE FROM public.provider_patient_identities
  WHERE source_import_job_id = target_job.id;
  GET DIAGNOSTICS removed_rows = ROW_COUNT;
  UPDATE public.provider_import_jobs
  SET status = 'rolled_back', rolled_back_by = current_user_id, rolled_back_at = now()
  WHERE id = target_job.id;
  RETURN jsonb_build_object('import_job_id', target_job.id, 'removed_count', removed_rows);
END;
$$;

REVOKE ALL ON FUNCTION public.commit_provider_roster_import(uuid),
  public.rollback_provider_roster_import(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.commit_provider_roster_import(uuid),
  public.rollback_provider_roster_import(uuid) TO authenticated;

COMMENT ON FUNCTION public.commit_provider_roster_import(uuid) IS
  'Commits a validated roster import using the canonical provider membership role-array authorization model.';
