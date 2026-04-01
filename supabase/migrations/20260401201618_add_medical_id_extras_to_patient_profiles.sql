/*
  # Add Medical ID extras to patient_profiles

  1. Modified Tables
    - `patient_profiles`
      - Added `blood_type` (text, constrained to valid blood types)
      - Added `organ_donor` (boolean, default false)
      - Added `emergency_contact_name` (text)
      - Added `emergency_contact_phone` (text)
      - Added `emergency_contact_relationship` (text)
  
  2. Notes
    - These fields power the Medical ID Card display
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patient_profiles' AND column_name = 'blood_type'
  ) THEN
    ALTER TABLE patient_profiles
      ADD COLUMN blood_type text CHECK (blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patient_profiles' AND column_name = 'organ_donor'
  ) THEN
    ALTER TABLE patient_profiles ADD COLUMN organ_donor boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patient_profiles' AND column_name = 'emergency_contact_name'
  ) THEN
    ALTER TABLE patient_profiles ADD COLUMN emergency_contact_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patient_profiles' AND column_name = 'emergency_contact_phone'
  ) THEN
    ALTER TABLE patient_profiles ADD COLUMN emergency_contact_phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patient_profiles' AND column_name = 'emergency_contact_relationship'
  ) THEN
    ALTER TABLE patient_profiles ADD COLUMN emergency_contact_relationship text;
  END IF;
END $$;