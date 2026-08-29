-- Public opt-in activation approved for every authenticated Health Vault user.
-- Enrollment remains explicit; this does not create enrollments automatically.
UPDATE public.wellness_partners
SET
  status = 'active',
  launch_stage = 'public',
  gpt_enabled = true,
  cloud_enabled = true,
  generation_enabled = true,
  updated_at = now()
WHERE partner_key = 'nourished_rebel';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.wellness_partners
    WHERE partner_key = 'nourished_rebel'
      AND status = 'active'
      AND launch_stage = 'public'
      AND gpt_enabled
      AND cloud_enabled
      AND generation_enabled
  ) THEN
    RAISE EXCEPTION 'Nourished Rebel public activation failed';
  END IF;
END
$$;
