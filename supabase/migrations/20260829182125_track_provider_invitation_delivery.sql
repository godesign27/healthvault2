/* Delivery metadata is operational only. Authentication tokens remain owned by Supabase Auth. */

ALTER TABLE public.provider_membership_invitations
  ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'pending'
    CHECK (delivery_status IN ('pending', 'sent', 'failed')),
  ADD COLUMN IF NOT EXISTS delivery_attempts integer NOT NULL DEFAULT 0 CHECK (delivery_attempts >= 0),
  ADD COLUMN IF NOT EXISTS last_delivery_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_delivery_error text;
