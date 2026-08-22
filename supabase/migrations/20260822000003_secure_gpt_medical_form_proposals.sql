/* Secure, expiring review proposals for confirmation-gated GPT medical-form drafts. */

DROP POLICY IF EXISTS "Users can view all form responses (demo)" ON public.form_responses;
DROP POLICY IF EXISTS "Users can view own form responses" ON public.form_responses;
CREATE POLICY "Users can view own form responses"
  ON public.form_responses FOR SELECT TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM public.patient_profiles WHERE user_id = (auth.uid())::text
    )
  );

DROP POLICY IF EXISTS "Users can insert form responses" ON public.form_responses;
CREATE POLICY "Users can insert own form responses"
  ON public.form_responses FOR INSERT TO authenticated
  WITH CHECK (
    patient_id IN (
      SELECT id FROM public.patient_profiles WHERE user_id = (auth.uid())::text
    )
  );

DROP POLICY IF EXISTS "Users can update form responses" ON public.form_responses;
DROP POLICY IF EXISTS "Users can update own form responses" ON public.form_responses;
CREATE POLICY "Users can update own form responses"
  ON public.form_responses FOR UPDATE TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM public.patient_profiles WHERE user_id = (auth.uid())::text
    )
  )
  WITH CHECK (
    patient_id IN (
      SELECT id FROM public.patient_profiles WHERE user_id = (auth.uid())::text
    )
  );

DROP POLICY IF EXISTS "Authenticated users can insert form templates" ON public.form_templates;

CREATE TABLE IF NOT EXISTS public.form_answer_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
  response_id uuid REFERENCES public.form_responses(id) ON DELETE CASCADE,
  template_id text NOT NULL REFERENCES public.form_templates(id) ON DELETE CASCADE,
  template_version text NOT NULL,
  proposed_answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  expected_response_updated_at timestamptz,
  expires_at timestamptz NOT NULL,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT form_answer_proposals_nonempty CHECK (jsonb_typeof(proposed_answers) = 'object' AND proposed_answers <> '{}'::jsonb)
);

ALTER TABLE public.form_answer_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own form answer proposals"
  ON public.form_answer_proposals FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own form answer proposals"
  ON public.form_answer_proposals FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND patient_id IN (
      SELECT id FROM public.patient_profiles WHERE user_id = (auth.uid())::text
    )
  );

CREATE POLICY "Users can confirm own form answer proposals"
  ON public.form_answer_proposals FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS form_answer_proposals_user_created_idx
  ON public.form_answer_proposals (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS form_answer_proposals_expiry_idx
  ON public.form_answer_proposals (expires_at)
  WHERE confirmed_at IS NULL;
