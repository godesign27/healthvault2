/*
  # Extend Profiles Table for Onboarding

  1. Changes to `user_profiles` table
    - Add identity and address fields for onboarding:
      - `first_name` (text) - Already exists
      - `last_name` (text) - Already exists
      - `date_of_birth` (date, nullable) - User's birth date
      - `phone` (text, nullable) - Contact phone number
      - `address_line1` (text, nullable) - Primary address
      - `address_line2` (text, nullable) - Secondary address
      - `city` (text, nullable) - City
      - `state` (text, nullable) - State/Province
      - `postal_code` (text, nullable) - ZIP/Postal code
      - `country` (text, default 'US') - Country code
      - `last4_ssn` (text, nullable) - Last 4 digits of SSN
      - `phone_verified` (boolean, default false) - Phone verification status
      - `email_verified` (boolean, default false) - Email verification status
      - `identity_verified` (boolean, default false) - Identity verification status
      - `onboarding_complete` (boolean, default false) - Onboarding completion flag

  2. Notes
    - Uses IF NOT EXISTS checks to safely add columns
    - Preserves existing data
    - All new fields are nullable or have defaults
*/

-- Add date_of_birth if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN date_of_birth date;
  END IF;
END $$;

-- Add phone if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN phone text;
  END IF;
END $$;

-- Add address_line1 if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'address_line1'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN address_line1 text;
  END IF;
END $$;

-- Add address_line2 if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'address_line2'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN address_line2 text;
  END IF;
END $$;

-- Add city if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'city'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN city text;
  END IF;
END $$;

-- Add state if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'state'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN state text;
  END IF;
END $$;

-- Add postal_code if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'postal_code'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN postal_code text;
  END IF;
END $$;

-- Add country if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'country'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN country text DEFAULT 'US';
  END IF;
END $$;

-- Add last4_ssn if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'last4_ssn'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN last4_ssn text;
  END IF;
END $$;

-- Add phone_verified if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'phone_verified'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN phone_verified boolean DEFAULT false;
  END IF;
END $$;

-- Add email_verified if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN email_verified boolean DEFAULT false;
  END IF;
END $$;

-- Add identity_verified if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'identity_verified'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN identity_verified boolean DEFAULT false;
  END IF;
END $$;

-- Add onboarding_complete if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'onboarding_complete'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN onboarding_complete boolean DEFAULT false;
  END IF;
END $$;
