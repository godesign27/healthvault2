import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sql = readFileSync(new URL('../../../supabase/migrations/20260829213000_normalize_super_admin_patient_access_audit.sql', import.meta.url), 'utf8');

test('super-admin patient access termination has distinct immutable provenance', () => {
  assert.match(sql, /patient\.provider_access\.super_admin_terminate/);
  assert.match(sql, /'source', 'platform-admin-provider-api'/);
  assert.match(sql, /'actorType', 'health_vault_super_admin'/);
  assert.match(sql, /p_reason, 'succeeded', p_request_id/);
});

test('super-admin termination primitive remains service-only', () => {
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.revoke_provider_patient_access[\s\S]+FROM PUBLIC, anon, authenticated/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.revoke_provider_patient_access[\s\S]+TO service_role/);
});
