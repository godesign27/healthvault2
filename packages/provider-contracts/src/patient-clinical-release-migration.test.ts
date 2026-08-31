import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sql = readFileSync(new URL('../../../supabase/migrations/20260829224234_release_consent_bound_clinical_records.sql', import.meta.url), 'utf8');

test('clinical release requires explicit v3 scope, captured consent, and an active grant', () => {
  assert.match(sql, /health-vault-synthetic-pilot-access-v3/);
  assert.match(sql, /clinical\.imported_records/);
  assert.match(sql, /patient_access_consent_receipts/);
  assert.match(sql, /active consent-bound identity link required/);
  assert.match(sql, /grant_row\.expires_at IS NULL OR grant_row\.expires_at > now\(\)/);
});

test('clinical release fails closed when patient profile identity does not match the roster', () => {
  assert.match(sql, /lower\(trim\(profile\.first_name\)\).*lower\(trim\(roster\.given_name\)\)/s);
  assert.match(sql, /lower\(trim\(profile\.last_name\)\).*lower\(trim\(roster\.family_name\)\)/s);
  assert.match(sql, /profile\.date_of_birth IS DISTINCT FROM roster\.birth_date/);
  assert.match(sql, /blocked_identity_mismatch/);
});

test('released records preserve provenance and remain patient-owned', () => {
  assert.match(sql, /CREATE TABLE public\.patient_clinical_records/);
  assert.match(sql, /consent_receipt_id uuid NOT NULL/);
  assert.match(sql, /sourceDigest.*batchDigest/s);
  assert.match(sql, /GRANT SELECT ON public\.patient_clinical_records TO authenticated/);
  assert.match(sql, /auth\.uid\(\)\) = consumer_principal_id/);
  assert.match(sql, /REVOKE ALL ON public\.patient_clinical_release_events FROM PUBLIC, anon, authenticated/);
});

test('quarantine resources are mirrored idempotently into the existing patient records UI', () => {
  assert.match(sql, /ADD COLUMN provider_clinical_resource_id uuid/);
  assert.match(sql, /INSERT INTO public\.health_records/);
  assert.match(sql, /provider-imported/);
  assert.match(sql, /ON CONFLICT \(user_id, provider_clinical_resource_id\)/);
  assert.match(sql, /SET status = 'released'/);
});

test('release function is server-only and runs after invitation acceptance', () => {
  assert.match(sql, /SECURITY DEFINER/);
  assert.match(sql, /SET search_path = ''/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.release_consented_provider_clinical_records\(\) FROM PUBLIC, anon, authenticated/);
  assert.match(sql, /AFTER UPDATE OF status ON public\.patient_access_invitations/);
});
