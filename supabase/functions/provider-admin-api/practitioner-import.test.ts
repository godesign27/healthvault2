import assert from 'node:assert/strict';
import test from 'node:test';
import { validatePractitionerImport, validatePractitionerInvitationCancellation } from './practitioner-import.ts';

test('normalizes a bounded practitioner batch without verifying credentials', () => {
  assert.deepEqual(validatePractitionerImport([{ email: 'ADA@EXAMPLE.COM', display_name: 'Ada Lovelace', specialty: 'Primary Care', professional_identifier_type: 'NPI', professional_identifier_value: '1234567890' }]), [{ email: 'ada@example.com', display_name: 'Ada Lovelace', specialty: 'Primary Care', professional_identifier_type: 'npi', professional_identifier_value: '1234567890' }]);
});

test('practitioner invitation cancellation requires one bounded exact target', () => {
  const id = '11111111-1111-4111-8111-111111111111';
  assert.deepEqual(validatePractitionerInvitationCancellation({ invitationIds: [id] }), { invitationIds: [id] });
  assert.deepEqual(validatePractitionerInvitationCancellation({ sourceImportBatchId: id }), { sourceImportBatchId: id });
  assert.throws(() => validatePractitionerInvitationCancellation({ invitationIds: [id], sourceImportBatchId: id }), /not both/);
  assert.throws(() => validatePractitionerInvitationCancellation({}), /provide/);
});

test('rejects duplicate emails, partial identifiers, unknown fields, and oversized batches', () => {
  assert.throws(() => validatePractitionerImport([{ email: 'a@example.com', display_name: 'A' }, { email: 'A@example.com', display_name: 'B' }]), /duplicates/);
  assert.throws(() => validatePractitionerImport([{ email: 'a@example.com', display_name: 'A', professional_identifier_type: 'npi' }]), /identifier/);
  assert.throws(() => validatePractitionerImport([{ email: 'a@example.com', display_name: 'A', credential_status: 'verified' }]), /unsupported/);
  assert.throws(() => validatePractitionerImport(Array.from({ length: 2001 }, () => ({ email: 'a@example.com', display_name: 'A' }))), /2,000/);
});
