/*
  # Remove temporary anon upload policy

  1. Changes
    - Remove the temporary policy that allowed anon to upload logo
    
  2. Security
    - Logo is already uploaded, no longer need anon upload access
*/

-- Remove the temporary anon upload policy
DROP POLICY IF EXISTS "Allow anon to upload logo" ON storage.objects;
