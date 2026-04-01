-- Create preventive_care table
-- Tracks recommended screenings, checkups, and preventive health items.
-- Items can be provider-recommended or assistant-suggested.

CREATE TABLE IF NOT EXISTS preventive_care (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  item_name text NOT NULL,
  category text NOT NULL CHECK (category IN ('screening', 'checkup', 'vaccination', 'lab', 'other')),
  status text NOT NULL DEFAULT 'due' CHECK (status IN ('due', 'overdue', 'scheduled', 'completed', 'declined')),
  recommended_date date,
  completed_date date,
  next_due_date date,
  frequency text,
  provider text,
  notes text,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'provider', 'assistant', 'imported')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE preventive_care ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preventive care items"
  ON preventive_care FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own preventive care items"
  ON preventive_care FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own preventive care items"
  ON preventive_care FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own preventive care items"
  ON preventive_care FOR DELETE
  TO authenticated
  USING (user_id = auth.uid()::text);

CREATE INDEX IF NOT EXISTS idx_preventive_care_user_id ON preventive_care(user_id);
CREATE INDEX IF NOT EXISTS idx_preventive_care_status ON preventive_care(status);
