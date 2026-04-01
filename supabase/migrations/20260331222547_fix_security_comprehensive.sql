/*
  # Comprehensive Security Fixes

  This migration addresses multiple security and performance issues:

  ## 1. Performance Improvements
  ### Add Missing Foreign Key Indexes
  - `component_usage_logs.component_id`
  - `component_usage_logs.variant_id`
  - `component_variants.component_id`
  - `form_responses.patient_id`
  - `form_responses.template_id`
  - `insurance_coverages.provider_id`
  - `organization_admins.user_id`
  - `projects.duplicated_from`
  - `scenarios.project_id`

  ### Remove Unused Indexes
  - `idx_segmentations_project_id`
  - `conditions_user_id_idx`
  - `medications_user_id_idx`
  - `allergies_user_id_idx`
  - `immunizations_user_id_idx`
  - `idx_organizations_subdomain`
  - `idx_user_profiles_user_id`

  ## 2. RLS Policy Consolidation
  - Remove duplicate permissive policies across multiple tables
  - Keep only the most restrictive and appropriate policy for each action

  ## 3. Fix Overly Permissive Policies
  - Replace policies with `USING (true)` or `WITH CHECK (true)`
  - Implement proper ownership and access control checks where possible

  ## Note
  - Auth DB Connection Strategy: Must be manually changed in Supabase dashboard to use percentage-based allocation
*/

-- ============================================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- ============================================================================

-- Component usage logs indexes
CREATE INDEX IF NOT EXISTS idx_component_usage_logs_component_id 
  ON public.component_usage_logs(component_id);

CREATE INDEX IF NOT EXISTS idx_component_usage_logs_variant_id 
  ON public.component_usage_logs(variant_id);

-- Component variants index
CREATE INDEX IF NOT EXISTS idx_component_variants_component_id 
  ON public.component_variants(component_id);

-- Form responses indexes
CREATE INDEX IF NOT EXISTS idx_form_responses_patient_id 
  ON public.form_responses(patient_id);

CREATE INDEX IF NOT EXISTS idx_form_responses_template_id 
  ON public.form_responses(template_id);

-- Insurance coverages index
CREATE INDEX IF NOT EXISTS idx_insurance_coverages_provider_id 
  ON public.insurance_coverages(provider_id);

-- Organization admins index
CREATE INDEX IF NOT EXISTS idx_organization_admins_user_id 
  ON public.organization_admins(user_id);

-- Projects index
CREATE INDEX IF NOT EXISTS idx_projects_duplicated_from 
  ON public.projects(duplicated_from);

-- Scenarios index
CREATE INDEX IF NOT EXISTS idx_scenarios_project_id 
  ON public.scenarios(project_id);

-- ============================================================================
-- 2. DROP UNUSED INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_segmentations_project_id;
DROP INDEX IF EXISTS conditions_user_id_idx;
DROP INDEX IF EXISTS medications_user_id_idx;
DROP INDEX IF EXISTS allergies_user_id_idx;
DROP INDEX IF EXISTS immunizations_user_id_idx;
DROP INDEX IF EXISTS idx_organizations_subdomain;
DROP INDEX IF EXISTS idx_user_profiles_user_id;

-- ============================================================================
-- 3. FIX OVERLY PERMISSIVE RLS POLICIES
-- ============================================================================

-- Fix component_usage_logs policies
-- These are system usage tracking logs
DROP POLICY IF EXISTS "Authenticated users can insert component usage logs" ON public.component_usage_logs;
DROP POLICY IF EXISTS "Authenticated users can update component usage logs" ON public.component_usage_logs;

-- Allow authenticated users to create usage logs (needed for analytics)
-- but require the component and variant to exist
CREATE POLICY "Users can create component usage logs"
  ON public.component_usage_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.components WHERE id = component_id)
    AND (variant_id IS NULL OR EXISTS (SELECT 1 FROM public.component_variants WHERE id = variant_id))
  );

-- Allow authenticated users to update usage logs they can see
CREATE POLICY "Users can update component usage logs"
  ON public.component_usage_logs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.components WHERE id = component_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.components WHERE id = component_id)
    AND (variant_id IS NULL OR EXISTS (SELECT 1 FROM public.component_variants WHERE id = variant_id))
  );

-- Fix component_variants policy - remove overly permissive ALL policy
DROP POLICY IF EXISTS "Authenticated users can manage component variants" ON public.component_variants;
-- The "Anyone can view component variants" policy already covers SELECT

-- Fix components policy - remove overly permissive ALL policy
DROP POLICY IF EXISTS "Authenticated users can manage components" ON public.components;
-- The "Anyone can view components" policy already covers SELECT

-- Fix design_tokens policy - remove overly permissive ALL policy
DROP POLICY IF EXISTS "Authenticated users can manage design tokens" ON public.design_tokens;
-- The "Anyone can view design tokens" policy already covers SELECT

