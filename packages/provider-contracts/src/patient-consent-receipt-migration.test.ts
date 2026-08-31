import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sql = readFileSync(new URL('../../../supabase/migrations/20260829220000_create_patient_access_consent_receipts.sql', import.meta.url), 'utf8');

test('accepted invitations atomically create a versioned synthetic consent receipt', () => {
  assert.match(sql, /CREATE TABLE public\.patient_access_consent_receipts/i);
  assert.match(sql, /AFTER UPDATE OF status ON public\.patient_access_invitations/i);
  assert.match(sql, /OLD\.status IS DISTINCT FROM 'accepted'[\s\S]+NEW\.status = 'accepted'/i);
  for (const field of ['invitation_id', 'provider_patient_identity_id', 'consumer_principal_id', 'scope', 'purpose', 'consent_version', 'effective_at', 'expires_at', 'evidence_type', 'synthetic', 'request_id']) assert.match(sql, new RegExp(field, 'i'));
});

test('consent receipts are append-only and unavailable to direct browser table access', () => {
  assert.match(sql, /ENABLE ROW LEVEL SECURITY/i);
  assert.match(sql, /REVOKE ALL ON public\.patient_access_consent_receipts FROM PUBLIC, anon, authenticated/i);
  assert.match(sql, /BEFORE UPDATE OR DELETE ON public\.patient_access_consent_receipts/i);
  assert.match(sql, /consent receipts are append-only/i);
});
