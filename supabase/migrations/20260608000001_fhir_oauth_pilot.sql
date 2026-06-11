/*
  Phase B — SMART on FHIR OAuth pilot

  - OAuth endpoint columns on provider_organizations
  - Short-lived PKCE state store for the authorization callback
  - Pilot sandbox org (SMART Health IT R4)
*/

ALTER TABLE provider_organizations
  ADD COLUMN IF NOT EXISTS authorization_endpoint text,
  ADD COLUMN IF NOT EXISTS token_endpoint text,
  ADD COLUMN IF NOT EXISTS smart_scopes text;

CREATE TABLE IF NOT EXISTS fhir_oauth_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connection_id uuid NOT NULL REFERENCES provider_connections(id) ON DELETE CASCADE,
  provider_organization_id uuid NOT NULL REFERENCES provider_organizations(id),
  state text NOT NULL UNIQUE,
  code_verifier text NOT NULL,
  connection_method text NOT NULL,
  redirect_after text,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fhir_oauth_states_state ON fhir_oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_fhir_oauth_states_expires ON fhir_oauth_states(expires_at);

ALTER TABLE fhir_oauth_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages oauth states"
  ON fhir_oauth_states
  USING (current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'service_role');

-- Pilot org: SMART Health IT public R4 sandbox (requires FHIR_CLIENT_ID secret)
INSERT INTO provider_organizations (
  name,
  ehr_vendor,
  portal_brand,
  supports_direct_connection,
  supports_epic_connection,
  supports_manual_request,
  fhir_endpoint_url,
  authorization_endpoint,
  token_endpoint,
  smart_scopes,
  city,
  state
)
SELECT
  'SMART Health IT Sandbox (Pilot)',
  'SMART',
  'Sandbox',
  true,
  false,
  true,
  'https://launch.smarthealthit.org/v/r4/fhir',
  'https://launch.smarthealthit.org/v/r4/auth/authorize',
  'https://launch.smarthealthit.org/v/r4/auth/token',
  'patient/*.read openid offline_access',
  'Boston',
  'MA'
WHERE NOT EXISTS (
  SELECT 1 FROM provider_organizations WHERE name = 'SMART Health IT Sandbox (Pilot)'
);

UPDATE provider_organizations
SET
  supports_direct_connection = true,
  fhir_endpoint_url = 'https://launch.smarthealthit.org/v/r4/fhir',
  authorization_endpoint = 'https://launch.smarthealthit.org/v/r4/auth/authorize',
  token_endpoint = 'https://launch.smarthealthit.org/v/r4/auth/token',
  smart_scopes = COALESCE(smart_scopes, 'patient/*.read openid offline_access')
WHERE name = 'SMART Health IT Sandbox (Pilot)';
