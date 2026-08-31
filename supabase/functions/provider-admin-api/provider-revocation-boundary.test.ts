import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const providerApi = readFileSync(new URL('./index.ts', import.meta.url), 'utf8');
const providerUi = readFileSync(new URL('../../../src/components/provider/PatientAccessInvitationsPanel.tsx', import.meta.url), 'utf8');

test('provider surfaces cannot revoke patient-owned access', () => {
  assert.doesNotMatch(providerApi, /body\.action === "revoke-patient-access"/);
  assert.doesNotMatch(providerUi, /Revoke access/);
  assert.doesNotMatch(providerUi, /revoke-patient-access/);
});
