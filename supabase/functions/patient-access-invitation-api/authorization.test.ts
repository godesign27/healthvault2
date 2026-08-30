import assert from 'node:assert/strict';
import test from 'node:test';

import { authorizePatientInvitationPreview } from './authorization.ts';

const invitation = { status: 'pending', email: 'patient@example.test', expiresAt: '2026-08-30T00:00:00Z', synthetic: true };

test('preview requires a verified matching email and pending synthetic invitation', () => {
  assert.equal(authorizePatientInvitationPreview({ invitation, userEmail: 'PATIENT@example.test', emailVerified: true }, new Date('2026-08-29T20:00:00Z')).allowed, true);
  assert.equal(authorizePatientInvitationPreview({ invitation, userEmail: 'other@example.test', emailVerified: true }, new Date('2026-08-29T20:00:00Z')).allowed, false);
  assert.equal(authorizePatientInvitationPreview({ invitation, userEmail: 'patient@example.test', emailVerified: false }, new Date('2026-08-29T20:00:00Z')).allowed, false);
});

test('expired, completed, or non-synthetic invitations fail closed', () => {
  assert.equal(authorizePatientInvitationPreview({ invitation, userEmail: invitation.email, emailVerified: true }, new Date('2026-08-31T00:00:00Z')).allowed, false);
  assert.equal(authorizePatientInvitationPreview({ invitation: { ...invitation, status: 'accepted' }, userEmail: invitation.email, emailVerified: true }).allowed, false);
  assert.equal(authorizePatientInvitationPreview({ invitation: { ...invitation, synthetic: false }, userEmail: invitation.email, emailVerified: true }).allowed, false);
});
