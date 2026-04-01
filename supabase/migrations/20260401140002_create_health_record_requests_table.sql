/*
  # Create health record requests table

  1. New Tables
    - `health_record_requests`
      - `id` (uuid, primary key)
      - `user_id` (text, references the requesting user)
      - `provider_name` (text, the provider to request from)
      - `provider_id` (text, optional reference to providers table)
      - `record_types` (text[], types of records being requested)
      - `date_range_start` (date, optional start of date range)
      - `date_range_end` (date, optional end of date range)
      - `status` (text, one of: pending, sent, received, failed)
      - `notes` (text, optional notes)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `health_record_requests` table
    - Add policies for authenticated users to manage their own requests
*/

CREATE TABLE IF NOT EXISTS health_record_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  provider_name text NOT NULL,
  provider_id text,
  record_types text[] DEFAULT '{}'::text[],
  date_range_start date,
  date_range_end date,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'received', 'failed')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE health_record_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own record requests"
  ON health_record_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own record requests"
  ON health_record_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own record requests"
  ON health_record_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE INDEX IF NOT EXISTS idx_health_record_requests_user_id
  ON health_record_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_health_record_requests_status
  ON health_record_requests(status);
