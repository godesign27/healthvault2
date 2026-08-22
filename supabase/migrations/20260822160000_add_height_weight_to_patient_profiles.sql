/*
  Add canonical current height and weight values to the authenticated medical profile.

  Values are stored in metric units so every client can format them for the user's locale.
  They remain nullable because users may choose not to provide them.
*/

ALTER TABLE public.patient_profiles
  ADD COLUMN IF NOT EXISTS height_cm numeric(5,2),
  ADD COLUMN IF NOT EXISTS weight_kg numeric(6,2);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'patient_profiles_height_cm_range'
  ) THEN
    ALTER TABLE public.patient_profiles
      ADD CONSTRAINT patient_profiles_height_cm_range
      CHECK (height_cm IS NULL OR (height_cm >= 30 AND height_cm <= 300));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'patient_profiles_weight_kg_range'
  ) THEN
    ALTER TABLE public.patient_profiles
      ADD CONSTRAINT patient_profiles_weight_kg_range
      CHECK (weight_kg IS NULL OR (weight_kg >= 1 AND weight_kg <= 700));
  END IF;
END $$;

COMMENT ON COLUMN public.patient_profiles.height_cm IS
  'User-entered current height in centimeters.';
COMMENT ON COLUMN public.patient_profiles.weight_kg IS
  'User-entered current weight in kilograms.';
