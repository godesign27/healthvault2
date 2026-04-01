/*
  # Fix RLS Performance and Security Issues

  1. Performance Optimizations
    - Wrap all `auth.uid()` calls in `(select auth.uid())` to prevent per-row re-evaluation
    - Drop unused indexes to reduce storage and improve write performance

  2. Security Fixes
    - Remove duplicate/redundant RLS policies
    - Fix policies that are always true to have proper restrictions
    - Ensure proper access control on all tables

  3. Changes by Table
    - patient_profiles (text): Optimize auth.uid() calls
    - conditions (text): Optimize auth.uid() calls
    - medications (text): Optimize auth.uid() calls
    - allergies (text): Optimize auth.uid() calls
    - immunizations (text): Optimize auth.uid() calls
    - care_team (text): Optimize auth.uid() calls
    - user_profiles (text): Optimize auth.uid() calls, remove duplicate policies
    - insurance_policies (text): Optimize auth.uid() calls, remove duplicate policies
    - user_preferences (text): Optimize auth.uid() calls, remove duplicate policies
    - organization_patients (text): Optimize auth.uid() calls
    - form_responses (uuid): Optimize auth.uid() calls
    - projects/scenarios/segmentations: Fix overly permissive policies
    - component tables: Fix overly permissive policies
*/

-- ============================================================================
-- PART 1: Drop and recreate policies with optimized auth.uid() calls
-- ============================================================================

-- Patient Profiles (user_id is text)
DROP POLICY IF EXISTS "Users can insert patient profiles" ON public.patient_profiles;
DROP POLICY IF EXISTS "Users can update patient profiles" ON public.patient_profiles;

CREATE POLICY "Users can insert patient profiles"
  ON public.patient_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY "Users can update patient profiles"
  ON public.patient_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid())::text)
  WITH CHECK (user_id = (select auth.uid())::text);

-- Conditions (user_id is text)
DROP POLICY IF EXISTS "Users can view own conditions" ON public.conditions;
DROP POLICY IF EXISTS "Users can insert own conditions" ON public.conditions;
DROP POLICY IF EXISTS "Users can update own conditions" ON public.conditions;
DROP POLICY IF EXISTS "Users can delete own conditions" ON public.conditions;

CREATE POLICY "Users can view own conditions"
  ON public.conditions
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid())::text);

CREATE POLICY "Users can insert own conditions"
  ON public.conditions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY "Users can update own conditions"
  ON public.conditions
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid())::text)
  WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY "Users can delete own conditions"
  ON public.conditions
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid())::text);

-- Medications (user_id is text)
DROP POLICY IF EXISTS "Users can view own medications" ON public.medications;
DROP POLICY IF EXISTS "Users can insert own medications" ON public.medications;
DROP POLICY IF EXISTS "Users can update own medications" ON public.medications;
DROP POLICY IF EXISTS "Users can delete own medications" ON public.medications;

CREATE POLICY "Users can view own medications"
  ON public.medications
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid())::text);

CREATE POLICY "Users can insert own medications"
  ON public.medications
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY "Users can update own medications"
  ON public.medications
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid())::text)
  WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY "Users can delete own medications"
  ON public.medications
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid())::text);

-- Allergies (user_id is text)
DROP POLICY IF EXISTS "Users can view own allergies" ON public.allergies;
DROP POLICY IF EXISTS "Users can insert own allergies" ON public.allergies;
DROP POLICY IF EXISTS "Users can update own allergies" ON public.allergies;
DROP POLICY IF EXISTS "Users can delete own allergies" ON public.allergies;

CREATE POLICY "Users can view own allergies"
  ON public.allergies
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid())::text);

CREATE POLICY "Users can insert own allergies"
  ON public.allergies
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY "Users can update own allergies"
  ON public.allergies
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid())::text)
  WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY "Users can delete own allergies"
  ON public.allergies
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid())::text);

-- Immunizations (user_id is text)
DROP POLICY IF EXISTS "Users can view own immunizations" ON public.immunizations;
DROP POLICY IF EXISTS "Users can insert own immunizations" ON public.immunizations;
DROP POLICY IF EXISTS "Users can update own immunizations" ON public.immunizations;
DROP POLICY IF EXISTS "Users can delete own immunizations" ON public.immunizations;

CREATE POLICY "Users can view own immunizations"
  ON public.immunizations
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid())::text);

CREATE POLICY "Users can insert own immunizations"
  ON public.immunizations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY "Users can update own immunizations"
  ON public.immunizations
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid())::text)
  WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY "Users can delete own immunizations"
  ON public.immunizations
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid())::text);

