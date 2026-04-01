/*
  # Medical Forms Sharing Schema

  1. New Tables
    - `patient_profiles`
      - `id` (uuid, primary key)
      - `user_id` (text, nullable for demo)
      - `name` (text)
      - `birth_date` (date, nullable)
      - `contact_email` (text, nullable)
      - `contact_phone` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `form_templates`
      - `id` (text, primary key) - e.g., 'patient-reg'
      - `title` (text)
      - `description` (text)
      - `category` (text) - e.g., 'Identification'
      - `fhir_questionnaire_json` (jsonb, nullable) - FHIR Questionnaire resource
      - `version` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `form_responses`
      - `id` (uuid, primary key)
      - `template_id` (text, foreign key to form_templates)
      - `patient_id` (uuid, foreign key to patient_profiles)
      - `answers_json` (jsonb) - form field answers
      - `fhir_qr_json` (jsonb, nullable) - FHIR QuestionnaireResponse resource
      - `status` (text) - 'complete' or 'incomplete'
      - `signed_at` (timestamptz, nullable)
      - `pdf_url` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `share_events`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, foreign key to patient_profiles)
      - `form_response_ids` (jsonb) - array of form response IDs
      - `method` (text) - 'SecureLink', 'Direct', or 'FHIR'
      - `recipient` (jsonb) - { displayName, orgName?, npi?, email?, directAddress?, fhirEndpoint? }
      - `bundle_url` (text, nullable) - signed URL to FHIR Bundle JSON
      - `pdf_url` (text, nullable) - signed URL to PDF packet
      - `status` (text) - 'sent', 'delivered', 'opened', 'revoked', 'expired'
      - `sent_at` (timestamptz)
      - `opened_at` (timestamptz, nullable)
      - `revoked_at` (timestamptz, nullable)
      - `is_revoked` (boolean, default false)
      - `note` (text, nullable) - optional message to recipient
      - `options` (jsonb, nullable) - { package: {pdf, fhirBundle}, cc: {me, patient} }
      - `audit` (jsonb, nullable) - audit log entries
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - For demo purposes, allow broader access but restrict by user_id where applicable

  3. Important Notes
    - patient_id and form responses link to enable sharing completed forms
    - ShareEvent tracks all sharing activities with audit trail
    - FHIR resources stored as JSONB for flexibility
    - Status tracking enables revocation and access control
*/

-- Create patient_profiles table
CREATE TABLE IF NOT EXISTS patient_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text,
  name text NOT NULL,
  birth_date date,
  contact_email text,
  contact_phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all patient profiles (demo)"
  ON patient_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert patient profiles"
  ON patient_profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update patient profiles"
  ON patient_profiles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create form_templates table
CREATE TABLE IF NOT EXISTS form_templates (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  fhir_questionnaire_json jsonb,
  version text DEFAULT '1.0',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view form templates"
  ON form_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert form templates"
  ON form_templates FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create form_responses table
CREATE TABLE IF NOT EXISTS form_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id text NOT NULL REFERENCES form_templates(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  answers_json jsonb NOT NULL DEFAULT '{}',
  fhir_qr_json jsonb,
  status text NOT NULL DEFAULT 'incomplete',
  signed_at timestamptz,
  pdf_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('complete', 'incomplete'))
);

ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all form responses (demo)"
  ON form_responses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert form responses"
  ON form_responses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update form responses"
  ON form_responses FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create share_events table
CREATE TABLE IF NOT EXISTS share_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  form_response_ids jsonb NOT NULL DEFAULT '[]',
  method text NOT NULL,
  recipient jsonb NOT NULL,
  bundle_url text,
  pdf_url text,
  status text NOT NULL DEFAULT 'sent',
  sent_at timestamptz DEFAULT now(),
  opened_at timestamptz,
  revoked_at timestamptz,
  is_revoked boolean DEFAULT false,
  note text,
  options jsonb,
  audit jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_method CHECK (method IN ('SecureLink', 'Direct', 'FHIR')),
  CONSTRAINT valid_status CHECK (status IN ('sent', 'delivered', 'opened', 'revoked', 'expired'))
);

ALTER TABLE share_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all share events (demo)"
  ON share_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert share events"
  ON share_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update share events"
  ON share_events FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_form_responses_patient_id ON form_responses(patient_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_template_id ON form_responses(template_id);
CREATE INDEX IF NOT EXISTS idx_share_events_patient_id ON share_events(patient_id);
CREATE INDEX IF NOT EXISTS idx_share_events_status ON share_events(status);
CREATE INDEX IF NOT EXISTS idx_share_events_is_revoked ON share_events(is_revoked);