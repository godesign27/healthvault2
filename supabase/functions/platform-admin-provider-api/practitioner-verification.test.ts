import assert from 'node:assert/strict';
import test from 'node:test';

import { validateBulkPractitionerVerification, validatePractitionerVerification } from './practitioner-verification.ts';

const practitionerProfileId = '11111111-1111-4111-8111-111111111111';

test('verified credentials require a bounded evidence reference', () => {
  assert.deepEqual(validatePractitionerVerification({ practitionerProfileId, credentialStatus: 'verified', evidenceRef: 'npi-registry:1234567890', reason: 'Matched name and organization.' }), {
    practitionerProfileId, credentialStatus: 'verified', evidenceRef: 'npi-registry:1234567890', reason: 'Matched name and organization.',
  });
  assert.throws(() => validatePractitionerVerification({ practitionerProfileId, credentialStatus: 'verified' }), /evidenceRef/);
});

test('rejection requires a review reason and unsupported statuses fail closed', () => {
  assert.throws(() => validatePractitionerVerification({ practitionerProfileId, credentialStatus: 'rejected', evidenceRef: 'manual-review:1' }), /reason/);
  assert.throws(() => validatePractitionerVerification({ practitionerProfileId, credentialStatus: 'unverified', evidenceRef: 'manual-review:1' }), /credentialStatus/);
});

test('malformed ids and overlong review fields are rejected', () => {
  assert.throws(() => validatePractitionerVerification({ practitionerProfileId: 'bad', credentialStatus: 'pending' }), /practitionerProfileId/);
  assert.throws(() => validatePractitionerVerification({ practitionerProfileId, credentialStatus: 'pending', reason: 'x'.repeat(1001) }), /reason/);
});

test('bulk credential review accepts unique bounded profiles and keeps evidence requirements', () => {
  const secondId = '22222222-2222-4222-8222-222222222222';
  assert.deepEqual(validateBulkPractitionerVerification({ practitionerProfileIds: [practitionerProfileId, secondId], credentialStatus: 'verified', evidenceRef: 'npi-batch:2026-08-29', reason: 'Registry batch review.' }), {
    practitionerProfileIds: [practitionerProfileId, secondId], credentialStatus: 'verified', evidenceRef: 'npi-batch:2026-08-29', reason: 'Registry batch review.',
  });
  assert.throws(() => validateBulkPractitionerVerification({ practitionerProfileIds: [practitionerProfileId, practitionerProfileId], credentialStatus: 'pending' }), /unique/);
  assert.throws(() => validateBulkPractitionerVerification({ practitionerProfileIds: [], credentialStatus: 'verified', evidenceRef: 'x' }), /1 to 500/);
});
