import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(new URL('../../../supabase/migrations/20260829200012_create_synthetic_patient_access_invitations.sql', import.meta.url), 'utf8');

test('patient acceptance atomically creates both identity link and scoped access grant', () => {
  assert.match(migration, /INSERT INTO public\.patient_identity_links/);
  assert.match(migration, /INSERT INTO public\.provider_access_grants/);
  assert.match(migration, /status = 'accepted'/);
});

test('acceptance validates signed-in verified email and pending unexpired invitation', () => {
  assert.match(migration, /auth\.uid\(\)/);
  assert.match(migration, /email_confirmed_at IS NULL/);
  assert.match(migration, /lower\(current_email\) <> lower\(invitation\.email\)/);
  assert.match(migration, /invitation\.expires_at <= now\(\)/);
});

test('the security-definer response function is not public or anonymous', () => {
  assert.match(migration, /SECURITY DEFINER[\s\S]*SET search_path = ''/);
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.respond_patient_access_invitation[\s\S]*FROM PUBLIC, anon/);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.respond_patient_access_invitation[\s\S]*TO authenticated/);
});

test('practitioner access requires an active identity link matching the access grant principal', () => {
  assert.match(migration, /JOIN public\.patient_identity_links identity_link/);
  assert.match(migration, /identity_link\.status = 'active'/);
  assert.match(migration, /access_grant\.consumer_principal_id = identity_link\.consumer_principal_id/);
});
