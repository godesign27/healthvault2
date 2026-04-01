/*
  # Fix Security Issues - Database Indexes

  1. Performance Improvements
    - Add indexes for unindexed foreign keys:
      - `component_usage_logs.variant_id`
      - `projects.duplicated_from`
      - `scenarios.project_id`
      - `segmentations.project_id`
    
  2. Cleanup
    - Remove unused indexes:
      - `idx_component_variants_component_id`
      - `idx_component_usage_logs_component_id`
      - `projects_user_id_idx`
      - `idx_form_responses_patient_id`
      - `idx_form_responses_template_id`
      - `idx_share_events_status`
      - `idx_share_events_is_revoked`
      - `idx_share_events_token`
      - `idx_share_events_patient_id`

  3. Notes
    - Foreign key indexes improve JOIN performance
    - Removing unused indexes reduces storage and write overhead
*/

-- Add indexes for unindexed foreign keys
CREATE INDEX IF NOT EXISTS idx_component_usage_logs_variant_id 
  ON public.component_usage_logs(variant_id);

CREATE INDEX IF NOT EXISTS idx_projects_duplicated_from 
  ON public.projects(duplicated_from);

CREATE INDEX IF NOT EXISTS idx_scenarios_project_id 
  ON public.scenarios(project_id);

CREATE INDEX IF NOT EXISTS idx_segmentations_project_id 
  ON public.segmentations(project_id);

-- Remove unused indexes
DROP INDEX IF EXISTS public.idx_component_variants_component_id;
DROP INDEX IF EXISTS public.idx_component_usage_logs_component_id;
DROP INDEX IF EXISTS public.projects_user_id_idx;
DROP INDEX IF EXISTS public.idx_form_responses_patient_id;
DROP INDEX IF EXISTS public.idx_form_responses_template_id;
DROP INDEX IF EXISTS public.idx_share_events_status;
DROP INDEX IF EXISTS public.idx_share_events_is_revoked;
DROP INDEX IF EXISTS public.idx_share_events_token;
DROP INDEX IF EXISTS public.idx_share_events_patient_id;