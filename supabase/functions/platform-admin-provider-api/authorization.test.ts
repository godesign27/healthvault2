import assert from 'node:assert/strict';
import test from 'node:test';

import { authorizePatientAccessIntervention, authorizePlatformProviderAction, hasRecentAal2 } from './authorization.js';

const owner = { roleKey: 'platform_owner', permissions: [] as string[] };
const reader = { roleKey: 'support', permissions: ['providers.read'] };
const manager = { roleKey: 'support', permissions: ['providers.manage'] };

test('platform owner may read and manage provider operations', () => {
  assert.equal(authorizePlatformProviderAction([owner], 'read').allowed, true);
  assert.equal(authorizePlatformProviderAction([owner], 'manage').allowed, true);
});

test('provider read and manage permissions are distinct', () => {
  assert.equal(authorizePlatformProviderAction([reader], 'read').allowed, true);
  assert.equal(authorizePlatformProviderAction([reader], 'manage').allowed, false);
  assert.equal(authorizePlatformProviderAction([manager], 'read').allowed, true);
  assert.equal(authorizePlatformProviderAction([manager], 'manage').allowed, true);
});

test('missing or irrelevant assignments fail closed', () => {
  assert.equal(authorizePlatformProviderAction([], 'read').allowed, false);
  assert.equal(authorizePlatformProviderAction([{ roleKey: 'product', permissions: ['analytics.read'] }], 'read').allowed, false);
});

test('recent AAL2 rejects stale, future, and lower-assurance sessions', () => {
  const now = new Date('2026-08-29T20:00:00Z');
  assert.equal(hasRecentAal2({ aal: 'aal2', authenticatedAt: '2026-08-29T19:50:00Z' }, now), true);
  assert.equal(hasRecentAal2({ aal: 'aal2', authenticatedAt: '2026-08-28T21:00:00Z' }, now), true);
  assert.equal(hasRecentAal2({ aal: 'aal2', authenticatedAt: '2026-08-28T19:59:59Z' }, now), false);
  assert.equal(hasRecentAal2({ aal: 'aal1', authenticatedAt: '2026-08-29T19:59:00Z' }, now), false);
  assert.equal(hasRecentAal2({ aal: 'aal2', authenticatedAt: '2026-08-29T20:01:00Z' }, now), false);
});

test('patient access intervention is reserved for the normalized platform owner role', () => {
  assert.equal(authorizePatientAccessIntervention([owner]).allowed, true);
  assert.equal(authorizePatientAccessIntervention([manager]).allowed, false);
  assert.equal(authorizePatientAccessIntervention([{ roleKey: 'security_privacy', permissions: ['providers.manage'] }]).allowed, false);
  assert.equal(authorizePatientAccessIntervention([]).allowed, false);
});
