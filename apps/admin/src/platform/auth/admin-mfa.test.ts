import assert from 'node:assert/strict';
import test from 'node:test';

import { getAdminMfaStep, hasRecentTotpInAccessToken } from './admin-mfa.js';

test('assurance state remains checking while Supabase security state loads', () => {
  assert.equal(getAdminMfaStep({ loading: true, hasVerifiedTotp: false, currentAal: null, hasRecentTotp: false }), 'checking');
});

test('an administrator without a verified factor must enroll', () => {
  assert.equal(getAdminMfaStep({ loading: false, hasVerifiedTotp: false, currentAal: 'aal1', hasRecentTotp: false }), 'enroll');
});

test('a verified factor at AAL1 requires a challenge', () => {
  assert.equal(getAdminMfaStep({ loading: false, hasVerifiedTotp: true, currentAal: 'aal1', hasRecentTotp: false }), 'challenge');
});

test('only recent TOTP at AAL2 enables privileged admin actions', () => {
  assert.equal(getAdminMfaStep({ loading: false, hasVerifiedTotp: true, currentAal: 'aal2', hasRecentTotp: true }), 'verified');
  assert.equal(getAdminMfaStep({ loading: false, hasVerifiedTotp: true, currentAal: 'aal2', hasRecentTotp: false }), 'challenge');
});

test('recent TOTP is derived from the signed access token AMR timestamp', () => {
  const now = new Date('2026-08-29T20:00:00Z');
  const token = `x.${Buffer.from(JSON.stringify({ aal: 'aal2', amr: [{ method: 'totp', timestamp: Math.floor(new Date('2026-08-29T19:55:00Z').getTime() / 1000) }] })).toString('base64url')}.x`;
  assert.equal(hasRecentTotpInAccessToken(token, now), true);
  assert.equal(hasRecentTotpInAccessToken(token, new Date('2026-08-30T19:55:00Z')), true);
  assert.equal(hasRecentTotpInAccessToken(token, new Date('2026-08-30T19:55:01Z')), false);
});
