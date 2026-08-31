-- Create the operational practitioner profile when a trusted server workflow
-- assigns the practitioner role. Professional verification remains separate.
CREATE OR REPLACE FUNCTION public.create_practitioner_profile_for_membership()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  practitioner_email text;
BEGIN
  IF 'practitioner' = ANY (NEW.roles) THEN
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
    ON CONFLICT (membership_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_practitioner_profile_after_membership_role ON public.provider_memberships;
CREATE TRIGGER create_practitioner_profile_after_membership_role
AFTER INSERT OR UPDATE OF roles ON public.provider_memberships
FOR EACH ROW EXECUTE FUNCTION public.create_practitioner_profile_for_membership();

INSERT INTO public.practitioner_profiles (
  provider_account_id, membership_id, display_name, credential_status, status
)
SELECT
  membership.provider_account_id,
  membership.id,
  COALESCE(NULLIF(split_part(auth_user.email, '@', 1), ''), 'Practitioner'),
  'unverified',
  CASE WHEN membership.status = 'active' THEN 'active' ELSE 'inactive' END
FROM public.provider_memberships membership
LEFT JOIN auth.users auth_user ON auth_user.id = membership.principal_id
WHERE 'practitioner' = ANY (membership.roles)
ON CONFLICT (membership_id) DO NOTHING;

REVOKE ALL ON FUNCTION public.create_practitioner_profile_for_membership() FROM PUBLIC, anon, authenticated;

COMMENT ON FUNCTION public.create_practitioner_profile_for_membership() IS
  'Creates an unverified practitioner profile from a trusted membership role change; never verifies credentials.';
