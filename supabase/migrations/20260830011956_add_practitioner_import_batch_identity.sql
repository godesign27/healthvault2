ALTER TABLE public.provider_membership_invitations
  ADD COLUMN IF NOT EXISTS source_import_batch_id uuid;

CREATE INDEX IF NOT EXISTS idx_provider_membership_invitations_import_batch
  ON public.provider_membership_invitations (provider_account_id, source_import_batch_id)
  WHERE source_import_batch_id IS NOT NULL AND status = 'pending';
