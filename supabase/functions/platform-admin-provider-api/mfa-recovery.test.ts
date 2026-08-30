import assert from 'node:assert/strict';
import test from 'node:test';
import { validateMfaRecoveryLookup, validateMfaRecoveryReset } from './mfa-recovery.ts';

test('MFA recovery lookup requires an exact normalized email', () => {
  assert.deepEqual(validateMfaRecoveryLookup({ email: ' Demo@Example.COM ' }), { email: 'demo@example.com' });
  assert.throws(() => validateMfaRecoveryLookup({ email: 'demo' }), /valid exact email/);
});

test('MFA reset requires exact identity confirmation and a bounded reason', () => {
  const input = { userId: '11111111-1111-4111-8111-111111111111', email: 'demo@example.com', confirmEmail: 'DEMO@example.com', reason: 'Lost authenticator was identity verified by support.' };
  assert.deepEqual(validateMfaRecoveryReset(input), { userId: input.userId, email: input.email, reason: input.reason });
  assert.throws(() => validateMfaRecoveryReset({ ...input, confirmEmail: 'other@example.com' }), /exactly match/);
  assert.throws(() => validateMfaRecoveryReset({ ...input, reason: 'short' }), /between 10 and 500/);
});
