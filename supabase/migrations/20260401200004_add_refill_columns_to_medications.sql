-- Add refill tracking columns to medications table

ALTER TABLE medications
  ADD COLUMN IF NOT EXISTS refills_total integer,
  ADD COLUMN IF NOT EXISTS refills_remaining integer;
