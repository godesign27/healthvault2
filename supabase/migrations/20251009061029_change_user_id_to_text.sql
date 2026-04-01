/*
  # Change user_id column type to text

  1. Changes
    - Alter the user_id column from uuid to text type
    - This allows for demo/testing without authentication

  2. Notes
    - Existing data will be preserved
    - For production, you would want to use proper UUID types with auth
*/

ALTER TABLE projects ALTER COLUMN user_id TYPE text USING user_id::text;
