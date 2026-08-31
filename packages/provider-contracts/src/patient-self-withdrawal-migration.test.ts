import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sql = readFileSync(
  new URL('../../../supabase/migrations/20260829211500_withdraw_patient_provider_access.sql', import.meta.url),
  'utf8',
);

test('patient withdrawal verifies ownership inside the database transaction', () => {
  assert.match(sql, /consumer_principal_id\s*=\s*p_actor_principal_id/i);
  assert.match(sql, /status\s*=\s*'active'/i);
  assert.match(sql, /RAISE EXCEPTION 'active patient-owned connection required'/i);
});

test('patient withdrawal revokes grants, links, and accepted invitations and is service-only', () => {
  assert.match(sql, /UPDATE public\.provider_access_grants/i);
  assert.match(sql, /UPDATE public\.patient_identity_links/i);
  assert.match(sql, /UPDATE public\.patient_access_invitations/i);
  assert.match(sql, /'patient\.provider_access\.withdraw'/i);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.withdraw_patient_provider_access[\s\S]+FROM PUBLIC, anon, authenticated/i);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.withdraw_patient_provider_access[\s\S]+TO service_role/i);
});
