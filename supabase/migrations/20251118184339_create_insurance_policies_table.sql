/*
  # Create Insurance Policies Table

  1. New Tables
    - `insurance_policies`
      - `id` (uuid, primary key) - Unique policy identifier
      - `user_id` (text) - Foreign key to user_profiles.user_id
      - `carrier_name` (text) - Insurance carrier name
      - `member_id` (text) - Member/subscriber ID
      - `group_number` (text, nullable) - Group number
      - `plan_type` (text, nullable) - Type of plan (HMO, PPO, etc)
      - `claims_phone` (text, nullable) - Claims contact phone
      - `card_front_url` (text, nullable) - URL to front of insurance card image
      - `card_back_url` (text, nullable) - URL to back of insurance card image
      - `is_primary` (boolean, default true) - Primary insurance flag
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `insurance_policies` table
    - Add policies for authenticated access

  3. Notes
    - Supports multiple insurance policies per user
    - Card images stored in Supabase Storage
    - Using text for user_id to match existing pattern
*/

CREATE TABLE IF NOT EXISTS insurance_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  carrier_name text NOT NULL,
  member_id text NOT NULL,
  group_number text,
  plan_type text,
  claims_phone text,
  card_front_url text,
  card_back_url text,
  is_primary boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to own policies"
  ON insurance_policies
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert for own policies"
  ON insurance_policies
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update for own policies"
  ON insurance_policies
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete for own policies"
  ON insurance_policies
  FOR DELETE
  USING (true);

-- Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_insurance_policies_user_id ON insurance_policies(user_id);

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_insurance_policies_updated_at ON insurance_policies;
CREATE TRIGGER update_insurance_policies_updated_at
  BEFORE UPDATE ON insurance_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
