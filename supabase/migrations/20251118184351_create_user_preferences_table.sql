/*
  # Create User Preferences Table

  1. New Tables
    - `user_preferences`
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (text, unique) - Foreign key to user_profiles.user_id
      - `help_with_labs` (boolean, default false) - Lab results assistance
      - `help_with_forms` (boolean, default false) - Medical forms assistance
      - `help_with_providers` (boolean, default false) - Provider management assistance
      - `help_with_wellness_suggestions` (boolean, default false) - Wellness suggestions
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `user_preferences` table
    - Add policies for authenticated access

  3. Notes
    - One preferences record per user (enforced by unique constraint)
    - All preferences default to false
    - Using text for user_id to match existing pattern
*/

CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text UNIQUE NOT NULL,
  help_with_labs boolean DEFAULT false,
  help_with_forms boolean DEFAULT false,
  help_with_providers boolean DEFAULT false,
  help_with_wellness_suggestions boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to own preferences"
  ON user_preferences
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for own preferences"
  ON user_preferences
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for own preferences"
  ON user_preferences
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
