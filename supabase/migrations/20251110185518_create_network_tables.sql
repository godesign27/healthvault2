/*
  # Create Network Tables for Providers and Pharmacies

  1. New Tables
    - `providers`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `npi` (text, National Provider Identifier)
      - `name` (text, required)
      - `specialty` (text)
      - `clinic` (text)
      - `phone` (text)
      - `email` (text)
      - `address` (text)
      - `relationship` (enum: Primary, Specialist, Dental, Vision, Therapy, Other)
      - `connection_source` (enum: FHIR, Manual, Referral)
      - `last_visit_date` (timestamptz)
      - `in_network` (boolean)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `pharmacies`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text, required)
      - `chain` (text)
      - `phone` (text)
      - `address` (text)
      - `preferred` (boolean, default false)
      - `delivery_options` (text array)
      - `in_network` (boolean)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for users to manage their own records
    - Support demo user UUID for testing

  3. Indexes
    - Index on user_id for both tables
    - Index on relationship for providers
    - Index on preferred for pharmacies
*/

-- Create enums for provider relationship and connection source
DO $$ BEGIN
  CREATE TYPE provider_relationship AS ENUM ('Primary', 'Specialist', 'Dental', 'Vision', 'Therapy', 'Other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE provider_connection_source AS ENUM ('FHIR', 'Manual', 'Referral');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create providers table
CREATE TABLE IF NOT EXISTS providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  npi text,
  name text NOT NULL,
  specialty text,
  clinic text,
  phone text,
  email text,
  address text,
  relationship provider_relationship,
  connection_source provider_connection_source DEFAULT 'Manual' NOT NULL,
  last_visit_date timestamptz,
  in_network boolean,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create pharmacies table
CREATE TABLE IF NOT EXISTS pharmacies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  name text NOT NULL,
  chain text,
  phone text,
  address text,
  preferred boolean DEFAULT false NOT NULL,
  delivery_options text[],
  in_network boolean,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;

-- Providers policies
CREATE POLICY "Users can view own providers"
  ON providers FOR SELECT
  USING (
    user_id = '00000000-0000-0000-0000-000000000000'::uuid 
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert own providers"
  ON providers FOR INSERT
  WITH CHECK (
    user_id = '00000000-0000-0000-0000-000000000000'::uuid
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );

CREATE POLICY "Users can update own providers"
  ON providers FOR UPDATE
  USING (
    user_id = '00000000-0000-0000-0000-000000000000'::uuid
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  )
  WITH CHECK (
    user_id = '00000000-0000-0000-0000-000000000000'::uuid
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete own providers"
  ON providers FOR DELETE
  USING (
    user_id = '00000000-0000-0000-0000-000000000000'::uuid
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );

-- Pharmacies policies
CREATE POLICY "Users can view own pharmacies"
  ON pharmacies FOR SELECT
  USING (
    user_id = '00000000-0000-0000-0000-000000000000'::uuid 
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert own pharmacies"
  ON pharmacies FOR INSERT
  WITH CHECK (
    user_id = '00000000-0000-0000-0000-000000000000'::uuid
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );

CREATE POLICY "Users can update own pharmacies"
  ON pharmacies FOR UPDATE
  USING (
    user_id = '00000000-0000-0000-0000-000000000000'::uuid
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  )
  WITH CHECK (
    user_id = '00000000-0000-0000-0000-000000000000'::uuid
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete own pharmacies"
  ON pharmacies FOR DELETE
  USING (
    user_id = '00000000-0000-0000-0000-000000000000'::uuid
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_providers_user_id ON providers(user_id);
CREATE INDEX IF NOT EXISTS idx_providers_relationship ON providers(relationship);
CREATE INDEX IF NOT EXISTS idx_pharmacies_user_id ON pharmacies(user_id);
CREATE INDEX IF NOT EXISTS idx_pharmacies_preferred ON pharmacies(preferred);

-- Seed mock data for demo user
INSERT INTO providers (user_id, name, specialty, clinic, phone, address, relationship, connection_source, last_visit_date, in_network)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'Dr. Alex Rivera', 'Family Medicine', 'Riverside Medical Center', '5551234567', '123 Main St, Suite 100, Springfield, IL 62701', 'Primary', 'Manual', '2025-10-15T10:00:00Z', true),
  ('00000000-0000-0000-0000-000000000000', 'Dr. Mina Cho', 'Cardiology', 'Heart & Vascular Institute', '5559876543', '456 Oak Ave, Springfield, IL 62702', 'Specialist', 'Referral', '2025-09-20T14:30:00Z', false)
ON CONFLICT DO NOTHING;

INSERT INTO pharmacies (user_id, name, chain, phone, address, preferred, delivery_options, in_network)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'Lakeside Pharmacy', 'Independent', '5555551234', '789 Lake Dr, Springfield, IL 62703', true, ARRAY['Pickup', 'Delivery'], true)
ON CONFLICT DO NOTHING;
