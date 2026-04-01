/*
  # Fix Insurance Coverages RLS for Anonymous Users

  1. Changes
    - Drop existing restrictive INSERT policy
    - Create new INSERT policy that allows both authenticated and anonymous users
    - The policy checks that user_id matches either auth.uid() OR the placeholder UUID
  
  2. Security
    - Authenticated users can only insert their own data (auth.uid() match)
    - Anonymous users can insert data with the placeholder user_id
    - This allows demo/testing without authentication while maintaining security for real users
*/

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can create own coverage" ON insurance_coverages;

-- Create new policy that allows anonymous inserts with placeholder user_id
CREATE POLICY "Users can create own coverage or anonymous can create"
  ON insurance_coverages
  FOR INSERT
  TO public
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR user_id = '00000000-0000-0000-0000-000000000000'::uuid
  );
