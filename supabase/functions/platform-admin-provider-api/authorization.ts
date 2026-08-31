interface Assignment { roleKey: string; permissions: readonly string[] }

export function authorizePatientAccessIntervention(assignments: readonly Assignment[]) {
  return assignments.some((assignment) => assignment.roleKey === 'platform_owner')
    ? { allowed: true as const }
    : { allowed: false as const, reason: 'platform_owner role required' };
}

export function authorizePlatformProviderAction(assignments: readonly Assignment[], action: 'read' | 'manage') {
  const permission = action === 'manage' ? 'providers.manage' : 'providers.read';
  const allowed = assignments.some((assignment) =>
    assignment.roleKey === 'platform_owner'
    || assignment.permissions.includes(permission)
    || (action === 'read' && assignment.permissions.includes('providers.manage'))
  );
  return allowed ? { allowed: true } : { allowed: false, reason: `${permission} permission required` };
}

export function hasRecentAal2(
  assurance: { aal: string | null; authenticatedAt: string | null },
  now = new Date(),
  maxAgeSeconds = 24 * 60 * 60,
) {
  if (assurance.aal !== 'aal2' || !assurance.authenticatedAt) return false;
  const age = (now.getTime() - new Date(assurance.authenticatedAt).getTime()) / 1000;
  return Number.isFinite(age) && age >= 0 && age <= maxAgeSeconds;
}
