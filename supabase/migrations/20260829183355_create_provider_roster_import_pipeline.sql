-- Health Vault provider roster CSV v1: protected staging, commit, provenance, and compensation.
CREATE TABLE IF NOT EXISTS public.provider_import_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_account_id uuid NOT NULL REFERENCES public.provider_accounts(id) ON DELETE CASCADE,
  source_system text NOT NULL,
  display_name text NOT NULL,
  import_type text NOT NULL DEFAULT 'roster_csv_v1' CHECK (import_type = 'roster_csv_v1'),
  synthetic boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_account_id, source_system)
);

CREATE TABLE IF NOT EXISTS public.provider_import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_account_id uuid NOT NULL REFERENCES public.provider_accounts(id) ON DELETE CASCADE,
  import_source_id uuid NOT NULL REFERENCES public.provider_import_sources(id) ON DELETE RESTRICT,
  schema_version text NOT NULL CHECK (schema_version = 'health_vault_roster_csv_v1'),
  content_sha256 text NOT NULL CHECK (content_sha256 ~ '^[0-9a-f]{64}$'),
  status text NOT NULL DEFAULT 'staged' CHECK (status IN ('staged', 'validated', 'rejected', 'committed', 'rolled_back')),
  row_count integer NOT NULL DEFAULT 0 CHECK (row_count >= 0),
  valid_row_count integer NOT NULL DEFAULT 0 CHECK (valid_row_count >= 0),
  invalid_row_count integer NOT NULL DEFAULT 0 CHECK (invalid_row_count >= 0),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  committed_by uuid REFERENCES auth.users(id),
  committed_at timestamptz,
  rolled_back_by uuid REFERENCES auth.users(id),
  rolled_back_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_account_id, import_source_id, content_sha256)
);

CREATE TABLE IF NOT EXISTS public.provider_import_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_job_id uuid NOT NULL REFERENCES public.provider_import_jobs(id) ON DELETE CASCADE,
  row_number integer NOT NULL CHECK (row_number > 1),
  external_patient_id text NOT NULL,
  organization_patient_number text,
  given_name text NOT NULL,
  family_name text NOT NULL,
  birth_date date NOT NULL CHECK (birth_date <= CURRENT_DATE),
  administrative_sex text CHECK (administrative_sex IN ('female', 'male', 'other', 'unknown')),
  email text,
  phone text,
  address_line_1 text,
  address_line_2 text,
  city text,
  state text,
  postal_code text,
  country text,
  validation_status text NOT NULL DEFAULT 'valid' CHECK (validation_status IN ('valid', 'invalid', 'quarantined')),
  committed_patient_identity_id uuid REFERENCES public.provider_patient_identities(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (import_job_id, row_number),
  UNIQUE (import_job_id, external_patient_id)
);

