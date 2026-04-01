/*
  # Add Coverage Status to Insurance Coverages

  1. Changes
    - Add `coverage_status` enum column to insurance_coverages table
    - Default status is 'active'
    - Possible values: 'active', 'stopped', 'expired'
    - Add `stopped_at` timestamp for when coverage was stopped
    - Add index on coverage_status for filtering queries

  2. Notes
    - Stopped coverage remains in the database for historical reference
    - Users can see stopped coverage but in a different visual state
    - This supports the flow where users stop one coverage and add another
*/

-- Create enum for coverage status
DO $$ BEGIN
  CREATE TYPE coverage_status AS ENUM ('active', 'stopped', 'expired');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add coverage_status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'insurance_coverages' AND column_name = 'coverage_status'
  ) THEN
    ALTER TABLE insurance_coverages 
      ADD COLUMN coverage_status coverage_status DEFAULT 'active' NOT NULL;
  END IF;
END $$;

-- Add stopped_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'insurance_coverages' AND column_name = 'stopped_at'
  ) THEN
    ALTER TABLE insurance_coverages 
      ADD COLUMN stopped_at timestamptz;
  END IF;
END $$;

-- Create index on coverage_status for filtering
CREATE INDEX IF NOT EXISTS idx_insurance_coverages_status 
  ON insurance_coverages(coverage_status);

-- Create index on user_id and coverage_status for common queries
CREATE INDEX IF NOT EXISTS idx_insurance_coverages_user_status 
  ON insurance_coverages(user_id, coverage_status);
