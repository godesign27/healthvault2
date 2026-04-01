/*
  # Create health_records table

  1. New Tables
    - `health_records`
      - `id` (uuid, primary key) - unique record identifier
      - `user_id` (text, required) - owner of the record
      - `kind` (text, required) - record category: lab, imaging, pathology, specialist_report, other
      - `title` (text, required) - display title of the record
      - `provider_name` (text) - name of the originating provider or facility
      - `provider_id` (text) - external provider identifier
      - `service_date` (date) - date the service or test was performed
      - `received_at` (timestamptz) - when the record was received in the vault
      - `source` (text, required) - how the record was obtained: connected, uploaded, shared
      - `file_type` (text) - file format: pdf, jpg, png, dicom, txt
      - `file_size_bytes` (integer) - size of the stored file
      - `preview_url` (text) - URL to the file or preview
      - `ai_summary` (text) - AI-generated plain-language summary
      - `tags` (text array) - classification tags
      - `fhir_ref` (jsonb) - original FHIR resource reference if applicable
      - `created_at` (timestamptz) - row creation timestamp
      - `updated_at` (timestamptz) - last modification timestamp

  2. Security
    - Enable RLS on `health_records` table
    - Add policies for authenticated users to manage their own records
    - Add policy for anon access scoped to demo user for development

  3. Indexes
    - Index on user_id for ownership queries
    - Index on kind for category filtering
    - Index on service_date for date range queries
*/

CREATE TABLE IF NOT EXISTS health_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('lab', 'imaging', 'pathology', 'specialist_report', 'other')),
  title text NOT NULL,
  provider_name text,
  provider_id text,
  service_date date,
  received_at timestamptz DEFAULT now(),
  source text NOT NULL DEFAULT 'uploaded' CHECK (source IN ('connected', 'uploaded', 'shared')),
  file_type text,
  file_size_bytes integer,
  preview_url text,
  ai_summary text,
  tags text[] DEFAULT '{}',
  fhir_ref jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own health records"
  ON health_records FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own health records"
  ON health_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own health records"
  ON health_records FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own health records"
  ON health_records FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Anon can view demo health records"
  ON health_records FOR SELECT
  TO anon
  USING (user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Anon can insert demo health records"
  ON health_records FOR INSERT
  TO anon
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

CREATE INDEX IF NOT EXISTS idx_health_records_user_id ON health_records(user_id);
CREATE INDEX IF NOT EXISTS idx_health_records_kind ON health_records(kind);
CREATE INDEX IF NOT EXISTS idx_health_records_service_date ON health_records(service_date);
