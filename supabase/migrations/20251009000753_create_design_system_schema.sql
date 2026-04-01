/*
  # Design System Database Schema

  1. New Tables
    - `components`
      - `id` (uuid, primary key) - Unique identifier
      - `name` (text) - Component name (e.g., "Radio Button", "Progress Bar")
      - `category` (text) - Component category (e.g., "Form Controls", "Navigation")
      - `description` (text) - Component description
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `component_variants`
      - `id` (uuid, primary key) - Unique identifier
      - `component_id` (uuid, foreign key) - Reference to components table
      - `name` (text) - Variant name (e.g., "Default", "Hover", "Disabled")
      - `size` (text) - Size variant (e.g., "14px", "16px", "small", "normal")
      - `state` (text) - Interactive state (e.g., "default", "hover", "focus")
      - `props` (jsonb) - Variant properties and configurations
      - `created_at` (timestamptz) - Creation timestamp

    - `design_tokens`
      - `id` (uuid, primary key) - Unique identifier
      - `category` (text) - Token category (e.g., "colors", "spacing", "typography")
      - `name` (text) - Token name (e.g., "primary-dark", "teal-500")
      - `value` (text) - Token value (e.g., "#1C2938", "16px")
      - `description` (text) - Token description
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `component_usage_logs`
      - `id` (uuid, primary key) - Unique identifier
      - `component_id` (uuid, foreign key) - Reference to components table
      - `variant_id` (uuid, foreign key, nullable) - Reference to component_variants table
      - `usage_count` (integer) - Number of times used
      - `last_used_at` (timestamptz) - Last usage timestamp
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read all data
    - Add policies for authenticated users to manage components and tokens
*/

-- Create components table
CREATE TABLE IF NOT EXISTS components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create component_variants table
CREATE TABLE IF NOT EXISTS component_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id uuid NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  name text NOT NULL,
  size text DEFAULT 'normal',
  state text DEFAULT 'default',
  props jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create design_tokens table
CREATE TABLE IF NOT EXISTS design_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  name text NOT NULL,
  value text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(category, name)
);

-- Create component_usage_logs table
CREATE TABLE IF NOT EXISTS component_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id uuid NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES component_variants(id) ON DELETE SET NULL,
  usage_count integer DEFAULT 0,
  last_used_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE components ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_usage_logs ENABLE ROW LEVEL SECURITY;

-- Policies for components table
CREATE POLICY "Anyone can view components"
  ON components FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert components"
  ON components FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update components"
  ON components FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete components"
  ON components FOR DELETE
  TO authenticated
  USING (true);

-- Policies for component_variants table
CREATE POLICY "Anyone can view component variants"
  ON component_variants FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert component variants"
  ON component_variants FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update component variants"
  ON component_variants FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete component variants"
  ON component_variants FOR DELETE
  TO authenticated
  USING (true);

-- Policies for design_tokens table
CREATE POLICY "Anyone can view design tokens"
  ON design_tokens FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert design tokens"
  ON design_tokens FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update design tokens"
  ON design_tokens FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete design tokens"
  ON design_tokens FOR DELETE
  TO authenticated
  USING (true);

-- Policies for component_usage_logs table
CREATE POLICY "Anyone can view component usage logs"
  ON component_usage_logs FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert component usage logs"
  ON component_usage_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update component usage logs"
  ON component_usage_logs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_component_variants_component_id ON component_variants(component_id);
CREATE INDEX IF NOT EXISTS idx_design_tokens_category ON design_tokens(category);
CREATE INDEX IF NOT EXISTS idx_component_usage_logs_component_id ON component_usage_logs(component_id);

-- Insert initial design tokens from screenshots
INSERT INTO design_tokens (category, name, value, description) VALUES
  ('colors', 'primary-dark', '#1C2938', 'Dark navy background color'),
  ('colors', 'teal-primary', '#1B7A8A', 'Primary teal action color'),
  ('colors', 'focus-blue', '#3B9CFF', 'Focus state blue'),
  ('colors', 'error-red', '#C81E1E', 'Error state red'),
  ('colors', 'success-green', '#0B8457', 'Success state green'),
  ('colors', 'warning-gold', '#8B6914', 'Warning state gold'),
  ('colors', 'background-light', '#F5F5F5', 'Light background'),
  ('colors', 'white', '#FFFFFF', 'White color'),
  ('spacing', '8px', '0.5rem', '8px spacing unit'),
  ('spacing', '16px', '1rem', '16px spacing unit'),
  ('spacing', '24px', '1.5rem', '24px spacing unit'),
  ('spacing', '32px', '2rem', '32px spacing unit')
ON CONFLICT (category, name) DO NOTHING;