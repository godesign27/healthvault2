-- Create Insurance Management Schema
--
-- 1. New Tables
--    - insurance_providers: Store insurance provider information
--    - insurance_coverages: Store user insurance coverage details
--    - audit_events: Track all insurance-related events
--
-- 2. Security
--    - Enable RLS on all tables
--    - Add policies for authenticated users to manage their own data
--
-- 3. Indexes
--    - Optimize queries for user_id, provider_id, verification_status

-- Create insurance_providers table
CREATE TABLE IF NOT EXISTS insurance_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  payer_id text UNIQUE,
  logo_url text,
  slug text UNIQUE NOT NULL,
  is_popular boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create insurance_coverages table
CREATE TABLE IF NOT EXISTS insurance_coverages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider_id uuid NOT NULL REFERENCES insurance_providers(id) ON DELETE CASCADE,
  plan_name text NOT NULL,
  member_id_hash text NOT NULL,
  group_number text,
  bin text,
  pcn text,
  relationship text NOT NULL DEFAULT 'self',
  effective_start timestamptz NOT NULL,
  effective_end timestamptz,
  is_primary boolean DEFAULT false,
  verification_status text NOT NULL DEFAULT 'connected',
  last_verified_at timestamptz DEFAULT now(),
  source text NOT NULL DEFAULT 'manual',
  raw_fhir jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create audit_events table
CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entity text NOT NULL,
  action text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE insurance_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_coverages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Policies for insurance_providers (public read)
CREATE POLICY "Anyone can view insurance providers"
  ON insurance_providers FOR SELECT
  TO authenticated
  USING (true);

-- Policies for insurance_coverages
CREATE POLICY "Users can view own insurance coverages"
  ON insurance_coverages FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can insert own insurance coverages"
  ON insurance_coverages FOR INSERT
  TO authenticated
  WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update own insurance coverages"
  ON insurance_coverages FOR UPDATE
  TO authenticated
  USING (user_id::text = auth.uid()::text)
  WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can delete own insurance coverages"
  ON insurance_coverages FOR DELETE
  TO authenticated
  USING (user_id::text = auth.uid()::text);

-- Policies for audit_events
CREATE POLICY "Users can insert own audit events"
  ON audit_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can view own audit events"
  ON audit_events FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_insurance_coverages_user_id ON insurance_coverages(user_id);
CREATE INDEX IF NOT EXISTS idx_insurance_coverages_provider_id ON insurance_coverages(provider_id);
CREATE INDEX IF NOT EXISTS idx_insurance_coverages_verification_status ON insurance_coverages(verification_status);
CREATE INDEX IF NOT EXISTS idx_insurance_coverages_is_primary ON insurance_coverages(is_primary);
CREATE INDEX IF NOT EXISTS idx_insurance_providers_slug ON insurance_providers(slug);
CREATE INDEX IF NOT EXISTS idx_audit_events_user_id ON audit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON audit_events(entity);

-- Insert popular insurance providers
INSERT INTO insurance_providers (name, payer_id, slug, is_popular, logo_url) VALUES
  ('Blue Cross Blue Shield', '00590', 'bcbs', true, 'https://api.dicebear.com/7.x/initials/svg?seed=BCBS&backgroundColor=0066cc'),
  ('UnitedHealthcare', '87726', 'unitedhealthcare', true, 'https://api.dicebear.com/7.x/initials/svg?seed=UHC&backgroundColor=002677'),
  ('Aetna', '60054', 'aetna', true, 'https://api.dicebear.com/7.x/initials/svg?seed=Aetna&backgroundColor=7d3f98'),
  ('Cigna', '62308', 'cigna', true, 'https://api.dicebear.com/7.x/initials/svg?seed=Cigna&backgroundColor=00A6D6'),
  ('Humana', '80069', 'humana', true, 'https://api.dicebear.com/7.x/initials/svg?seed=Humana&backgroundColor=00843d'),
  ('Kaiser Permanente', '94428', 'kaiser', true, 'https://api.dicebear.com/7.x/initials/svg?seed=Kaiser&backgroundColor=0066cc'),
  ('Anthem', '47189', 'anthem', true, 'https://api.dicebear.com/7.x/initials/svg?seed=Anthem&backgroundColor=004d99'),
  ('Centene', '26026', 'centene', false, 'https://api.dicebear.com/7.x/initials/svg?seed=Centene&backgroundColor=ff6200'),
  ('Molina Healthcare', '66267', 'molina', false, 'https://api.dicebear.com/7.x/initials/svg?seed=Molina&backgroundColor=009cde'),
  ('WellCare', '23370', 'wellcare', false, 'https://api.dicebear.com/7.x/initials/svg?seed=WellCare&backgroundColor=ffa300')
ON CONFLICT (slug) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_insurance_coverages_updated_at'
  ) THEN
    CREATE TRIGGER update_insurance_coverages_updated_at
      BEFORE UPDATE ON insurance_coverages
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;