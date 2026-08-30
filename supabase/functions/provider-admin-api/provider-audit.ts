const bounded = (value: unknown, max: number) => typeof value === 'string' ? value.slice(0, max) : null;

export function sanitizeProviderAuditEvent(row: Record<string, unknown>) {
  return {
    id: String(row.id ?? ''),
    occurredAt: String(row.occurred_at ?? ''),
    action: String(row.action ?? '').slice(0, 160),
    targetType: bounded(row.target_type, 120),
    targetRef: bounded(row.target_ref, 200),
    outcome: String(row.outcome ?? 'unknown').slice(0, 40),
    reason: bounded(row.reason, 500),
    requestId: bounded(row.request_id, 200),
    actorPrincipalId: bounded(row.actor_principal_id, 36),
  };
}
