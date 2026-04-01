/*
  # Create scenarios table

  1. New Tables
    - `scenarios`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `segmentation_name` (text) - e.g., "Italy", "USA"
      - `business_unit` (text) - e.g., "Primary Care", "Neuro"
      - `time_period` (text) - e.g., "Q4 2025 Oct 01 - Dec 31"
      - `name` (text) - scenario name
      - `type` (text) - segmentation type (behavioral, attitudinal, etc)
      - `customer_type` (text) - HCP, Patient, etc
      - `level` (text) - brand, portfolio, etc
      - `level_name` (text) - specific brand/portfolio name
      - `modeling_framework` (text) - rule-based, clustering, etc
      - `num_dimensions` (integer) - number of dimensions
      - `dimensions` (jsonb) - array of dimension objects
      - `current_step` (integer) - wizard step (1-4)
      - `status` (text) - draft or published
      - `modified_by` (text) - user identifier
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `scenarios` table
    - Add policy for public access (demo mode)
*/

CREATE TABLE IF NOT EXISTS scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  segmentation_name text NOT NULL,
  business_unit text NOT NULL,
  time_period text NOT NULL,
  name text NOT NULL,
  type text DEFAULT 'behavioral',
  customer_type text DEFAULT 'hcp',
  level text DEFAULT 'brand',
  level_name text DEFAULT '',
  modeling_framework text DEFAULT 'rule-based',
  num_dimensions integer DEFAULT 0,
  dimensions jsonb DEFAULT '[]'::jsonb,
  current_step integer DEFAULT 1,
  status text DEFAULT 'draft',
  modified_by text DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to scenarios"
  ON scenarios
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to scenarios"
  ON scenarios
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to scenarios"
  ON scenarios
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to scenarios"
  ON scenarios
  FOR DELETE
  TO public
  USING (true);
