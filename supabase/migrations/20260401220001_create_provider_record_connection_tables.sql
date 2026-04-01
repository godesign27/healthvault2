/*
  # Provider Record Connection tables

  Creates the schema for Provider Record Connection:
  1. provider_organizations — registry of healthcare organizations and their EHR capabilities
  2. provider_connections — tracks a user's active digital connections to provider organizations
  3. record_import_jobs — tracks import job lifecycle from preview through completion

  These are distinct from the existing care-network `providers` table, which stores
  personal provider contacts. These tables power digital record exchange.
*/

-- provider_organizations: registry of organizations with EHR capability metadata
CREATE TABLE IF NOT EXISTS provider_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  ehr_vendor text,
  portal_brand text,
  fhir_endpoint_url text,
  supports_direct_connection boolean DEFAULT false NOT NULL,
  supports_epic_connection boolean DEFAULT false NOT NULL,
  supports_manual_request boolean DEFAULT true NOT NULL,
  city text,
  state text,
  logo_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- provider_connections: user ↔ organization digital connections
CREATE TABLE IF NOT EXISTS provider_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider_organization_id uuid NOT NULL REFERENCES provider_organizations(id),
  connection_method text NOT NULL DEFAULT 'manual_fallback',
  status text NOT NULL DEFAULT 'pending',
  fhir_access_token text,
  fhir_refresh_token text,
  fhir_patient_id text,
  token_expires_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT valid_connection_method CHECK (connection_method IN ('existing_connection', 'direct_provider_connection', 'epic_connection', 'manual_fallback')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'expired', 'revoked', 'pending'))
);

-- record_import_jobs: lifecycle of an import from preview → complete
CREATE TABLE IF NOT EXISTS record_import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider_connection_id uuid REFERENCES provider_connections(id),
  strategy text NOT NULL DEFAULT 'manual_fallback',
  status text NOT NULL DEFAULT 'preview',
  preview_data jsonb DEFAULT '{}'::jsonb,
  counts jsonb DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz,
  CONSTRAINT valid_import_status CHECK (status IN ('preview', 'confirmed', 'importing', 'complete', 'failed'))
);

-- RLS
ALTER TABLE provider_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_import_jobs ENABLE ROW LEVEL SECURITY;

-- provider_organizations: readable by all authenticated users (it's a public directory)
CREATE POLICY "Authenticated users can read provider organizations"
  ON provider_organizations FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- provider_connections: user-scoped
CREATE POLICY "Users can view own provider connections"
  ON provider_connections FOR SELECT
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can insert own provider connections"
  ON provider_connections FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can update own provider connections"
  ON provider_connections FOR UPDATE
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can delete own provider connections"
  ON provider_connections FOR DELETE
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Service role bypass for provider_connections
CREATE POLICY "Service role full access to provider connections"
  ON provider_connections
  USING (current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'service_role');

-- record_import_jobs: user-scoped
CREATE POLICY "Users can view own import jobs"
  ON record_import_jobs FOR SELECT
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can insert own import jobs"
  ON record_import_jobs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can update own import jobs"
  ON record_import_jobs FOR UPDATE
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Service role bypass for import jobs
CREATE POLICY "Service role full access to import jobs"
  ON record_import_jobs
  USING (current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_provider_connections_user_id ON provider_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_connections_org_id ON provider_connections(provider_organization_id);
CREATE INDEX IF NOT EXISTS idx_provider_connections_status ON provider_connections(status);
CREATE INDEX IF NOT EXISTS idx_record_import_jobs_user_id ON record_import_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_organizations_name ON provider_organizations USING gin(to_tsvector('english', name));

-- Seed scaffold provider organizations (clearly marked as placeholder data)
INSERT INTO provider_organizations (name, ehr_vendor, portal_brand, supports_direct_connection, supports_epic_connection, supports_manual_request, city, state)
VALUES
  ('Springfield Medical Center', 'Epic', 'MyChart', false, true, true, 'Springfield', 'IL'),
  ('Riverside Health System', 'Cerner', 'Cerner Health', false, false, true, 'Springfield', 'IL'),
  ('Mercy Hospital Network', 'Epic', 'MyChart', false, true, true, 'Chicago', 'IL'),
  ('Valley Health Partners', 'Athenahealth', 'athenaPatient', false, false, true, 'Decatur', 'IL'),
  ('University Medical Group', 'Epic', 'MyChart', false, true, true, 'Champaign', 'IL')
ON CONFLICT DO NOTHING;
