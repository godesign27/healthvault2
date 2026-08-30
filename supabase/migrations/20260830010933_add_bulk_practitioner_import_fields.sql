ALTER TABLE public.provider_membership_invitations
  ADD COLUMN IF NOT EXISTS practitioner_display_name text,
  ADD COLUMN IF NOT EXISTS practitioner_specialty text,
  ADD COLUMN IF NOT EXISTS professional_identifier_type text,
  ADD COLUMN IF NOT EXISTS professional_identifier_value text,
  ADD COLUMN IF NOT EXISTS source_import_name text;

ALTER TABLE public.provider_membership_invitations
  ADD CONSTRAINT provider_invitation_practitioner_identifier_check CHECK (
    (professional_identifier_type IS NULL AND professional_identifier_value IS NULL)
    OR (professional_identifier_type IN ('npi', 'license', 'other') AND professional_identifier_value IS NOT NULL)
  );

CREATE OR REPLACE FUNCTION public.apply_practitioner_invitation_profile()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status IS DISTINCT FROM NEW.status
     AND 'practitioner' = ANY (NEW.roles) AND NEW.accepted_by IS NOT NULL THEN
    UPDATE public.practitioner_profiles AS profile
    SET display_name = COALESCE(NULLIF(NEW.practitioner_display_name, ''), profile.display_name),
        specialty = COALESCE(NULLIF(NEW.practitioner_specialty, ''), profile.specialty),
        professional_identifier_type = COALESCE(NULLIF(NEW.professional_identifier_type, ''), profile.professional_identifier_type),
        professional_identifier_value = COALESCE(NULLIF(NEW.professional_identifier_value, ''), profile.professional_identifier_value),
        credential_status = 'unverified',
        updated_at = now()
    FROM public.provider_memberships AS membership
    WHERE membership.provider_account_id = NEW.provider_account_id
      AND membership.principal_id = NEW.accepted_by
      AND profile.membership_id = membership.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS apply_practitioner_invitation_profile_after_acceptance ON public.provider_membership_invitations;
CREATE TRIGGER apply_practitioner_invitation_profile_after_acceptance
AFTER UPDATE OF status ON public.provider_membership_invitations
FOR EACH ROW EXECUTE FUNCTION public.apply_practitioner_invitation_profile();

REVOKE ALL ON FUNCTION public.apply_practitioner_invitation_profile() FROM PUBLIC, anon, authenticated;
