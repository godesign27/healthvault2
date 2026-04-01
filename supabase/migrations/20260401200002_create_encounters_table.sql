-- Create encounters table for tracking past clinical visits

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
