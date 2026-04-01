/*
  # Fix Database Security Issues

  1. Performance Optimizations
    - Add missing indexes on foreign key columns
    - Optimize RLS policies to use (SELECT auth.uid()) pattern
    - Fix function search_path for update_updated_at_column

  2. Security Fixes
    - Fix RLS policies with always-true conditions
    - Ensure proper access control on all tables

  ## Changes

  ### Indexes
  - Add indexes on unindexed foreign keys for component_usage_logs, component_variants, form_responses

  ### RLS Policy Optimizations
  - Update all auth.uid() calls to (SELECT auth.uid()) for better performance
    - Properly cast auth.uid() to text where needed based on column types

  ### Function Fixes
  - Set immutable search_path on update_updated_at_column function
*/

-- ============================================================================
-- PART 1: ADD MISSING INDEXES ON FOREIGN KEYS
-- ============================================================================

-- Component usage logs
CREATE INDEX IF NOT EXISTS idx_component_usage_logs_component_id
  ON component_usage_logs(component_id);

-- Component variants
CREATE INDEX IF NOT EXISTS idx_component_variants_component_id
  ON component_variants(component_id);

-- Form responses
CREATE INDEX IF NOT EXISTS idx_form_responses_patient_id
  ON form_responses(patient_id);

CREATE INDEX IF NOT EXISTS idx_form_responses_template_id
  ON form_responses(template_id);

-- ============================================================================
-- PART 2: FIX FUNCTION SEARCH PATH
-- ============================================================================

-- Recreate the function with immutable search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- PART 3: OPTIMIZE RLS POLICIES - CONDITIONS TABLE (user_id is TEXT)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own conditions" ON conditions;
DROP POLICY IF EXISTS "Users can insert own conditions" ON conditions;
DROP POLICY IF EXISTS "Users can update own conditions" ON conditions;
DROP POLICY IF EXISTS "Users can delete own conditions" ON conditions;

CREATE POLICY "Users can view own conditions"
  ON conditions FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

CREATE POLICY "Users can insert own conditions"
  ON conditions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()::text));

CREATE POLICY "Users can update own conditions"
  ON conditions FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()::text))
  WITH CHECK (user_id = (SELECT auth.uid()::text));

CREATE POLICY "Users can delete own conditions"
  ON conditions FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

-- ============================================================================
-- PART 4: OPTIMIZE RLS POLICIES - MEDICATIONS TABLE (user_id is TEXT)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own medications" ON medications;
DROP POLICY IF EXISTS "Users can insert own medications" ON medications;
DROP POLICY IF EXISTS "Users can update own medications" ON medications;
DROP POLICY IF EXISTS "Users can delete own medications" ON medications;

CREATE POLICY "Users can view own medications"
  ON medications FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

CREATE POLICY "Users can insert own medications"
  ON medications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()::text));

CREATE POLICY "Users can update own medications"
  ON medications FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()::text))
  WITH CHECK (user_id = (SELECT auth.uid()::text));

CREATE POLICY "Users can delete own medications"
  ON medications FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

-- ============================================================================
-- PART 5: OPTIMIZE RLS POLICIES - ALLERGIES TABLE (user_id is TEXT)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own allergies" ON allergies;
DROP POLICY IF EXISTS "Users can insert own allergies" ON allergies;
DROP POLICY IF EXISTS "Users can update own allergies" ON allergies;
DROP POLICY IF EXISTS "Users can delete own allergies" ON allergies;

CREATE POLICY "Users can view own allergies"
  ON allergies FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

CREATE POLICY "Users can insert own allergies"
  ON allergies FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()::text));

CREATE POLICY "Users can update own allergies"
  ON allergies FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()::text))
  WITH CHECK (user_id = (SELECT auth.uid()::text));

CREATE POLICY "Users can delete own allergies"
  ON allergies FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

-- ============================================================================
-- PART 6: OPTIMIZE RLS POLICIES - IMMUNIZATIONS TABLE (user_id is TEXT)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own immunizations" ON immunizations;
DROP POLICY IF EXISTS "Users can insert own immunizations" ON immunizations;
DROP POLICY IF EXISTS "Users can update own immunizations" ON immunizations;
DROP POLICY IF EXISTS "Users can delete own immunizations" ON immunizations;

