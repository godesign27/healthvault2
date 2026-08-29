-- Partner-ready wellness insights. Patient content remains user-scoped; partner
-- configuration and aggregate operations are server/admin only.

CREATE TABLE IF NOT EXISTS public.wellness_partners (
  partner_key text PRIMARY KEY,
  display_name text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','disabled')),
  launch_stage text NOT NULL DEFAULT 'internal' CHECK (launch_stage IN ('internal','closed_beta','public')),
  framework_version integer NOT NULL DEFAULT 1 CHECK (framework_version > 0),
  prompt_version integer NOT NULL DEFAULT 1 CHECK (prompt_version > 0),
  prompt_template text NOT NULL,
  branding jsonb NOT NULL DEFAULT '{}'::jsonb,
  disclaimer text NOT NULL,
  consent_copy text NOT NULL,
  calendly_url text,
  waitlist_url text,
  capacity_state text NOT NULL DEFAULT 'unavailable' CHECK (capacity_state IN ('open','waitlist','unavailable')),
  gpt_enabled boolean NOT NULL DEFAULT false,
  cloud_enabled boolean NOT NULL DEFAULT false,
  generation_enabled boolean NOT NULL DEFAULT false,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.wellness_partners (
  partner_key, display_name, prompt_template, disclaimer, consent_copy, branding
) VALUES (
  'nourished_rebel',
  'Nourished Rebel',
  'Use the Nourished Rebel four-pillar framework: sleep, blood sugar regulation, nutrient-dense nourishment, and stress management. Write warm, specific, non-diagnostic wellness guidance. Name what is working before opportunities. Never diagnose, interpret a lab as a condition, or advise medication changes.',
  'Wellness guidance from Nourished Rebel, not medical advice.',
  'By continuing, you allow Health Vault to use the wellness information you choose to provide to create Nourished Rebel Insights. You can turn this off at any time.',
  '{"accent":"earth","attribution":"Powered by Nourished Rebel"}'::jsonb
) ON CONFLICT (partner_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.wellness_partner_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_key text NOT NULL REFERENCES public.wellness_partners(partner_key),
  framework_version integer NOT NULL,
  prompt_version integer NOT NULL,
  configuration jsonb NOT NULL,
  change_reason text NOT NULL,
  published_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_key, framework_version, prompt_version)
);

CREATE TABLE IF NOT EXISTS public.wellness_partner_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_key text NOT NULL REFERENCES public.wellness_partners(partner_key),
  active boolean NOT NULL DEFAULT true,
  consent_version integer NOT NULL DEFAULT 1,
  opted_in_at timestamptz NOT NULL DEFAULT now(),
  opted_in_source text NOT NULL CHECK (opted_in_source IN ('gpt_app','saas_cloud')),
  snoozed_until timestamptz,
  opted_out_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, partner_key)
);

CREATE TABLE IF NOT EXISTS public.wellness_check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_key text NOT NULL REFERENCES public.wellness_partners(partner_key),
  questionnaire_version integer NOT NULL DEFAULT 1,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(answers) = 'object'),
  skipped_questions text[] NOT NULL DEFAULT '{}',
  answered_count smallint NOT NULL DEFAULT 0 CHECK (answered_count BETWEEN 0 AND 6),
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed')),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, partner_key, questionnaire_version)
);

CREATE TABLE IF NOT EXISTS public.wellness_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_key text NOT NULL REFERENCES public.wellness_partners(partner_key),
  version integer NOT NULL CHECK (version > 0),
  framework_version integer NOT NULL,
  prompt_version integer NOT NULL,
  source_fingerprint text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending','generating','succeeded','failed','rejected')),
  insight jsonb,
  source_kinds text[] NOT NULL DEFAULT '{}',
  safety_flags text[] NOT NULL DEFAULT '{}',
  model text,
  duration_ms integer,
  error_code text,
  generated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, partner_key, version),
  UNIQUE (user_id, partner_key, source_fingerprint)
);

CREATE TABLE IF NOT EXISTS public.wellness_insight_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_id uuid NOT NULL REFERENCES public.wellness_insights(id) ON DELETE CASCADE,
  target text NOT NULL CHECK (target IN ('overall','headline','sleep','blood_sugar','nourishment','stress')),
  rating text NOT NULL CHECK (rating IN ('up','down')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, insight_id, target)
);

CREATE TABLE IF NOT EXISTS public.wellness_funnel_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  partner_key text NOT NULL REFERENCES public.wellness_partners(partner_key),
  product_key text NOT NULL CHECK (product_key IN ('gpt_app','saas_cloud')),
  event_name text NOT NULL CHECK (event_name IN ('nudge_viewed','opted_in','check_in_started','check_in_four_answered','insight_viewed','deep_dive_started','feedback_submitted','cta_viewed','cta_clicked','booking_consent','booking_handoff','booking_confirmed','opted_out','safety_rejected')),
  correlation_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wellness_admin_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES auth.users(id),
  partner_key text NOT NULL REFERENCES public.wellness_partners(partner_key),
  action text NOT NULL,
  before_version jsonb,
  after_version jsonb,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wellness_insights_latest_idx ON public.wellness_insights(user_id, partner_key, created_at DESC);
CREATE INDEX IF NOT EXISTS wellness_funnel_partner_product_idx ON public.wellness_funnel_events(partner_key, product_key, occurred_at DESC);

ALTER TABLE public.wellness_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_partner_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_partner_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_insight_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_funnel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_admin_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own wellness enrollment" ON public.wellness_partner_enrollments FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users create own wellness enrollment" ON public.wellness_partner_enrollments FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users update own wellness enrollment" ON public.wellness_partner_enrollments FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users read own wellness check-ins" ON public.wellness_check_ins FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users create own wellness check-ins" ON public.wellness_check_ins FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users update own wellness check-ins" ON public.wellness_check_ins FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users read own wellness insights" ON public.wellness_insights FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()) AND status = 'succeeded');
CREATE POLICY "Users read own wellness feedback" ON public.wellness_insight_feedback FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users create own wellness feedback" ON public.wellness_insight_feedback FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users update own wellness feedback" ON public.wellness_insight_feedback FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users create own wellness events" ON public.wellness_funnel_events FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));

REVOKE ALL ON public.wellness_partners, public.wellness_partner_versions, public.wellness_admin_audit FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.wellness_partner_enrollments, public.wellness_check_ins, public.wellness_insight_feedback TO authenticated;
GRANT SELECT ON public.wellness_insights TO authenticated;
GRANT INSERT ON public.wellness_funnel_events TO authenticated;

-- Existing role assignments use an extensible text[] permission field.
COMMENT ON TABLE public.wellness_admin_audit IS 'Immutable partner configuration audit; no patient content is permitted.';
COMMENT ON COLUMN public.wellness_funnel_events.metadata IS 'Allowlisted non-PHI analytics metadata only.';
