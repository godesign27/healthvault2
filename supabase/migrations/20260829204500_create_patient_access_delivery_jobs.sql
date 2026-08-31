CREATE TABLE public.patient_access_delivery_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_account_id uuid NOT NULL REFERENCES public.provider_accounts(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  invitation_ids uuid[] NOT NULL,
  invitation_count integer NOT NULL CHECK (invitation_count > 0),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed', 'cancelled')),
  delivery_mode text NOT NULL DEFAULT 'digest' CHECK (delivery_mode = 'digest'),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  last_error text,
  external_message_ref text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  cancelled_at timestamptz,
  request_id text
);

CREATE INDEX idx_patient_access_delivery_jobs_provider_created
  ON public.patient_access_delivery_jobs (provider_account_id, created_at DESC);
CREATE INDEX idx_patient_access_delivery_jobs_status
  ON public.patient_access_delivery_jobs (status, created_at)
  WHERE status IN ('queued', 'failed');
CREATE INDEX idx_patient_access_delivery_jobs_created_by
  ON public.patient_access_delivery_jobs (created_by);

ALTER TABLE public.patient_access_delivery_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.patient_access_delivery_jobs FROM PUBLIC, anon, authenticated;

COMMENT ON TABLE public.patient_access_delivery_jobs IS
  'Service-only transactional patient invitation digest queue. External sending requires an onboarded sender domain and secret configuration.';