CREATE POLICY "Users can view own immunizations"
  ON immunizations FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

CREATE POLICY "Users can insert own immunizations"
  ON immunizations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()::text));

CREATE POLICY "Users can update own immunizations"
  ON immunizations FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()::text))
  WITH CHECK (user_id = (SELECT auth.uid()::text));

CREATE POLICY "Users can delete own immunizations"
  ON immunizations FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

-- ============================================================================
-- PART 7: OPTIMIZE RLS POLICIES - CARE_TEAM TABLE (user_id is TEXT)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own care team" ON care_team;
DROP POLICY IF EXISTS "Users can insert own care team" ON care_team;
DROP POLICY IF EXISTS "Users can update own care team" ON care_team;
DROP POLICY IF EXISTS "Users can delete own care team" ON care_team;

CREATE POLICY "Users can view own care team"
  ON care_team FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

CREATE POLICY "Users can insert own care team"
  ON care_team FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()::text));

CREATE POLICY "Users can update own care team"
  ON care_team FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()::text))
  WITH CHECK (user_id = (SELECT auth.uid()::text));

CREATE POLICY "Users can delete own care team"
  ON care_team FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

-- ============================================================================
-- PART 8: OPTIMIZE RLS POLICIES - AUDIT_EVENTS TABLE (user_id is UUID)
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert own audit events" ON audit_events;
DROP POLICY IF EXISTS "Users can view own audit events" ON audit_events;

CREATE POLICY "Users can insert own audit events"
  ON audit_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view own audit events"
  ON audit_events FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- PART 9: OPTIMIZE RLS POLICIES - INSURANCE_COVERAGES TABLE (user_id is UUID)
-- ============================================================================

DROP POLICY IF EXISTS "Allow select for demo or own data" ON insurance_coverages;
DROP POLICY IF EXISTS "Allow insert for demo or own data" ON insurance_coverages;
DROP POLICY IF EXISTS "Allow update for demo or own data" ON insurance_coverages;
DROP POLICY IF EXISTS "Allow delete for demo or own data" ON insurance_coverages;

CREATE POLICY "Allow select for demo or own data"
  ON insurance_coverages FOR SELECT
  USING (user_id = '00000000-0000-0000-0000-000000000000'::uuid OR user_id = (SELECT auth.uid()));

CREATE POLICY "Allow insert for demo or own data"
  ON insurance_coverages FOR INSERT
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000'::uuid OR user_id = (SELECT auth.uid()));

CREATE POLICY "Allow update for demo or own data"
  ON insurance_coverages FOR UPDATE
  USING (user_id = '00000000-0000-0000-0000-000000000000'::uuid OR user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000'::uuid OR user_id = (SELECT auth.uid()));

CREATE POLICY "Allow delete for demo or own data"
  ON insurance_coverages FOR DELETE
  USING (user_id = '00000000-0000-0000-0000-000000000000'::uuid OR user_id = (SELECT auth.uid()));

-- ============================================================================
-- PART 10: OPTIMIZE RLS POLICIES - PROVIDERS TABLE (user_id is UUID)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own providers" ON providers;
DROP POLICY IF EXISTS "Users can insert own providers" ON providers;
DROP POLICY IF EXISTS "Users can update own providers" ON providers;
DROP POLICY IF EXISTS "Users can delete own providers" ON providers;

CREATE POLICY "Users can view own providers"
  ON providers FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own providers"
  ON providers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own providers"
  ON providers FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own providers"
  ON providers FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- PART 11: OPTIMIZE RLS POLICIES - PHARMACIES TABLE (user_id is UUID)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own pharmacies" ON pharmacies;
DROP POLICY IF EXISTS "Users can insert own pharmacies" ON pharmacies;
DROP POLICY IF EXISTS "Users can update own pharmacies" ON pharmacies;
DROP POLICY IF EXISTS "Users can delete own pharmacies" ON pharmacies;

CREATE POLICY "Users can view own pharmacies"
  ON pharmacies FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own pharmacies"
  ON pharmacies FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own pharmacies"
  ON pharmacies FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own pharmacies"
  ON pharmacies FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));
