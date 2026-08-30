import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(
  new URL(
    '../../../supabase/migrations/20260830003923_quarantine_legacy_provider_records.sql',
    import.meta.url,
  ),
  'utf8',
);

test('legacy organizations are mapped only to draft provider accounts', () => {
  assert.match(migration, /INSERT INTO public\.provider_accounts/);
  assert.match(migration, /'draft'/);
  assert.match(migration, /ON CONFLICT \(legacy_organization_id\) DO NOTHING/);
});

test('legacy administrators cannot receive active canonical access', () => {
  assert.match(migration, /INSERT INTO public\.provider_memberships/);
  assert.match(migration, /'suspended'/);
  assert.match(migration, /ARRAY\[\]::text\[\]/);
  assert.doesNotMatch(migration, /'practitioner'/);
});

test('legacy patients are quarantined without inferred identity or consent', () => {
  assert.match(migration, /INSERT INTO public\.provider_patient_identities/);
  assert.match(migration, /'legacy_organization_patient'/);
  assert.match(migration, /'quarantined'/);
  assert.doesNotMatch(migration, /INSERT INTO public\.patient_identity_links/);
  assert.doesNotMatch(migration, /INSERT INTO public\.provider_access_grants/);
  assert.doesNotMatch(migration, /INSERT INTO public\.practitioner_patient_assignments/);
});
