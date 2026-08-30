import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveAccessiblePractitionerPatientIds } from './practitioner-patients.ts';

const patientId = '11111111-1111-4111-8111-111111111111';
const principalId = '22222222-2222-4222-8222-222222222222';

test('practitioner patient resolution requires assignment, active identity link, and matching active grant', () => {
  assert.deepEqual(resolveAccessiblePractitionerPatientIds({
    assignments: [{ patientId, status: 'active', expiresAt: null }],
    identityLinks: [{ patientId, consumerPrincipalId: principalId, status: 'active' }],
    grants: [{ patientId, consumerPrincipalId: principalId, status: 'active', expiresAt: null }],
  }), [patientId]);
});

test('mismatched principals, expired grants, and revoked assignments fail closed', () => {
  assert.deepEqual(resolveAccessiblePractitionerPatientIds({
    assignments: [{ patientId, status: 'revoked', expiresAt: null }],
    identityLinks: [{ patientId, consumerPrincipalId: principalId, status: 'active' }],
    grants: [{ patientId, consumerPrincipalId: '33333333-3333-4333-8333-333333333333', status: 'active', expiresAt: '2025-01-01T00:00:00Z' }],
  }, new Date('2026-01-01T00:00:00Z')), []);
});
