/*
  Create a starter Health Vault profile after a verified patient invitation establishes a new
  identity link. Existing patient-owned profiles are never overwritten.
*/

CREATE OR REPLACE FUNCTION public.bootstrap_patient_profile_from_provider_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  roster public.provider_import_rows%ROWTYPE;
  verified_email text;
BEGIN
  IF NEW.status <> 'active' OR NEW.match_method <> 'verified_invitation' THEN
    RETURN NEW;
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = NEW.consumer_principal_id::text) THEN
    RETURN NEW;
  END IF;

  SELECT * INTO roster
  FROM public.provider_import_rows
  WHERE committed_patient_identity_id = NEW.provider_patient_identity_id
  ORDER BY created_at DESC
  LIMIT 1;

  SELECT email INTO verified_email
  FROM auth.users
  WHERE id = NEW.consumer_principal_id
    AND email_confirmed_at IS NOT NULL;

  IF roster.id IS NULL OR verified_email IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.user_profiles (
    user_id, first_name, last_name, email, date_of_birth, phone,
    address_line1, address_line2, city, state, postal_code, country,
    email_verified, onboarding_complete
  ) VALUES (
    NEW.consumer_principal_id::text, roster.given_name, roster.family_name, verified_email,
    roster.birth_date, roster.phone, roster.address_line_1, roster.address_line_2,
    roster.city, roster.state, roster.postal_code, COALESCE(roster.country, 'US'),
    true, true
  ) ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_patient_profile_from_provider_identity() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS bootstrap_patient_profile_after_identity_link ON public.patient_identity_links;
CREATE TRIGGER bootstrap_patient_profile_after_identity_link
AFTER INSERT ON public.patient_identity_links
FOR EACH ROW
EXECUTE FUNCTION public.bootstrap_patient_profile_from_provider_identity();

COMMENT ON FUNCTION public.bootstrap_patient_profile_from_provider_identity() IS
  'Creates a non-destructive starter Health Vault profile from verified invitation roster data; never updates an existing patient-owned profile.';
