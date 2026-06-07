/*
  # No-op: duplicate of 20260401200003_create_claims_table.sql

  Same schema and RLS policies were applied twice under different timestamps.
  Fresh replays fail on duplicate CREATE POLICY. See 20260401200003.
*/
