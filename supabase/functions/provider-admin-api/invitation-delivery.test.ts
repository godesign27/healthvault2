import assert from 'node:assert/strict';
import test from 'node:test';

import { createInvitationDeliveryPlan } from './invitation-delivery.js';

test('delivery normalizes email and creates an invitation-specific provider route', () => {
  assert.deepEqual(createInvitationDeliveryPlan({
    email: ' Invitee@Example.Test ',
    invitationId: '11111111-1111-4111-8111-111111111111',
    appUrl: 'https://healthvault.me/',
  }), {
    email: 'invitee@example.test',
    emailRedirectTo: 'https://healthvault.me/provider/invitations/11111111-1111-4111-8111-111111111111',
    shouldCreateUser: true,
  });
});

test('delivery permits localhost for review but rejects insecure remote and malformed base URLs', () => {
  assert.equal(createInvitationDeliveryPlan({ email: 'a@example.test', invitationId: '11111111-1111-4111-8111-111111111111', appUrl: 'http://localhost:5173' }).emailRedirectTo, 'http://localhost:5173/provider/invitations/11111111-1111-4111-8111-111111111111');
  assert.throws(() => createInvitationDeliveryPlan({ email: 'a@example.test', invitationId: '11111111-1111-4111-8111-111111111111', appUrl: 'http://example.com' }), /HTTPS/);
  assert.throws(() => createInvitationDeliveryPlan({ email: 'a@example.test', invitationId: '11111111-1111-4111-8111-111111111111', appUrl: 'not a url' }), /valid URL/);
});

test('delivery rejects invalid email and invitation identifiers', () => {
  assert.throws(() => createInvitationDeliveryPlan({ email: 'not-an-email', invitationId: '11111111-1111-4111-8111-111111111111', appUrl: 'https://healthvault.me' }), /email/);
  assert.throws(() => createInvitationDeliveryPlan({ email: 'a@example.test', invitationId: '../admin', appUrl: 'https://healthvault.me' }), /invitation/);
});
