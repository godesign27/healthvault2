interface ConnectionMetricInput {
  patients: ReadonlyArray<{ id: string; providerAccountId: string; status: string }>;
  links: ReadonlyArray<{ patientId: string; consumerPrincipalId: string | null; status: string }>;
  grants: ReadonlyArray<{ patientId: string; consumerPrincipalId: string | null; status: string; effectiveAt: string | null; expiresAt: string | null }>;
}

function validBoundary(value: string | null, comparison: (timestamp: number) => boolean) {
  if (value === null) return true;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) && comparison(timestamp);
}

export function countActiveProviderConnections(input: ConnectionMetricInput, now = new Date()) {
  const counts = new Map<string, number>();
  const counted = new Set<string>();
  const nowMs = now.getTime();
  for (const patient of input.patients) {
    if (patient.status !== 'active') continue;
    for (const link of input.links) {
      if (link.patientId !== patient.id || link.status !== 'active' || !link.consumerPrincipalId) continue;
      const grant = input.grants.find((entry) =>
        entry.patientId === patient.id
        && entry.consumerPrincipalId === link.consumerPrincipalId
        && entry.status === 'active'
        && validBoundary(entry.effectiveAt, (timestamp) => timestamp <= nowMs)
        && validBoundary(entry.expiresAt, (timestamp) => timestamp > nowMs)
      );
      const connectionKey = `${patient.id}:${link.consumerPrincipalId}`;
      if (!grant || counted.has(connectionKey)) continue;
      counted.add(connectionKey);
      counts.set(patient.providerAccountId, (counts.get(patient.providerAccountId) ?? 0) + 1);
    }
  }
  return counts;
}
