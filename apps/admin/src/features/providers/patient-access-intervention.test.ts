import assert from 'node:assert/strict';
import test from 'node:test';

import { validatePatientAccessIntervention } from './patient-access-intervention.js';

const patientId = '11111111-1111-4111-8111-111111111111';
const providerId = '22222222-2222-4222-8222-222222222222';

test('super-admin intervention requires exact identifiers and a bounded reason', () => {
  assert.deepEqual(validatePatientAccessIntervention({ providerPatientIdentityId: patientId, providerAccountId: providerId, reason: ' Patient safety escalation ' }), {
    providerPatientIdentityId: patientId,
    providerAccountId: providerId,
    reason: 'Patient safety escalation',
  });
});

test('missing reason and malformed identifiers fail closed', () => {
  assert.throws(() => validatePatientAccessIntervention({ providerPatientIdentityId: patientId, providerAccountId: providerId, reason: ' ' }), /reason is required/i);
  assert.throws(() => validatePatientAccessIntervention({ providerPatientIdentityId: 'all', providerAccountId: providerId, reason: 'test' }), /valid patient connection/i);
  assert.throws(() => validatePatientAccessIntervention({ providerPatientIdentityId: patientId, providerAccountId: providerId, reason: 'x'.repeat(501) }), /500 characters/i);
});
