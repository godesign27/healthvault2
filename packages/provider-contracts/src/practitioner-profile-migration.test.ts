import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(new URL('../../../supabase/migrations/20260829193727_create_practitioner_profile_on_membership.sql', import.meta.url), 'utf8');
const syncMigration = readFileSync(new URL('../../../supabase/migrations/20260829200200_sync_practitioner_profile_status.sql', import.meta.url), 'utf8');

test('practitioner memberships create an unverified profile and never self-verify', () => {
  assert.match(migration, /'practitioner' = ANY \(NEW\.roles\)/);
  assert.match(migration, /credential_status[^;]*'unverified'/s);
  assert.doesNotMatch(migration, /credential_status[^;]*'verified'/s);
});

test('practitioner profile status follows membership status and role removal without changing credentials', () => {
  assert.match(syncMigration, /UPDATE OF roles, status/);
  assert.match(syncMigration, /credential_status = public\.practitioner_profiles\.credential_status/);
  assert.match(syncMigration, /IF NOT \('practitioner' = ANY \(NEW\.roles\)\)/);
  assert.match(syncMigration, /SET status = 'inactive'/);
});

test('profile creation is idempotent and covers existing practitioner memberships', () => {
  assert.match(migration, /ON CONFLICT \(membership_id\) DO NOTHING/);
  assert.match(migration, /INSERT INTO public\.practitioner_profiles[\s\S]*FROM public\.provider_memberships/);
});
