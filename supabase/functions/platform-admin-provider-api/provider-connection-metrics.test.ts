import assert from 'node:assert/strict';
import test from 'node:test';

import { countActiveProviderConnections } from './provider-connection-metrics.js';

const providerId = '11111111-1111-4111-8111-111111111111';
const patientId = '22222222-2222-4222-8222-222222222222';
const consumerId = '33333333-3333-4333-8333-333333333333';
const now = new Date('2026-08-29T22:00:00Z');

test('active connection metrics require matching patient, link, consumer, and unexpired grant', () => {
  const counts = countActiveProviderConnections({
    patients: [{ id: patientId, providerAccountId: providerId, status: 'active' }],
    links: [{ patientId, consumerPrincipalId: consumerId, status: 'active' }],
    grants: [{ patientId, consumerPrincipalId: consumerId, status: 'active', effectiveAt: '2026-08-29T21:00:00Z', expiresAt: '2026-08-30T22:00:00Z' }],
  }, now);
  assert.equal(counts.get(providerId), 1);
});

test('mismatched, expired, future, revoked, and duplicate rows do not inflate connection metrics', () => {
  const counts = countActiveProviderConnections({
    patients: [{ id: patientId, providerAccountId: providerId, status: 'active' }],
    links: [{ patientId, consumerPrincipalId: consumerId, status: 'active' }],
    grants: [
      { patientId, consumerPrincipalId: 'other', status: 'active', effectiveAt: null, expiresAt: null },
      { patientId, consumerPrincipalId: consumerId, status: 'active', effectiveAt: null, expiresAt: '2026-08-29T21:59:59Z' },
      { patientId, consumerPrincipalId: consumerId, status: 'active', effectiveAt: '2026-08-29T22:00:01Z', expiresAt: null },
      { patientId, consumerPrincipalId: consumerId, status: 'revoked', effectiveAt: null, expiresAt: null },
    ],
  }, now);
  assert.equal(counts.get(providerId) ?? 0, 0);
});
