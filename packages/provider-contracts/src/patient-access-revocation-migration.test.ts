import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(new URL('../../../supabase/migrations/20260829210000_revoke_provider_patient_access.sql', import.meta.url), 'utf8');

test('patient access revocation atomically revokes grants, links, and accepted invitations', () => {
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.revoke_provider_patient_access/);
  assert.match(migration, /UPDATE public\.provider_access_grants[\s\S]*status = 'revoked'/);
  assert.match(migration, /UPDATE public\.patient_identity_links[\s\S]*status = 'revoked'/);
  assert.match(migration, /UPDATE public\.patient_access_invitations[\s\S]*status = 'revoked'/);
  assert.match(migration, /INSERT INTO public\.admin_audit_events/);
});

test('revocation RPC is service-only and uses an empty search path', () => {
  assert.match(migration, /SECURITY DEFINER[\s\S]*SET search_path = ''/);
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.revoke_provider_patient_access[\s\S]*FROM PUBLIC, anon, authenticated/);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.revoke_provider_patient_access[\s\S]*TO service_role/);
});
