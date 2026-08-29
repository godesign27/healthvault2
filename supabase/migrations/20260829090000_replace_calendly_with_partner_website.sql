-- Phase-one practitioner CTA links to the partner's public website. Nutri-Q
-- booking remains a future integration and receives no Health Vault data.
ALTER TABLE public.wellness_partners RENAME COLUMN calendly_url TO website_url;
ALTER TABLE public.wellness_partners DROP COLUMN waitlist_url;
ALTER TABLE public.wellness_partners DROP COLUMN capacity_state;

UPDATE public.wellness_partners
SET website_url = 'https://nurishedrebel.com', updated_at = now()
WHERE partner_key = 'nourished_rebel';

ALTER TABLE public.wellness_partners ALTER COLUMN website_url SET NOT NULL;

ALTER TABLE public.wellness_funnel_events DROP CONSTRAINT wellness_funnel_events_event_name_check;
ALTER TABLE public.wellness_funnel_events ADD CONSTRAINT wellness_funnel_events_event_name_check CHECK (
  event_name IN ('nudge_viewed','opted_in','check_in_started','check_in_four_answered','insight_viewed','deep_dive_started','feedback_submitted','cta_viewed','cta_clicked','cta_handoff','opted_out','safety_rejected')
);
