/*
  # Create User Addresses Table

  1. New Tables
    - `user_addresses`
      - `id` (uuid, primary key)
      - `user_id` (text) - User identifier
      - `address_type` (text) - One of: 'home_1', 'home_2', 'work'
      - `label` (text) - Display label e.g. "Home", "Second Home", "Work"
      - `address_line1` (text) - Street address
      - `address_line2` (text, nullable) - Apt/Suite/Unit
      - `city` (text) - City name
      - `state` (text, nullable) - State/Province
      - `postal_code` (text, nullable) - ZIP/Postal code
      - `country` (text, default 'US') - Country code
      - `is_active` (boolean, default false) - Currently selected address for pharmacy proximity
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `user_addresses` table
    - Add policies for authenticated and demo access

  3. Constraints
    - Unique constraint on (user_id, address_type) - one address per type per user
    - Only one active address per user enforced via trigger

  4. Notes
    - Supports three address types: first home, second home, work
    - The is_active flag determines which address is used for pharmacy proximity search
    - Trigger ensures only one address is active at a time per user
*/

CREATE TABLE IF NOT EXISTS user_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  address_type text NOT NULL CHECK (address_type IN ('home_1', 'home_2', 'work')),
  label text NOT NULL DEFAULT '',
  address_line1 text NOT NULL DEFAULT '',
  address_line2 text,
  city text NOT NULL DEFAULT '',
  state text,
  postal_code text,
  country text DEFAULT 'US',
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_address_type UNIQUE (user_id, address_type)
);

ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own addresses"
  ON user_addresses
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own addresses"
  ON user_addresses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own addresses"
  ON user_addresses
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own addresses"
  ON user_addresses
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Demo select access for user_addresses"
  ON user_addresses
  FOR SELECT
  TO anon
  USING (user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Demo insert access for user_addresses"
  ON user_addresses
  FOR INSERT
  TO anon
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Demo update access for user_addresses"
  ON user_addresses
  FOR UPDATE
  TO anon
  USING (user_id = '00000000-0000-0000-0000-000000000000')
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Demo delete access for user_addresses"
  ON user_addresses
  FOR DELETE
  TO anon
  USING (user_id = '00000000-0000-0000-0000-000000000000');

CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_active ON user_addresses(user_id, is_active) WHERE is_active = true;

CREATE OR REPLACE FUNCTION enforce_single_active_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE user_addresses
    SET is_active = false, updated_at = now()
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_active = true;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_enforce_single_active_address ON user_addresses;
CREATE TRIGGER trigger_enforce_single_active_address
  BEFORE INSERT OR UPDATE ON user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION enforce_single_active_address();
