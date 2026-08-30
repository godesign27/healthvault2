-- Keep operational profile state aligned to membership state without ever
-- elevating or otherwise changing professional credential verification.
CREATE OR REPLACE FUNCTION public.create_practitioner_profile_for_membership()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  practitioner_email text;
BEGIN
  IF NOT ('practitioner' = ANY (NEW.roles)) THEN
    UPDATE public.practitioner_profiles SET status = 'inactive', updated_at = now()
    WHERE membership_id = NEW.id;
    RETURN NEW;
  END IF;

  SELECT email INTO practitioner_email FROM auth.users WHERE id = NEW.principal_id;
  INSERT INTO public.practitioner_profiles (
    provider_account_id, membership_id, display_name, credential_status, status
  ) VALUES (
    NEW.provider_account_id,
    NEW.id,
    COALESCE(NULLIF(split_part(practitioner_email, '@', 1), ''), 'Practitioner'),
    'unverified',
    CASE WHEN NEW.status = 'active' THEN 'active' ELSE 'inactive' END
  )
  ON CONFLICT (membership_id) DO UPDATE SET
    status = EXCLUDED.status,
    credential_status = public.practitioner_profiles.credential_status,
    updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_practitioner_profile_after_membership_role ON public.provider_memberships;
CREATE TRIGGER create_practitioner_profile_after_membership_role
AFTER INSERT OR UPDATE OF roles, status ON public.provider_memberships
FOR EACH ROW EXECUTE FUNCTION public.create_practitioner_profile_for_membership();

REVOKE ALL ON FUNCTION public.create_practitioner_profile_for_membership() FROM PUBLIC, anon, authenticated;
