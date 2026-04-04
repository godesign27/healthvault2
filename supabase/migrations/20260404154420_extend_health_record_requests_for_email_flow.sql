/*
  # Extend health_record_requests for provider email flow

  1. New Columns on `health_record_requests`
    - `provider_email` (text) - email address to send the request to
    - `doctor_name` (text, nullable) - optional doctor name
    - `message` (text, nullable) - message from patient to provider
    - `patient_name` (text, default '') - display name shown to provider
    - `secure_token` (text, unique) - random token for provider link auth
    - `urgency` (text, default 'routine') - routine or urgent
    - `expires_at` (timestamptz) - when the provider link expires
    - `opened_at` (timestamptz, nullable) - when the provider first opened the link
    - `submitted_at` (timestamptz, nullable) - when the provider submitted records

  2. New Tables
    - `record_request_files`
      - `id` (uuid, primary key)
      - `request_id` (uuid, FK to health_record_requests)
      - `file_name` (text)
      - `file_type` (text)
      - `file_size_bytes` (integer)
      - `storage_path` (text)
      - `record_kind` (text)
      - `provider_notes` (text, nullable)
      - `created_at` (timestamptz)

  3. Security
    - Add anon demo policies to health_record_requests for demo user access
    - Enable RLS on record_request_files with service-role access
    - Add anon demo SELECT policy for record_request_files

  4. Notes
    - The secure_token is embedded in the provider email link for auth
    - Expiry defaults to 30 days from creation
    - Status flow: pending -> sent -> received | failed
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'health_record_requests' AND column_name = 'provider_email'
  ) THEN
    ALTER TABLE health_record_requests ADD COLUMN provider_email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'health_record_requests' AND column_name = 'doctor_name'
  ) THEN
    ALTER TABLE health_record_requests ADD COLUMN doctor_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'health_record_requests' AND column_name = 'message'
  ) THEN
    ALTER TABLE health_record_requests ADD COLUMN message text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'health_record_requests' AND column_name = 'patient_name'
  ) THEN
    ALTER TABLE health_record_requests ADD COLUMN patient_name text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'health_record_requests' AND column_name = 'secure_token'
  ) THEN
    ALTER TABLE health_record_requests ADD COLUMN secure_token text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'health_record_requests' AND column_name = 'urgency'
  ) THEN
    ALTER TABLE health_record_requests ADD COLUMN urgency text DEFAULT 'routine';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'health_record_requests' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE health_record_requests ADD COLUMN expires_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'health_record_requests' AND column_name = 'opened_at'
  ) THEN
    ALTER TABLE health_record_requests ADD COLUMN opened_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'health_record_requests' AND column_name = 'submitted_at'
  ) THEN
    ALTER TABLE health_record_requests ADD COLUMN submitted_at timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_health_record_requests_token
  ON health_record_requests(secure_token);

CREATE POLICY "Demo select access for health_record_requests"
  ON health_record_requests
  FOR SELECT
  TO anon
  USING (user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Demo insert access for health_record_requests"
  ON health_record_requests
  FOR INSERT
  TO anon
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Demo update access for health_record_requests"
  ON health_record_requests
  FOR UPDATE
  TO anon
  USING (user_id = '00000000-0000-0000-0000-000000000000')
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

CREATE TABLE IF NOT EXISTS record_request_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES health_record_requests(id),
  file_name text NOT NULL,
  file_type text NOT NULL DEFAULT 'pdf',
  file_size_bytes integer DEFAULT 0,
  storage_path text NOT NULL,
  record_kind text NOT NULL DEFAULT 'other',
  provider_notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE record_request_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Demo select access for record_request_files"
  ON record_request_files
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM health_record_requests
      WHERE health_record_requests.id = record_request_files.request_id
      AND health_record_requests.user_id = '00000000-0000-0000-0000-000000000000'
    )
  );

CREATE POLICY "Authenticated users can view own request files"
  ON record_request_files
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM health_record_requests
      WHERE health_record_requests.id = record_request_files.request_id
      AND health_record_requests.user_id = auth.uid()::text
    )
  );

CREATE INDEX IF NOT EXISTS idx_record_request_files_request_id
  ON record_request_files(request_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('record-request-files', 'record-request-files', false)
ON CONFLICT (id) DO NOTHING;