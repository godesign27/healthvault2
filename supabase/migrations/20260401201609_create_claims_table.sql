/*
  # Create claims table

  1. New Tables
    - `claims` - Tracks insurance claims
      - `id` (uuid, primary key)
      - `user_id` (text, owner)
      - `coverage_id` (uuid, FK to insurance_coverages)
      - `claim_number` (text, optional)
      - `provider_name` (text, optional)
      - `service_date` (date, optional)
      - `billed_amount`, `allowed_amount`, `patient_responsibility` (numeric)
      - `status` (text, constrained: submitted/processing/approved/denied/appealed)
      - `description` (text, optional)
      - `created_at`, `updated_at` (timestamptz)
  2. Security
    - RLS enabled
    - Authenticated users can CRUD own claims
    - Anon can view/insert demo claims
  3. Indexes
    - user_id, service_date
*/

CREATE TABLE IF NOT EXISTS claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  coverage_id uuid REFERENCES insurance_coverages(id),
  claim_number text,
  provider_name text,
  service_date date,
  billed_amount numeric(10,2),
  allowed_amount numeric(10,2),
  patient_responsibility numeric(10,2),
  status text NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'processing', 'approved', 'denied', 'appealed')),
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own claims"
  ON claims FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own claims"
  ON claims FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own claims"
  ON claims FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own claims"
  ON claims FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Anon can view demo claims"
  ON claims FOR SELECT
  TO anon
  USING (user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Anon can insert demo claims"
  ON claims FOR INSERT
  TO anon
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

CREATE INDEX idx_claims_user_id ON claims(user_id);
CREATE INDEX idx_claims_service_date ON claims(service_date);