/*
  # Fix Patient Profiles RLS Policies

  Restrict patient_profiles table to only allow users to access their own data.
*/

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can insert patient profiles" ON patient_profiles;
DROP POLICY IF EXISTS "Users can update patient profiles" ON patient_profiles;

-- Create restrictive policies
CREATE POLICY "Users can insert patient profiles"
  ON patient_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()::text));

CREATE POLICY "Users can update patient profiles"
  ON patient_profiles FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()::text))
  WITH CHECK (user_id = (SELECT auth.uid()::text));
