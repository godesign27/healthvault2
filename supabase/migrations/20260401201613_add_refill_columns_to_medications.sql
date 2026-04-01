/*
  # Add refill tracking to medications

  1. Modified Tables
    - `medications`
      - Added `refills_total` (integer) - total refills prescribed
      - Added `refills_remaining` (integer) - remaining refills
*/

ALTER TABLE medications
  ADD COLUMN IF NOT EXISTS refills_total integer,
  ADD COLUMN IF NOT EXISTS refills_remaining integer;