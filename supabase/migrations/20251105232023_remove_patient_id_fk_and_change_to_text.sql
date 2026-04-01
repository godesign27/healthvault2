/*
  # Remove foreign key and change patient_id to text

  1. Changes
    - Drop foreign key constraint on patient_id
    - Change `patient_id` column from uuid to text
    - This allows using string patient IDs like 'demo-patient-1' without requiring a patient_profiles entry

  2. Security
    - No RLS changes needed, existing policies continue to work
*/

-- Drop the foreign key constraint
ALTER TABLE share_events 
DROP CONSTRAINT IF EXISTS share_events_patient_id_fkey;

-- Change patient_id from uuid to text
ALTER TABLE share_events 
ALTER COLUMN patient_id TYPE text USING patient_id::text;
