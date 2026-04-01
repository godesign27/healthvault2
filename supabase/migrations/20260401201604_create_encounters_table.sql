/*
  # Create encounters table

  1. New Tables
    - `encounters` - Tracks past clinical visits
      - `id` (uuid, primary key)
      - `user_id` (text, owner)
      - `title` (text)
      - `encounter_date` (date)
      - `provider_name` (text, optional)
      - `location` (text, optional)
      - `encounter_type` (text, constrained: office_visit/telehealth/emergency/lab/procedure/other)
      - `description` (text, optional)
      - `notes` (text, optional)
      - `created_at`, `updated_at` (timestamptz)
  2. Security
    - RLS enabled
    - Authenticated users can CRUD own encounters
    - Anon can view/insert demo encounters
  3. Indexes
    - user_id, encounter_date
*/

CREATE TABLE IF NOT EXISTS encounters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  title text NOT NULL,
  encounter_date date NOT NULL,
  provider_name text,
  location text,
  encounter_type text DEFAULT 'office_visit'
    CHECK (encounter_type IN ('office_visit', 'telehealth', 'emergency', 'lab', 'procedure', 'other')),
  description text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE encounters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own encounters"
  ON encounters FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own encounters"
  ON encounters FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own encounters"
  ON encounters FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own encounters"
  ON encounters FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Anon can view demo encounters"
  ON encounters FOR SELECT
  TO anon
  USING (user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Anon can insert demo encounters"
  ON encounters FOR INSERT
  TO anon
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

CREATE INDEX idx_encounters_user_id ON encounters(user_id);
CREATE INDEX idx_encounters_date ON encounters(encounter_date);