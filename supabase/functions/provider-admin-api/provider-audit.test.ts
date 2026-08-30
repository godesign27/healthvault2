import assert from 'node:assert/strict';
import test from 'node:test';

import { sanitizeProviderAuditEvent } from './provider-audit.ts';

test('provider audit serialization exposes operational evidence without metadata payloads', () => {
  assert.deepEqual(sanitizeProviderAuditEvent({
    id: '11111111-1111-4111-8111-111111111111', occurred_at: '2026-08-29T00:00:00Z', action: 'patient.access.revoke',
    target_type: 'provider_patient_identity', target_ref: 'patient-ref', outcome: 'succeeded', reason: 'Requested by provider',
    request_id: 'request-1', actor_principal_id: '22222222-2222-4222-8222-222222222222', metadata: { secret: 'never return' },
  }), {
    id: '11111111-1111-4111-8111-111111111111', occurredAt: '2026-08-29T00:00:00Z', action: 'patient.access.revoke',
    targetType: 'provider_patient_identity', targetRef: 'patient-ref', outcome: 'succeeded', reason: 'Requested by provider',
    requestId: 'request-1', actorPrincipalId: '22222222-2222-4222-8222-222222222222',
  });
});

test('provider audit serialization bounds untrusted free text', () => {
  const event = sanitizeProviderAuditEvent({ id: '1', occurred_at: 'bad', action: 'x'.repeat(400), target_type: null, target_ref: null, outcome: 'failed', reason: 'r'.repeat(1000), request_id: null, actor_principal_id: null });
  assert.equal(event.action.length, 160);
  assert.equal(event.reason?.length, 500);
});
