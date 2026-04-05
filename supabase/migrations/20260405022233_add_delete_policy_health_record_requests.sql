/*
  # Add DELETE policy for health_record_requests

  1. Security Changes
    - Add DELETE policy for anon role on `health_record_requests` table
      (scoped to demo user only)
    - Add DELETE policy for authenticated role on `health_record_requests` table
      (scoped to own records via auth.uid())

  2. Notes
    - Previously only SELECT, INSERT, UPDATE policies existed
    - Without a DELETE policy, RLS silently blocked all delete attempts
*/

CREATE POLICY "Demo delete access for health_record_requests"
  ON health_record_requests
  FOR DELETE
  TO anon
  USING (user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Users can delete own record requests"
  ON health_record_requests
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);