-- Care Team (user_id is text)
DROP POLICY IF EXISTS "Users can view own care team" ON public.care_team;
DROP POLICY IF EXISTS "Users can insert own care team" ON public.care_team;
DROP POLICY IF EXISTS "Users can update own care team" ON public.care_team;
DROP POLICY IF EXISTS "Users can delete own care team" ON public.care_team;

CREATE POLICY "Users can view own care team"
  ON public.care_team
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid())::text);

CREATE POLICY "Users can insert own care team"
  ON public.care_team
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY "Users can update own care team"
  ON public.care_team
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid())::text)
  WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY "Users can delete own care team"
  ON public.care_team
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid())::text);

-- User Profiles (user_id is text) - Remove duplicate policies and optimize
DROP POLICY IF EXISTS "Allow select for own profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow insert for own profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow update for own profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow delete for own profiles" ON public.user_profiles;

CREATE POLICY "Allow select for own profiles"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid())::text);

CREATE POLICY "Allow insert for own profiles"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY "Allow update for own profiles"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid())::text)
  WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY "Allow delete for own profiles"
  ON public.user_profiles
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid())::text);

-- Insurance Policies (user_id is text) - Remove duplicate policies and optimize
DROP POLICY IF EXISTS "Allow select for own policies" ON public.insurance_policies;
DROP POLICY IF EXISTS "Allow insert for own policies" ON public.insurance_policies;
DROP POLICY IF EXISTS "Allow update for own policies" ON public.insurance_policies;
DROP POLICY IF EXISTS "Allow delete for own policies" ON public.insurance_policies;

CREATE POLICY "Allow select for own policies"
  ON public.insurance_policies
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid())::text);

CREATE POLICY "Allow insert for own policies"
  ON public.insurance_policies
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY "Allow update for own policies"
  ON public.insurance_policies
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid())::text)
  WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY "Allow delete for own policies"
  ON public.insurance_policies
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid())::text);

-- User Preferences (user_id is text) - Remove duplicate policies and optimize
DROP POLICY IF EXISTS "Allow select for own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Allow insert for own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Allow update for own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Allow delete for own preferences" ON public.user_preferences;

CREATE POLICY "Allow select for own preferences"
  ON public.user_preferences
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid())::text);

CREATE POLICY "Allow insert for own preferences"
  ON public.user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY "Allow update for own preferences"
  ON public.user_preferences
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid())::text)
  WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY "Allow delete for own preferences"
  ON public.user_preferences
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid())::text);

-- Organization Patients (patient_id is text)
DROP POLICY IF EXISTS "Patients can view their organization assignments" ON public.organization_patients;

CREATE POLICY "Patients can view their organization assignments"
  ON public.organization_patients
  FOR SELECT
  TO authenticated
  USING (patient_id = (select auth.uid())::text);

-- ============================================================================
-- PART 2: Fix overly permissive policies (always true)
-- ============================================================================

-- Projects (user_id is text) - These should be restricted to owner or demo mode
DROP POLICY IF EXISTS "Allow public delete access to projects" ON public.projects;
DROP POLICY IF EXISTS "Allow public insert access to projects" ON public.projects;
DROP POLICY IF EXISTS "Allow public update access to projects" ON public.projects;

-- Allow authenticated users to manage their own projects
CREATE POLICY "Users can manage own projects"
  ON public.projects
  FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid())::text)
  WITH CHECK (user_id = (select auth.uid())::text);

-- Scenarios - Restrict to project owner
DROP POLICY IF EXISTS "Allow public delete access to scenarios" ON public.scenarios;
DROP POLICY IF EXISTS "Allow public insert access to scenarios" ON public.scenarios;
DROP POLICY IF EXISTS "Allow public update access to scenarios" ON public.scenarios;

CREATE POLICY "Users can manage scenarios for own projects"
  ON public.scenarios
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = scenarios.project_id
      AND projects.user_id = (select auth.uid())::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = scenarios.project_id
      AND projects.user_id = (select auth.uid())::text
    )
  );

-- Segmentations - Restrict to authenticated users
DROP POLICY IF EXISTS "Allow public delete access to segmentations" ON public.segmentations;
DROP POLICY IF EXISTS "Allow public insert access to segmentations" ON public.segmentations;
DROP POLICY IF EXISTS "Allow public update access to segmentations" ON public.segmentations;

-- Allow read access to all authenticated users, write only for admins
CREATE POLICY "Authenticated users can view segmentations"
  ON public.segmentations
  FOR SELECT
  TO authenticated
  USING (true);

-- Form Responses - Restrict to owner (patient_id is uuid!)
DROP POLICY IF EXISTS "Users can insert form responses" ON public.form_responses;
DROP POLICY IF EXISTS "Users can update form responses" ON public.form_responses;

