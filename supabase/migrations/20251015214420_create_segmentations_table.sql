/*
  # Create segmentations table

  1. New Tables
    - `segmentations`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `name` (text) - e.g., "Italy", "USA", "Germany"
      - `business_unit` (text) - e.g., "Primary Care", "Neuro"
      - `docs` (integer) - number of documents/scenarios
      - `users` (integer) - number of users
      - `has_scenario` (boolean) - whether this segmentation has scenarios
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `segmentations` table
    - Add policy for public access (demo mode)
*/

CREATE TABLE IF NOT EXISTS segmentations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  business_unit text NOT NULL,
  docs integer DEFAULT 0,
  users integer DEFAULT 7,
  has_scenario boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE segmentations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to segmentations"
  ON segmentations
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to segmentations"
  ON segmentations
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to segmentations"
  ON segmentations
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to segmentations"
  ON segmentations
  FOR DELETE
  TO public
  USING (true);
