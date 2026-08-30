import assert from 'node:assert/strict';
import test from 'node:test';

import { buildSyntheticPatientAccessInvitation, normalizePatientInvitationSelection } from './patient-access.ts';

const patientIdentityId = '22222222-2222-4222-8222-222222222222';

test('synthetic pilot invitations have explicit demographics and clinical scope with bounded consent version', () => {
  assert.deepEqual(buildSyntheticPatientAccessInvitation({ patientIdentityId, email: ' Demo.Patient@Example.Test ' }), {
    patientIdentityId, email: 'demo.patient@example.test', scope: ['roster.demographics', 'clinical.imported_records'], purpose: 'care_coordination',
    consentVersion: 'health-vault-synthetic-pilot-access-v3', synthetic: true,
  });
});

test('bulk selection supports bounded explicit patients or a server-side all-eligible mode', () => {
  assert.deepEqual(normalizePatientInvitationSelection({ patientIdentityIds: [patientIdentityId, patientIdentityId] }), { inviteAllEligible: false, patientIdentityIds: [patientIdentityId] });
  assert.deepEqual(normalizePatientInvitationSelection({ inviteAllEligible: true }), { inviteAllEligible: true, patientIdentityIds: [] });
  assert.throws(() => normalizePatientInvitationSelection({ patientIdentityIds: [] }), /between 1 and 500/);
});

test('patient access invitations reject malformed identifiers and emails', () => {
  assert.throws(() => buildSyntheticPatientAccessInvitation({ patientIdentityId: 'bad', email: 'patient@example.test' }), /patientIdentityId/);
  assert.throws(() => buildSyntheticPatientAccessInvitation({ patientIdentityId, email: 'bad' }), /email/);
});
