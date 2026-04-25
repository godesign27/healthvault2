/*
  # Add Keragon EHR Fields to Provider Connections

  Extends provider_connections to support Keragon-mediated EHR integrations.

  ## Changes

  ### Modified Tables
  - `provider_connections`
    - Added `ehr_source` (text) — Keragon EHR source identifier (e.g., "athenahealth", "elation")
    - Added `ehr_department_id` (text) — Required by Athena Health; optional for other EHR systems
    - Updated `valid_connection_method` constraint to include 'keragon'

  ## Notes
  1. `ehr_source` maps directly to Keragon's `ehr_source` field in the webhook payload.
     Supported values: athenahealth, elation, charmhealth, openemr, eclinicalworks, nextech, healthgorilla
  2. `ehr_department_id` is only required when ehr_source = 'athenahealth'.
  3. The existing `fhir_patient_id` column is reused to store the patient's ID in the EHR system.
  4. No data is lost — all existing rows are unaffected.
*/

-- Update connection_method constraint to include 'keragon'
ALTER TABLE provider_connections
  DROP CONSTRAINT IF EXISTS valid_connection_method;

ALTER TABLE provider_connections
  ADD CONSTRAINT valid_connection_method CHECK (
    connection_method IN (
      'existing_connection',
      'direct_provider_connection',
      'epic_connection',
      'manual_fallback',
      'keragon'
    )
  );

-- Add ehr_source column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'provider_connections' AND column_name = 'ehr_source'
  ) THEN
    ALTER TABLE provider_connections ADD COLUMN ehr_source text;
  END IF;
END $$;

-- Add ehr_department_id column (Athena Health requires this)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'provider_connections' AND column_name = 'ehr_department_id'
  ) THEN
    ALTER TABLE provider_connections ADD COLUMN ehr_department_id text;
  END IF;
END $$;

-- Index for fast Keragon connection lookups
CREATE INDEX IF NOT EXISTS idx_provider_connections_ehr_source
  ON provider_connections(user_id, ehr_source)
  WHERE ehr_source IS NOT NULL;
