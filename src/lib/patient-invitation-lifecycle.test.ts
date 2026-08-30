import assert from 'node:assert/strict';
import test from 'node:test';

import { selectCurrentPatientInvitations } from './patient-invitation-lifecycle.js';

const patientId = '11111111-1111-4111-8111-111111111111';

test('current invitation selection keeps the newest lifecycle record regardless of input order', () => {
  const oldInvitation = { id: 'old', provider_patient_identity_id: patientId, created_at: '2026-08-01T00:00:00Z' };
  const newInvitation = { id: 'new', provider_patient_identity_id: patientId, created_at: '2026-08-29T00:00:00Z' };
  assert.equal(selectCurrentPatientInvitations([newInvitation, oldInvitation]).get(patientId)?.id, 'new');
  assert.equal(selectCurrentPatientInvitations([oldInvitation, newInvitation]).get(patientId)?.id, 'new');
});

test('current invitation selection safely ignores malformed lifecycle entries', () => {
  const result = selectCurrentPatientInvitations([
    { id: 'missing-patient', provider_patient_identity_id: '', created_at: '2026-08-29T00:00:00Z' },
    { id: 'invalid-date', provider_patient_identity_id: patientId, created_at: 'not-a-date' },
  ]);
  assert.equal(result.size, 0);
});
