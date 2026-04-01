/*
  # Add Share Token and Expiry Fields
  
  1. Changes
    - Add `share_token` column to share_events table for secure URL access
    - Add `expires_at` column to share_events table for link expiration
  
  2. Security
    - Tokens are used to validate access to share links
    - Expiry dates enforce time-limited access
*/

-- Add share_token and expires_at columns to share_events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'share_events' AND column_name = 'share_token'
  ) THEN
    ALTER TABLE share_events ADD COLUMN share_token text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'share_events' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE share_events ADD COLUMN expires_at timestamptz;
  END IF;
END $$;

-- Add index for share_token lookups
CREATE INDEX IF NOT EXISTS idx_share_events_token ON share_events(share_token);