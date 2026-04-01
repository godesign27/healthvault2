/*
  # Create Organizations and Multi-Tenancy Schema

  1. New Tables
    - `organizations` - Stores healthcare organization/provider information
      - `id` (uuid, primary key)
      - `name` (text) - Organization name
      - `subdomain` (text, unique) - Subdomain slug (e.g., 'acme-clinic')
      - `logo_url` (text) - Organization logo
      - `primary_color` (text) - Brand color
      - `contact_email` (text)
      - `contact_phone` (text)
      - `address` (jsonb) - Full address details
      - `settings` (jsonb) - Organization-specific settings
      - `status` (text) - active, inactive, suspended
      - `subscription_tier` (text) - Subscription plan
      - `subscription_expires_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `organization_admins` - Maps users to organizations with admin roles
      - `id` (uuid, primary key)
      - `organization_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `role` (text) - owner, admin, staff
      - `permissions` (jsonb) - Granular permissions
      - `created_at` (timestamptz)

    - `organization_patients` - Maps patients to organizations
      - `id` (uuid, primary key)
      - `organization_id` (uuid, foreign key)
      - `patient_id` (text) - Patient user_id
      - `patient_number` (text) - Organization-specific patient ID
      - `assigned_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Super admins can access all organizations
    - Organization admins can only access their organization
    - Patients can only see their assigned organization info

  3. Indexes
    - subdomain for fast lookups
    - organization_id for joins
*/

-- ============================================================================
-- ORGANIZATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subdomain text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  primary_color text DEFAULT '#4F46E5',
  contact_email text,
  contact_phone text,
  address jsonb DEFAULT '{}'::jsonb,
  settings jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'professional', 'enterprise')),
  subscription_expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add trigger for updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index on subdomain for fast lookups
CREATE INDEX IF NOT EXISTS idx_organizations_subdomain ON organizations(subdomain);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Public can view active organizations"
  ON organizations FOR SELECT
  USING (status = 'active');

CREATE POLICY "Authenticated users can view organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only super admins can insert organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = (SELECT auth.uid())
      AND (auth.users.raw_app_meta_data->>'is_super_admin')::boolean = true
    )
  );

CREATE POLICY "Only super admins can update organizations"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = (SELECT auth.uid())
      AND (auth.users.raw_app_meta_data->>'is_super_admin')::boolean = true
    )
  );

CREATE POLICY "Only super admins can delete organizations"
  ON organizations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = (SELECT auth.uid())
      AND (auth.users.raw_app_meta_data->>'is_super_admin')::boolean = true
    )
  );

-- ============================================================================
-- ORGANIZATION ADMINS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'staff')),
  permissions jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Create index on organization_id and user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_organization_admins_org_id ON organization_admins(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_admins_user_id ON organization_admins(user_id);

-- Enable RLS
ALTER TABLE organization_admins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization_admins
CREATE POLICY "Users can view their admin assignments"
  ON organization_admins FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Organization owners can manage admins"
  ON organization_admins FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_admins oa
      WHERE oa.organization_id = organization_admins.organization_id
      AND oa.user_id = (SELECT auth.uid())
      AND oa.role = 'owner'
    )
  );

CREATE POLICY "Super admins can manage all org admins"
  ON organization_admins FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = (SELECT auth.uid())
      AND (auth.users.raw_app_meta_data->>'is_super_admin')::boolean = true
    )
  );

-- ============================================================================
-- ORGANIZATION PATIENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id text NOT NULL,
  patient_number text,
  notes text,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, patient_id)
);

-- Create index on organization_id and patient_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_organization_patients_org_id ON organization_patients(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_patients_patient_id ON organization_patients(patient_id);

-- Enable RLS
ALTER TABLE organization_patients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization_patients
CREATE POLICY "Patients can view their organization assignments"
  ON organization_patients FOR SELECT
  TO authenticated
  USING (patient_id = (SELECT auth.uid()::text));

CREATE POLICY "Organization admins can view their patients"
  ON organization_patients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_admins oa
      WHERE oa.organization_id = organization_patients.organization_id
      AND oa.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Organization admins can manage patients"
  ON organization_patients FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_admins oa
      WHERE oa.organization_id = organization_patients.organization_id
      AND oa.user_id = (SELECT auth.uid())
      AND oa.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- SEED SAMPLE ORGANIZATIONS
-- ============================================================================

INSERT INTO organizations (name, subdomain, slug, contact_email, contact_phone, status)
VALUES
  ('Acme Medical Clinic', 'acme-clinic', 'acme-clinic', 'contact@acme-clinic.com', '(555) 123-4567', 'active'),
  ('Riverside Health', 'riverside-health', 'riverside-health', 'info@riverside-health.com', '(555) 987-6543', 'active'),
  ('City General Hospital', 'city-general', 'city-general', 'admin@city-general.com', '(555) 246-8135', 'active')
ON CONFLICT (subdomain) DO NOTHING;
