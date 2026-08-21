/*
  # No-op: duplicate of 20251107000000_create_medical_profile_tables.sql

  This migration re-recorded the same CREATE TABLE / CREATE POLICY statements
  under a new timestamp. On a fresh database replay (Supabase Preview), the
  duplicate CREATE POLICY calls fail with "policy already exists" (SQLSTATE 42710).

  All objects are created by 20251107000000_create_medical_profile_tables.sql.
*/
