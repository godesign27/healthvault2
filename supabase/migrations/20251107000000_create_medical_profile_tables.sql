/*
  # Medical Profile Tables

  1. New Tables
    - `conditions` - User health conditions
      - `id` (uuid, primary key)
      - `user_id` (text, references auth.users)
      - `name` (text, required)
      - `diagnosed_on` (date, optional)
      - `status` (text, optional - Active/In remission/Resolved)
      - `managing_physician` (text, optional)
      - `notes` (text, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `medications` - User medications
      - `id` (uuid, primary key)
      - `user_id` (text)
      - `name` (text, required)
      - `dosage` (text, optional)
      - `frequency` (text, optional)
      - `prescribed_by` (text, optional)
      - `start_date` (date, optional)
      - `end_date` (date, optional)
      - `notes` (text, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `allergies` - User allergies
      - `id` (uuid, primary key)
      - `user_id` (text)
      - `allergen` (text, required)
      - `reaction` (text, optional)
      - `severity` (text, optional - Mild/Moderate/Severe)
      - `diagnosed_on` (date, optional)
      - `notes` (text, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `immunizations` - User immunizations
      - `id` (uuid, primary key)
      - `user_id` (text)
      - `vaccine` (text, required)
      - `administered_on` (date, optional)
      - `provider` (text, optional)
      - `lot_number` (text, optional)
      - `next_dose` (date, optional)
      - `notes` (text, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own records
*/

-- Create conditions table
CREATE TABLE IF NOT EXISTS conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  name text NOT NULL,
  diagnosed_on date,
  status text CHECK (status IN ('Active', 'In remission', 'Resolved')),
  managing_physician text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create medications table
CREATE TABLE IF NOT EXISTS medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  name text NOT NULL,
  dosage text,
  frequency text,
  prescribed_by text,
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create allergies table
CREATE TABLE IF NOT EXISTS allergies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  allergen text NOT NULL,
  reaction text,
  severity text CHECK (severity IN ('Mild', 'Moderate', 'Severe')),
  diagnosed_on date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create immunizations table
CREATE TABLE IF NOT EXISTS immunizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  vaccine text NOT NULL,
  administered_on date,
  provider text,
  lot_number text,
  next_dose date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE immunizations ENABLE ROW LEVEL SECURITY;

-- Conditions policies
CREATE POLICY "Users can view own conditions"
  ON conditions FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own conditions"
  ON conditions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own conditions"
  ON conditions FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own conditions"
  ON conditions FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Medications policies
CREATE POLICY "Users can view own medications"
  ON medications FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own medications"
  ON medications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own medications"
  ON medications FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own medications"
  ON medications FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Allergies policies
CREATE POLICY "Users can view own allergies"
  ON allergies FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own allergies"
  ON allergies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own allergies"
  ON allergies FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own allergies"
  ON allergies FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Immunizations policies
CREATE POLICY "Users can view own immunizations"
  ON immunizations FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own immunizations"
  ON immunizations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own immunizations"
  ON immunizations FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own immunizations"
  ON immunizations FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS conditions_user_id_idx ON conditions(user_id);
CREATE INDEX IF NOT EXISTS medications_user_id_idx ON medications(user_id);
CREATE INDEX IF NOT EXISTS allergies_user_id_idx ON allergies(user_id);
CREATE INDEX IF NOT EXISTS immunizations_user_id_idx ON immunizations(user_id);