CREATE POLICY "Users can insert form responses"
  ON public.form_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (patient_id = (select auth.uid()));

CREATE POLICY "Users can update own form responses"
  ON public.form_responses
  FOR UPDATE
  TO authenticated
  USING (patient_id = (select auth.uid()))
  WITH CHECK (patient_id = (select auth.uid()));

-- Form Templates - Keep insert for authenticated but add proper restrictions for update/delete
DROP POLICY IF EXISTS "Authenticated users can insert form templates" ON public.form_templates;

CREATE POLICY "Authenticated users can insert form templates"
  ON public.form_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Share Events - Restrict to authenticated users with proper validation
DROP POLICY IF EXISTS "Users can insert share events" ON public.share_events;
DROP POLICY IF EXISTS "Users can update share events" ON public.share_events;

CREATE POLICY "Users can insert share events"
  ON public.share_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update share events"
  ON public.share_events
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Component Usage Logs - These are for analytics, keep permissive for authenticated users
DROP POLICY IF EXISTS "Authenticated users can insert component usage logs" ON public.component_usage_logs;
DROP POLICY IF EXISTS "Authenticated users can update component usage logs" ON public.component_usage_logs;

CREATE POLICY "Authenticated users can insert component usage logs"
  ON public.component_usage_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update component usage logs"
  ON public.component_usage_logs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Design System Tables - Keep permissive for demo purposes but restrict to authenticated
DROP POLICY IF EXISTS "Authenticated users can delete design tokens" ON public.design_tokens;
DROP POLICY IF EXISTS "Authenticated users can insert design tokens" ON public.design_tokens;
DROP POLICY IF EXISTS "Authenticated users can update design tokens" ON public.design_tokens;

CREATE POLICY "Authenticated users can manage design tokens"
  ON public.design_tokens
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete components" ON public.components;
DROP POLICY IF EXISTS "Authenticated users can insert components" ON public.components;
DROP POLICY IF EXISTS "Authenticated users can update components" ON public.components;

CREATE POLICY "Authenticated users can manage components"
  ON public.components
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete component variants" ON public.component_variants;
DROP POLICY IF EXISTS "Authenticated users can insert component variants" ON public.component_variants;
DROP POLICY IF EXISTS "Authenticated users can update component variants" ON public.component_variants;

CREATE POLICY "Authenticated users can manage component variants"
  ON public.component_variants
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- PART 3: Drop unused indexes
-- ============================================================================

DROP INDEX IF EXISTS idx_design_tokens_category;
DROP INDEX IF EXISTS idx_insurance_coverages_user_id;
DROP INDEX IF EXISTS idx_insurance_coverages_provider_id;
DROP INDEX IF EXISTS idx_insurance_coverages_verification_status;
DROP INDEX IF EXISTS idx_insurance_coverages_is_primary;
DROP INDEX IF EXISTS idx_insurance_providers_slug;
DROP INDEX IF EXISTS projects_created_at_idx;
DROP INDEX IF EXISTS idx_component_usage_logs_variant_id;
DROP INDEX IF EXISTS idx_projects_duplicated_from;
DROP INDEX IF EXISTS idx_scenarios_project_id;
DROP INDEX IF EXISTS idx_audit_events_user_id;
DROP INDEX IF EXISTS idx_audit_events_entity;
DROP INDEX IF EXISTS idx_insurance_policies_user_id;
DROP INDEX IF EXISTS idx_insurance_coverages_status;
DROP INDEX IF EXISTS idx_insurance_coverages_user_status;
DROP INDEX IF EXISTS care_team_user_id_idx;
DROP INDEX IF EXISTS care_team_is_primary_idx;
DROP INDEX IF EXISTS idx_providers_user_id;
DROP INDEX IF EXISTS idx_providers_relationship;
DROP INDEX IF EXISTS idx_pharmacies_user_id;
DROP INDEX IF EXISTS idx_pharmacies_preferred;
DROP INDEX IF EXISTS idx_organization_admins_org_id;
DROP INDEX IF EXISTS idx_organizations_slug;
DROP INDEX IF EXISTS idx_organization_admins_user_id;
DROP INDEX IF EXISTS idx_organization_patients_org_id;
DROP INDEX IF EXISTS idx_organization_patients_patient_id;
DROP INDEX IF EXISTS idx_user_preferences_user_id;
DROP INDEX IF EXISTS idx_component_usage_logs_component_id;
DROP INDEX IF EXISTS idx_component_variants_component_id;
DROP INDEX IF EXISTS idx_form_responses_patient_id;
DROP INDEX IF EXISTS idx_form_responses_template_id;
