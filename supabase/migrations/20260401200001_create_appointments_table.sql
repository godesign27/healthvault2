-- Create appointments table for tracking scheduled healthcare visits

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  provider_name text NOT NULL,
  provider_id text,
  appointment_type text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  location text,
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own appointments"
  ON appointments FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Anon can view demo appointments"
  ON appointments FOR SELECT
  TO anon
  USING (user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Anon can insert demo appointments"
  ON appointments FOR INSERT
  TO anon
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_scheduled_at ON appointments(scheduled_at);
