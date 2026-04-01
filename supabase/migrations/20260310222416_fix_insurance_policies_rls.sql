/*
  # Fix Insurance Policies RLS Policies

  Restrict insurance_policies table to only allow users to access their own data
  or demo data.
*/

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow delete for own policies" ON insurance_policies;
DROP POLICY IF EXISTS "Allow insert for own policies" ON insurance_policies;
DROP POLICY IF EXISTS "Allow update for own policies" ON insurance_policies;
DROP POLICY IF EXISTS "Allow select for own policies" ON insurance_policies;

-- Create restrictive policies
CREATE POLICY "Allow select for own policies"
  ON insurance_policies FOR SELECT
  USING (user_id = (SELECT auth.uid()::text) OR user_id = 'demo-user');

CREATE POLICY "Allow insert for own policies"
  ON insurance_policies FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()::text) OR user_id = 'demo-user');

CREATE POLICY "Allow update for own policies"
  ON insurance_policies FOR UPDATE
  USING (user_id = (SELECT auth.uid()::text) OR user_id = 'demo-user')
  WITH CHECK (user_id = (SELECT auth.uid()::text) OR user_id = 'demo-user');

CREATE POLICY "Allow delete for own policies"
  ON insurance_policies FOR DELETE
  USING (user_id = (SELECT auth.uid()::text) OR user_id = 'demo-user');
