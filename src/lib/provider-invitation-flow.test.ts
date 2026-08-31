import assert from 'node:assert/strict';
import test from 'node:test';

import { getProviderInvitationStep } from './provider-invitation-flow.js';

test('invitation flow waits for session loading and then requires sign in', () => {
  assert.equal(getProviderInvitationStep({ loading: true, signedIn: false, emailVerified: false, hasVerifiedTotp: false, currentAal: null, accepted: false }), 'loading');
  assert.equal(getProviderInvitationStep({ loading: false, signedIn: false, emailVerified: false, hasVerifiedTotp: false, currentAal: null, accepted: false }), 'sign_in');
});

test('verified email is required before MFA enrollment', () => {
  assert.equal(getProviderInvitationStep({ loading: false, signedIn: true, emailVerified: false, hasVerifiedTotp: false, currentAal: 'aal1', accepted: false }), 'verify_email');
});

test('TOTP enrollment precedes an AAL2 challenge', () => {
  assert.equal(getProviderInvitationStep({ loading: false, signedIn: true, emailVerified: true, hasVerifiedTotp: false, currentAal: 'aal1', accepted: false }), 'enroll_mfa');
  assert.equal(getProviderInvitationStep({ loading: false, signedIn: true, emailVerified: true, hasVerifiedTotp: true, currentAal: 'aal1', accepted: false }), 'challenge_mfa');
});

test('only AAL2 sessions reach acceptance and accepted state wins', () => {
  assert.equal(getProviderInvitationStep({ loading: false, signedIn: true, emailVerified: true, hasVerifiedTotp: true, currentAal: 'aal2', accepted: false }), 'ready');
  assert.equal(getProviderInvitationStep({ loading: false, signedIn: true, emailVerified: true, hasVerifiedTotp: true, currentAal: 'aal2', accepted: true }), 'accepted');
});
