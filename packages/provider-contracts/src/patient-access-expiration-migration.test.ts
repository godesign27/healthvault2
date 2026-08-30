import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sql = readFileSync(new URL('../../../supabase/migrations/20260829214500_reconcile_patient_access_expiration.sql', import.meta.url), 'utf8');

test('reconciliation expires elapsed grants and invitation lifecycles without revoking identity links', () => {
  assert.match(sql, /UPDATE public\.provider_access_grants[\s\S]+SET status = 'expired'[\s\S]+expires_at <= now\(\)/i);
  assert.match(sql, /UPDATE public\.patient_access_invitations[\s\S]+status = 'expired'[\s\S]+access_expires_at <= now\(\)/i);
  assert.doesNotMatch(sql, /UPDATE public\.patient_identity_links[\s\S]+status = '(?:revoked|expired)'/i);
});

test('renewed consent reuses only the same patient-owned active identity link', () => {
  assert.match(sql, /consumer_principal_id = current_user_id[\s\S]+status = 'active'/i);
  assert.match(sql, /active identity belongs to another patient account/i);
  assert.match(sql, /IF link_id IS NULL THEN[\s\S]+INSERT INTO public\.patient_identity_links/i);
});

test('lifecycle reconciliation is service-only and audited when state changes', () => {
  assert.match(sql, /patient\.access\.expiration\.reconcile/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.reconcile_patient_access_expiration[\s\S]+FROM PUBLIC, anon, authenticated/i);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.reconcile_patient_access_expiration[\s\S]+TO service_role/i);
});
