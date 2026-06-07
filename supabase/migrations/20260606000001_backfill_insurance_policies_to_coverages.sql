/*
  # Backfill insurance_policies → insurance_coverages

  Onboarding used to write to insurance_policies; the rest of the app reads from
  insurance_coverages. This migration copies any unmatched insurance_policies rows into
  insurance_coverages so onboarding insurance data becomes visible in-app.

  Strategy:
  1. For each insurance_policies row not already in insurance_coverages (matched by user_id
     + member_id_hash), find or create an insurance_providers row for the carrier_name.
  2. Insert into insurance_coverages with sensible defaults for required fields that
     insurance_policies didn't collect (plan_name = carrier_name, effective_start = created_at).
*/

DO $$
DECLARE
  policy_row RECORD;
  provider_id uuid;
BEGIN
  FOR policy_row IN
    SELECT p.*
    FROM insurance_policies p
    WHERE NOT EXISTS (
      SELECT 1 FROM insurance_coverages c
      WHERE c.user_id = p.user_id::uuid
        AND c.member_id_hash = p.member_id
    )
  LOOP
    -- Find an existing provider by name (case-insensitive), or create one
    SELECT id INTO provider_id
    FROM insurance_providers
    WHERE lower(name) = lower(policy_row.carrier_name)
    LIMIT 1;

    IF provider_id IS NULL THEN
      INSERT INTO insurance_providers (name, slug, is_popular)
      VALUES (
        policy_row.carrier_name,
        lower(regexp_replace(policy_row.carrier_name, '[^a-zA-Z0-9]+', '-', 'g')),
        false
      )
      RETURNING id INTO provider_id;
    END IF;

    -- Insert into insurance_coverages
    INSERT INTO insurance_coverages (
      user_id,
      provider_id,
      plan_name,
      member_id_hash,
      group_number,
      relationship,
      effective_start,
      is_primary,
      coverage_status,
      verification_status,
      source
    ) VALUES (
      policy_row.user_id::uuid,
      provider_id,
      policy_row.carrier_name,          -- best we have for plan_name
      policy_row.member_id,             -- stored as display value (consistent with app)
      policy_row.group_number,
      'self',
      COALESCE(policy_row.created_at, now()),
      policy_row.is_primary,
      'active',
      'connected',
      'manual'
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