CREATE TABLE IF NOT EXISTS public.provider_import_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_job_id uuid NOT NULL REFERENCES public.provider_import_jobs(id) ON DELETE CASCADE,
  import_row_id uuid REFERENCES public.provider_import_rows(id) ON DELETE CASCADE,
  field_name text,
  error_code text NOT NULL,
  safe_message text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'waived')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.provider_import_reconciliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_job_id uuid NOT NULL REFERENCES public.provider_import_jobs(id) ON DELETE CASCADE,
  inserted_count integer NOT NULL DEFAULT 0,
  updated_count integer NOT NULL DEFAULT 0,
  unchanged_count integer NOT NULL DEFAULT 0,
  exception_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_import_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_import_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_import_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_import_reconciliations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.provider_import_sources, public.provider_import_jobs,
  public.provider_import_rows, public.provider_import_exceptions,
  public.provider_import_reconciliations FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.commit_provider_roster_import(requested_import_job_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  current_user_id uuid := auth.uid();
  target_job public.provider_import_jobs%ROWTYPE;
  inserted_rows integer := 0;
BEGIN
  IF current_user_id IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  SELECT * INTO target_job FROM public.provider_import_jobs WHERE id = requested_import_job_id FOR UPDATE;
  IF NOT FOUND OR target_job.status <> 'validated' OR target_job.invalid_row_count <> 0 THEN RAISE EXCEPTION 'validated import job required'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.provider_memberships membership
    JOIN public.provider_membership_roles membership_role ON membership_role.membership_id = membership.id
    WHERE membership.provider_account_id = target_job.provider_account_id AND membership.principal_id = current_user_id
      AND membership.status = 'active' AND membership_role.role_key IN ('organization_owner', 'provider_admin', 'integration_operator')
  ) THEN RAISE EXCEPTION 'import management permission required'; END IF;

  INSERT INTO public.provider_patient_identities (provider_account_id, external_patient_id, organization_patient_number, source_system, source_import_job_id)
  SELECT target_job.provider_account_id, row.external_patient_id, NULLIF(row.organization_patient_number, ''), source.source_system, target_job.id
  FROM public.provider_import_rows row
  JOIN public.provider_import_sources source ON source.id = target_job.import_source_id
  WHERE row.import_job_id = target_job.id AND row.validation_status = 'valid'
  ON CONFLICT (provider_account_id, source_system, external_patient_id) DO NOTHING;
  GET DIAGNOSTICS inserted_rows = ROW_COUNT;

  UPDATE public.provider_import_rows row SET committed_patient_identity_id = patient.id
  FROM public.provider_patient_identities patient, public.provider_import_sources source
  WHERE row.import_job_id = target_job.id AND source.id = target_job.import_source_id
    AND patient.provider_account_id = target_job.provider_account_id AND patient.source_system = source.source_system
    AND patient.external_patient_id = row.external_patient_id;
  INSERT INTO public.provider_import_reconciliations (import_job_id, inserted_count, unchanged_count)
  VALUES (target_job.id, inserted_rows, target_job.valid_row_count - inserted_rows);
  UPDATE public.provider_import_jobs SET status = 'committed', committed_by = current_user_id, committed_at = now() WHERE id = target_job.id;
  RETURN jsonb_build_object('import_job_id', target_job.id, 'inserted_count', inserted_rows, 'unchanged_count', target_job.valid_row_count - inserted_rows);
END;
$$;

CREATE OR REPLACE FUNCTION public.rollback_provider_roster_import(requested_import_job_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE current_user_id uuid := auth.uid(); target_job public.provider_import_jobs%ROWTYPE; removed_rows integer := 0;
BEGIN
  IF current_user_id IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  SELECT * INTO target_job FROM public.provider_import_jobs WHERE id = requested_import_job_id FOR UPDATE;
  IF NOT FOUND OR target_job.status <> 'committed' THEN RAISE EXCEPTION 'committed import job required'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.provider_memberships membership JOIN public.provider_membership_roles membership_role ON membership_role.membership_id = membership.id
    WHERE membership.provider_account_id = target_job.provider_account_id AND membership.principal_id = current_user_id
      AND membership.status = 'active' AND membership_role.role_key IN ('organization_owner', 'provider_admin')
  ) THEN RAISE EXCEPTION 'provider administrator permission required'; END IF;
  DELETE FROM public.provider_patient_identities WHERE source_import_job_id = target_job.id;
  GET DIAGNOSTICS removed_rows = ROW_COUNT;
  UPDATE public.provider_import_jobs SET status = 'rolled_back', rolled_back_by = current_user_id, rolled_back_at = now() WHERE id = target_job.id;
  RETURN jsonb_build_object('import_job_id', target_job.id, 'removed_count', removed_rows);
END;
$$;

REVOKE ALL ON FUNCTION public.commit_provider_roster_import(uuid), public.rollback_provider_roster_import(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.commit_provider_roster_import(uuid), public.rollback_provider_roster_import(uuid) TO authenticated;

COMMENT ON TABLE public.provider_import_rows IS 'Protected roster-only CSV v1 staging. Raw clinical payloads are prohibited.';
