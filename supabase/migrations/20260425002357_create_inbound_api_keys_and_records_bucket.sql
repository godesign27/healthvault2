/*
  # Create Inbound API Keys Table and Storage Bucket

  Enables external EHR systems (Epic, Cerner, FHIR servers) to push health
  records directly to a patient's vault without needing a prior request.

  ## New Tables

  ### inbound_api_keys
  Stores hashed API keys issued to provider organizations. Each key authorizes
  an external system to POST records on behalf of identified patients.

  - `id` (uuid) — primary key
  - `key_hash` (text) — SHA-256 hash of the raw API key (never stored in plain text)
  - `name` (text) — human-readable label, e.g. "Epic EHR Integration"
  - `organization_name` (text) — issuing organization
  - `is_active` (bool) — soft-disable without deleting
  - `created_by` (text) — user_id of the admin who created the key
  - `created_at` (timestamptz)
  - `last_used_at` (timestamptz) — updated on every successful auth

  ## Security
  - RLS enabled; only the creating user can read their own keys
  - Service-role (used by the edge function) bypasses RLS for validation

  ## Storage
  - New private bucket `inbound-records` for files pushed through the endpoint
  - Service-role-only write access; signed URLs generated per file for patient read access
*/

-- API Keys table
CREATE TABLE IF NOT EXISTS inbound_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT '',
  organization_name text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_by text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz
);

ALTER TABLE inbound_api_keys ENABLE ROW LEVEL SECURITY;

-- Owners can read their own keys
CREATE POLICY "Key owners can view their keys"
  ON inbound_api_keys
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid()::text);

-- Owners can insert keys
CREATE POLICY "Key owners can create keys"
  ON inbound_api_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid()::text);

-- Owners can revoke (update is_active) their own keys
CREATE POLICY "Key owners can revoke their keys"
  ON inbound_api_keys
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid()::text)
  WITH CHECK (created_by = auth.uid()::text);

CREATE INDEX IF NOT EXISTS idx_inbound_api_keys_key_hash ON inbound_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_inbound_api_keys_created_by ON inbound_api_keys(created_by);

-- Storage bucket for inbound pushed files
INSERT INTO storage.buckets (id, name, public)
VALUES ('inbound-records', 'inbound-records', false)
ON CONFLICT (id) DO NOTHING;

-- Only service role can upload (no direct client policy needed — edge function uses service role)
-- Authenticated users can read files stored under their own user_id prefix
CREATE POLICY "Users can read their own inbound records"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'inbound-records'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