-- Fix form_templates policy - remove overly permissive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can insert form templates" ON public.form_templates;
-- Form templates should be managed through the application, not directly by users

-- Fix share_events policies
DROP POLICY IF EXISTS "Users can insert share events" ON public.share_events;
DROP POLICY IF EXISTS "Users can update share events" ON public.share_events;

-- Share events should only be created by the patient who owns them
CREATE POLICY "Users can insert own share events"
  ON public.share_events
  FOR INSERT
  TO authenticated
  WITH CHECK (patient_id = auth.uid()::text);

CREATE POLICY "Users can update own share events"
  ON public.share_events
  FOR UPDATE
  TO authenticated
  USING (patient_id = auth.uid()::text)
  WITH CHECK (patient_id = auth.uid()::text);

-- ============================================================================
-- 4. CONSOLIDATE DUPLICATE PERMISSIVE POLICIES
-- ============================================================================

-- Fix insurance_policies duplicate SELECT policies
DROP POLICY IF EXISTS "Allow read access to own policies" ON public.insurance_policies;
-- Keep "Allow select for own policies"

-- Fix organization_admins duplicate policies
-- Consolidate into single policies per action
DROP POLICY IF EXISTS "Organization owners can manage admins" ON public.organization_admins;
DROP POLICY IF EXISTS "Super admins can manage all org admins" ON public.organization_admins;
DROP POLICY IF EXISTS "Users can view their admin assignments" ON public.organization_admins;

CREATE POLICY "Users can view org admins they have access to"
  ON public.organization_admins
  FOR SELECT
  TO authenticated
  USING (
    -- User is viewing their own assignment (user_id is UUID type)
    user_id = auth.uid()
    OR
    -- User is an owner/admin of this organization
    EXISTS (
      SELECT 1 FROM public.organization_admins oa
      WHERE oa.organization_id = organization_admins.organization_id
      AND oa.user_id = auth.uid()
      AND oa.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners can manage org admins"
  ON public.organization_admins
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_admins oa
      WHERE oa.organization_id = organization_admins.organization_id
      AND oa.user_id = auth.uid()
      AND oa.role = 'owner'
    )
  );

CREATE POLICY "Owners can update org admins"
  ON public.organization_admins
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_admins oa
      WHERE oa.organization_id = organization_admins.organization_id
      AND oa.user_id = auth.uid()
      AND oa.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_admins oa
      WHERE oa.organization_id = organization_admins.organization_id
      AND oa.user_id = auth.uid()
      AND oa.role = 'owner'
    )
  );

CREATE POLICY "Owners can delete org admins"
  ON public.organization_admins
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_admins oa
      WHERE oa.organization_id = organization_admins.organization_id
      AND oa.user_id = auth.uid()
      AND oa.role = 'owner'
    )
  );

-- Fix organization_patients duplicate SELECT policies
DROP POLICY IF EXISTS "Organization admins can manage patients" ON public.organization_patients;
DROP POLICY IF EXISTS "Organization admins can view their patients" ON public.organization_patients;
-- Keep "Patients can view their organization assignments"

CREATE POLICY "Admins can view org patients"
  ON public.organization_patients
  FOR SELECT
  TO authenticated
  USING (
    -- User is the patient (patient_id is text type)
    patient_id = auth.uid()::text
    OR
    -- User is an admin of this organization (user_id in org_admins is UUID)
    EXISTS (
      SELECT 1 FROM public.organization_admins oa
      WHERE oa.organization_id = organization_patients.organization_id
      AND oa.user_id = auth.uid()
    )
  );

-- Fix organizations duplicate SELECT policies
DROP POLICY IF EXISTS "Authenticated users can view organizations" ON public.organizations;
-- Keep "Public can view active organizations"

-- Fix projects duplicate SELECT policies
DROP POLICY IF EXISTS "Allow public read access to projects" ON public.projects;
-- Keep "Users can manage own projects" which includes SELECT

-- Fix scenarios duplicate SELECT policies
DROP POLICY IF EXISTS "Allow public read access to scenarios" ON public.scenarios;
-- Keep "Users can manage scenarios for own projects"

-- Fix segmentations duplicate SELECT policies
DROP POLICY IF EXISTS "Authenticated users can view segmentations" ON public.segmentations;
-- Keep "Allow public read access to segmentations"

-- Fix user_preferences duplicate SELECT policies
DROP POLICY IF EXISTS "Allow read access to own preferences" ON public.user_preferences;
-- Keep "Allow select for own preferences"

-- Fix user_profiles duplicate SELECT policies
-- Keep the more restrictive one
DROP POLICY IF EXISTS "Allow read access to all profiles" ON public.user_profiles;
-- Keep "Allow select for own profiles"
