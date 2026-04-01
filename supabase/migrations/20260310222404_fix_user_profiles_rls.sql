/*
  # Fix User Profiles RLS Policies

  Restrict user_profiles table to only allow users to access their own data
  or demo data.
*/

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow insert for all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow update for all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow select for all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow delete for all profiles" ON user_profiles;

-- Create restrictive policies
CREATE POLICY "Allow select for own profiles"
  ON user_profiles FOR SELECT
  USING (user_id = (SELECT auth.uid()::text) OR user_id = 'demo-user');

CREATE POLICY "Allow insert for own profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()::text) OR user_id = 'demo-user');

CREATE POLICY "Allow update for own profiles"
  ON user_profiles FOR UPDATE
  USING (user_id = (SELECT auth.uid()::text) OR user_id = 'demo-user')
  WITH CHECK (user_id = (SELECT auth.uid()::text) OR user_id = 'demo-user');

CREATE POLICY "Allow delete for own profiles"
  ON user_profiles FOR DELETE
  USING (user_id = (SELECT auth.uid()::text) OR user_id = 'demo-user');
