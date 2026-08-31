import assert from 'node:assert/strict';
import test from 'node:test';

import { authorizeInvitationAcceptance, authorizeInvitationPreview } from './invitation-authorization.js';

const pendingInvitation = {
  status: 'pending',
  email: 'invitee@example.test',
  expiresAt: '2026-09-05T18:00:00.000Z',
  roles: ['practitioner'],
};

test('acceptance requires a verified identity with a matching normalized email', () => {
  assert.equal(authorizeInvitationAcceptance({ invitation: pendingInvitation, userEmail: null, emailVerified: false, hasVerifiedTotp: true, aal: 'aal2', now: new Date('2026-08-29T18:00:00.000Z') }).code, 'verified_email_required');
  assert.equal(authorizeInvitationAcceptance({ invitation: pendingInvitation, userEmail: 'other@example.test', emailVerified: true, hasVerifiedTotp: true, aal: 'aal2', now: new Date('2026-08-29T18:00:00.000Z') }).code, 'email_mismatch');
  assert.equal(authorizeInvitationAcceptance({ invitation: pendingInvitation, userEmail: ' Invitee@Example.Test ', emailVerified: true, hasVerifiedTotp: true, aal: 'aal2', now: new Date('2026-08-29T18:00:00.000Z') }).allowed, true);
});

test('acceptance requires enrolled TOTP and an AAL2 session', () => {
  assert.equal(authorizeInvitationAcceptance({ invitation: pendingInvitation, userEmail: pendingInvitation.email, emailVerified: true, hasVerifiedTotp: false, aal: 'aal1', now: new Date('2026-08-29T18:00:00.000Z') }).code, 'mfa_enrollment_required');
  assert.equal(authorizeInvitationAcceptance({ invitation: pendingInvitation, userEmail: pendingInvitation.email, emailVerified: true, hasVerifiedTotp: true, aal: 'aal1', now: new Date('2026-08-29T18:00:00.000Z') }).code, 'mfa_challenge_required');
});

test('revoked, accepted, and expired invitations fail closed', () => {
  assert.equal(authorizeInvitationAcceptance({ invitation: { ...pendingInvitation, status: 'revoked' }, userEmail: pendingInvitation.email, emailVerified: true, hasVerifiedTotp: true, aal: 'aal2', now: new Date('2026-08-29T18:00:00.000Z') }).code, 'invitation_unavailable');
  assert.equal(authorizeInvitationAcceptance({ invitation: { ...pendingInvitation, status: 'accepted' }, userEmail: pendingInvitation.email, emailVerified: true, hasVerifiedTotp: true, aal: 'aal2', now: new Date('2026-08-29T18:00:00.000Z') }).code, 'invitation_unavailable');
  assert.equal(authorizeInvitationAcceptance({ invitation: { ...pendingInvitation, expiresAt: '2026-08-29T17:59:59.000Z' }, userEmail: pendingInvitation.email, emailVerified: true, hasVerifiedTotp: true, aal: 'aal2', now: new Date('2026-08-29T18:00:00.000Z') }).code, 'invitation_expired');
});

test('unknown or empty invitation roles fail closed', () => {
  assert.equal(authorizeInvitationAcceptance({ invitation: { ...pendingInvitation, roles: [] }, userEmail: pendingInvitation.email, emailVerified: true, hasVerifiedTotp: true, aal: 'aal2', now: new Date('2026-08-29T18:00:00.000Z') }).code, 'invalid_invitation_roles');
  assert.equal(authorizeInvitationAcceptance({ invitation: { ...pendingInvitation, roles: ['platform_owner'] }, userEmail: pendingInvitation.email, emailVerified: true, hasVerifiedTotp: true, aal: 'aal2', now: new Date('2026-08-29T18:00:00.000Z') }).code, 'invalid_invitation_roles');
});

test('preview requires a verified matching email but does not require completed MFA', () => {
  assert.equal(authorizeInvitationPreview({ invitation: pendingInvitation, userEmail: pendingInvitation.email, emailVerified: true, now: new Date('2026-08-29T18:00:00.000Z') }).allowed, true);
  assert.equal(authorizeInvitationPreview({ invitation: pendingInvitation, userEmail: 'other@example.test', emailVerified: true, now: new Date('2026-08-29T18:00:00.000Z') }).code, 'email_mismatch');
  assert.equal(authorizeInvitationPreview({ invitation: { ...pendingInvitation, status: 'accepted' }, userEmail: pendingInvitation.email, emailVerified: true, now: new Date('2026-08-29T18:00:00.000Z') }).code, 'invitation_unavailable');
});
