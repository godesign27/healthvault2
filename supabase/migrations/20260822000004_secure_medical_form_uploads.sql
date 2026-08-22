/* Private provider-form uploads for the authenticated Medical Forms workspace. */

CREATE TABLE IF NOT EXISTS public.medical_form_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES public.patient_profiles(id) ON DELETE SET NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  notes text CHECK (notes IS NULL OR char_length(notes) <= 1000),
  original_filename text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  mime_type text NOT NULL CHECK (mime_type IN ('application/pdf', 'image/png', 'image/jpeg')),
  size_bytes bigint NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 10485760),
  status text NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'ready', 'error')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.medical_form_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own medical form uploads" ON public.medical_form_uploads
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can create own medical form uploads" ON public.medical_form_uploads
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can update own medical form uploads" ON public.medical_form_uploads
  FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can delete own medical form uploads" ON public.medical_form_uploads
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

CREATE INDEX IF NOT EXISTS medical_form_uploads_user_created_idx
  ON public.medical_form_uploads (user_id, created_at DESC);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('medical-form-uploads', 'medical-form-uploads', false, 10485760, ARRAY['application/pdf', 'image/png', 'image/jpeg'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Users can upload own medical forms" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'medical-form-uploads' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY "Users can read own medical forms" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'medical-form-uploads' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY "Users can delete own medical forms" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'medical-form-uploads' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
