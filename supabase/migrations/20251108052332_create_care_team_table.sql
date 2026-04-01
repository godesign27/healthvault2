/*
  # Care Team Table

  1. New Tables
    - `care_team` - Healthcare providers and specialists
      - `id` (uuid, primary key)
      - `user_id` (text, references auth.users)
      - `name` (text, required) - Provider's full name
      - `title` (text, optional) - Professional title (Dr., RN, etc.)
      - `specialty` (text, optional) - Medical specialty
      - `organization` (text, optional) - Hospital/clinic name
      - `email` (text, optional) - Contact email
      - `phone` (text, optional) - Contact phone
      - `photo_url` (text, optional) - Avatar/photo URL
      - `is_primary` (boolean, default false) - Primary care provider flag
      - `notes` (text, optional) - Additional notes
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `care_team` table
    - Add policies for authenticated users to manage their own care team members
*/

-- Create care_team table
CREATE TABLE IF NOT EXISTS care_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  name text NOT NULL,
  title text,
  specialty text,
  organization text,
  email text,
  phone text,
  photo_url text,
  is_primary boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE care_team ENABLE ROW LEVEL SECURITY;

-- Care team policies
CREATE POLICY "Users can view own care team"
  ON care_team FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own care team"
  ON care_team FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own care team"
  ON care_team FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own care team"
  ON care_team FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS care_team_user_id_idx ON care_team(user_id);
CREATE INDEX IF NOT EXISTS care_team_is_primary_idx ON care_team(user_id, is_primary) WHERE is_primary = true;
