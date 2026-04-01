/*
  # Create User Profiles Table

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key) - Unique identifier for the profile
      - `user_id` (text) - User identifier (for demo purposes)
      - `first_name` (text) - User's first name
      - `last_name` (text) - User's last name
      - `profile_photo_url` (text, nullable) - URL to profile photo
      - `email` (text) - User's email address
      - `created_at` (timestamptz) - When the profile was created
      - `updated_at` (timestamptz) - When the profile was last updated

  2. Security
    - Enable RLS on `user_profiles` table
    - Add policy for anyone to read profiles (demo mode)
    - Add policy for anyone to insert profiles (demo mode)
    - Add policy for anyone to update profiles (demo mode)

  3. Notes
    - Using text for user_id for demo purposes (not auth-based)
    - Policies are permissive for demo functionality
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text UNIQUE NOT NULL,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  profile_photo_url text,
  email text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all profiles"
  ON user_profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for all profiles"
  ON user_profiles
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for all profiles"
  ON user_profiles
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
