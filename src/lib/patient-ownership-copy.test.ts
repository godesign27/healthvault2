import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = readFileSync(new URL('../pages/PatientAccessInvitationPage.tsx', import.meta.url), 'utf8');
const builder = readFileSync(new URL('../../supabase/functions/provider-admin-api/patient-access.ts', import.meta.url), 'utf8');
const api = readFileSync(new URL('../../supabase/functions/provider-admin-api/index.ts', import.meta.url), 'utf8');

test('patient invitation clearly explains durable patient ownership and provider limits', () => {
  assert.match(page, /Your Health Vault profile belongs to you/i);
  assert.match(page, /one secure, organized health profile that grows with you/i);
  assert.match(page, /instead of starting from scratch with every future visit/i);
  assert.match(page, /provider cannot revoke, take over, or delete your Health Vault profile/i);
  assert.match(page, /for as long as you keep your Health Vault account/i);
  assert.match(page, /You can stop future provider access/i);
});

test('clinical import consent uses synthetic consent version v3 everywhere', () => {
  assert.match(builder, /health-vault-synthetic-pilot-access-v3/);
  assert.match(api, /PATIENT_ACCESS_CONSENT_VERSION/);
  assert.match(builder, /clinical\.imported_records/);
  assert.match(api, /PATIENT_ACCESS_SCOPE/);
  assert.doesNotMatch(builder, /health-vault-synthetic-pilot-access-v1/);
  assert.doesNotMatch(api, /health-vault-synthetic-pilot-access-v1/);
});

test('patient explicitly approves importing provider-supplied clinical information', () => {
  assert.match(page, /approve importing the listed provider-supplied profile and clinical information/i);
  assert.match(page, /accepted information remain under my control/i);
});

test('an invited-email mismatch offers a safe account switch instead of a generic edge error', () => {
  assert.match(page, /invited_email_required/);
  assert.match(page, /Switch to the invited patient account/);
  assert.match(page, /Sign out and switch account/);
  assert.match(page, /only the invited patient account can review or accept it/);
});

test('the invitation shows server-derived package stats and routes acceptance to the dashboard', () => {
  assert.match(page, /Your provider has information ready/);
  assert.match(page, /Health records/);
  assert.match(page, /provider has not included clinical records in this invitation yet/);
  assert.match(page, /window\.location\.assign\('\/dashboard'\)/);
  assert.doesNotMatch(page, /window\.location\.href = '\/connected-providers'/);
});
