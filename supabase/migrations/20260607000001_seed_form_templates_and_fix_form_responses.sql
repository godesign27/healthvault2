/*
  # Seed form_templates and make form_responses writable

  The Medical Forms feature was entirely front-end mock: form_templates and
  form_responses were empty, and form_responses could never be written because of a
  contradiction between its foreign key and its RLS policy.

  This migration:
  1. Seeds the 18 form templates (required: form_responses.template_id has an FK to
     form_templates.id).
  2. Adds a unique index on (patient_id, template_id) so the app can upsert one response
     per template per patient.
  3. Fixes the INSERT/UPDATE RLS policies. form_responses.patient_id references
     patient_profiles(id) (a generated uuid), but the old policies required
     patient_id = auth.uid() (the user id). Those can never both hold, so inserts always
     failed. The policies now validate ownership through patient_profiles.
*/

-- 1. Seed form templates (metadata; field structure lives in src/lib/forms/catalog.ts)
INSERT INTO public.form_templates (id, title, description, category, version) VALUES
  ('patient-reg', 'Patient Registration', 'Basic demographics, contact, and emergency contacts.', 'Identification', '2025.01'),
  ('medical-id', 'Medical ID Information', 'Allergies, meds, providers, pharmacy, and blood type.', 'Identification', '2025.01'),
  ('medical-history', 'Medical History', 'Past conditions, surgeries, hospitalizations, family history.', 'Identification', '2025.01'),
  ('hipaa', 'HIPAA Authorization & Privacy', 'Consent to use/disclose health info per HIPAA.', 'Legal & Consent', '2025.01'),
  ('consent-treat', 'Consent to Treat', 'General consent for medical treatment and procedures.', 'Legal & Consent', '2025.01'),
  ('privacy-practices', 'Notice of Privacy Practices', 'Acknowledgment of receipt of privacy notice.', 'Legal & Consent', '2025.01'),
  ('release-info', 'Release of Information', 'Authorization to release medical records to third parties.', 'Legal & Consent', '2025.01'),
  ('advance-directives', 'Advance Directives', 'Living will, healthcare proxy, and end-of-life wishes.', 'Care Preferences', '2025.01'),
  ('emergency-contact', 'Emergency Contact Information', 'People to contact in case of medical emergency.', 'Care Preferences', '2025.01'),
  ('communication-prefs', 'Communication Preferences', 'Preferred methods and times for contact.', 'Care Preferences', '2025.01'),
  ('cultural-accessibility', 'Cultural & Accessibility Preferences', 'Cultural, religious, and accessibility considerations.', 'Care Preferences', '2025.01'),
  ('insurance-info', 'Insurance Information', 'Primary/secondary insurance and card uploads.', 'Insurance & Billing', '2025.01'),
  ('financial-responsibility', 'Financial Responsibility Agreement', 'Agreement for payment of services rendered.', 'Insurance & Billing', '2025.01'),
  ('payment-info', 'Payment Information', 'Billing address and payment method details.', 'Insurance & Billing', '2025.01'),
  ('social-history', 'Social History', 'Smoking, alcohol, exercise, and social habits.', 'Health & Lifestyle', '2025.01'),
  ('current-medications', 'Current Medications', 'List of all current medications and supplements.', 'Health & Lifestyle', '2025.01'),
  ('allergy-info', 'Allergy Information', 'Known allergies to medications, foods, and substances.', 'Health & Lifestyle', '2025.01'),
  ('immunization-record', 'Immunization Record', 'Vaccination history and immunization records.', 'Health & Lifestyle', '2025.01')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  version = EXCLUDED.version,
  updated_at = now();

-- 2. One response per patient per template (enables upsert)
CREATE UNIQUE INDEX IF NOT EXISTS form_responses_patient_template_key
  ON public.form_responses (patient_id, template_id);

-- 3. Fix INSERT/UPDATE RLS: validate ownership via patient_profiles (matches the FK target)
DROP POLICY IF EXISTS "Users can insert form responses" ON public.form_responses;
CREATE POLICY "Users can insert form responses"
  ON public.form_responses
  FOR INSERT
  WITH CHECK (
    patient_id IN (
      SELECT id FROM public.patient_profiles WHERE user_id = (auth.uid())::text
    )
  );

DROP POLICY IF EXISTS "Users can update own form responses" ON public.form_responses;
CREATE POLICY "Users can update own form responses"
  ON public.form_responses
  FOR UPDATE
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
