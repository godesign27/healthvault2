import assert from 'node:assert/strict';
import test from 'node:test';

import { buildDigestDeliveryJobs } from './patient-access-delivery.ts';

test('delivery planning deduplicates shared recipients into one digest job', () => {
  const jobs = buildDigestDeliveryJobs([
    { id: '11111111-1111-4111-8111-111111111111', email: ' Demo@Example.com ' },
    { id: '22222222-2222-4222-8222-222222222222', email: 'demo@example.com' },
  ]);
  assert.deepEqual(jobs, [{ recipientEmail: 'demo@example.com', invitationIds: ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222'], invitationCount: 2 }]);
});

test('delivery planning rejects invalid invitation identifiers and email addresses', () => {
  assert.throws(() => buildDigestDeliveryJobs([{ id: 'bad', email: 'demo@example.com' }]), /invitation id/);
  assert.throws(() => buildDigestDeliveryJobs([{ id: '11111111-1111-4111-8111-111111111111', email: 'bad' }]), /email/);
});
