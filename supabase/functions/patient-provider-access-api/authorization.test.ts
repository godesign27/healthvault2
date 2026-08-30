import assert from 'node:assert/strict';
import test from 'node:test';

import { authorizePatientProviderRevocation } from './authorization.ts';

const userId = '11111111-1111-4111-8111-111111111111';

test('a patient may revoke only their own active provider identity link', () => {
  assert.deepEqual(authorizePatientProviderRevocation({ currentUserId: userId, linkConsumerPrincipalId: userId, linkStatus: 'active', grantStatus: 'active' }), { allowed: true });
});

test('another identity, inactive link, or inactive grant fails closed', () => {
  assert.equal(authorizePatientProviderRevocation({ currentUserId: userId, linkConsumerPrincipalId: '22222222-2222-4222-8222-222222222222', linkStatus: 'active', grantStatus: 'active' }).allowed, false);
  assert.equal(authorizePatientProviderRevocation({ currentUserId: userId, linkConsumerPrincipalId: userId, linkStatus: 'revoked', grantStatus: 'active' }).allowed, false);
  assert.equal(authorizePatientProviderRevocation({ currentUserId: userId, linkConsumerPrincipalId: userId, linkStatus: 'active', grantStatus: 'expired' }).allowed, false);
});
