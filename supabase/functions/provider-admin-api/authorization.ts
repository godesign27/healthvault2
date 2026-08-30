export const PROVIDER_ROLE_KEYS = [
  'organization_owner', 'provider_admin', 'practitioner', 'operations_staff',
  'integration_operator', 'privacy_auditor',
] as const;
export type ProviderRoleKey = (typeof PROVIDER_ROLE_KEYS)[number];

const ROLE_PERMISSIONS: Record<ProviderRoleKey, readonly string[]> = {
  organization_owner: ['organization.read', 'organization.manage', 'members.read', 'members.manage', 'imports.read', 'imports.manage', 'patient_panels.manage', 'forms.read', 'requests.read', 'integrations.read', 'integrations.manage', 'provider_audit.read'],
  provider_admin: ['organization.read', 'members.read', 'members.manage', 'imports.read', 'imports.manage', 'patient_panels.manage', 'forms.read', 'requests.read', 'integrations.read', 'integrations.manage', 'provider_audit.read'],
  practitioner: ['organization.read', 'patients.read_assigned', 'forms.read', 'requests.read'],
  operations_staff: ['organization.read', 'imports.read', 'forms.read', 'requests.read'],
  integration_operator: ['organization.read', 'imports.read', 'imports.manage', 'integrations.read', 'integrations.manage'],
  privacy_auditor: ['organization.read', 'provider_audit.read'],
};

export function isProviderRole(value: string): value is ProviderRoleKey {
  return (PROVIDER_ROLE_KEYS as readonly string[]).includes(value);
}

export function permissionsForRoles(roles: readonly ProviderRoleKey[]): string[] {
  return [...new Set(roles.flatMap((role) => ROLE_PERMISSIONS[role]))];
}

interface RoleChangeInput {
  actorId: string;
  targetId: string;
  actorRoles: readonly string[];
  requestedRoles: readonly string[];
}

export function authorizeMemberRoleChange(input: RoleChangeInput): { allowed: boolean; reason?: string } {
  if (input.actorId === input.targetId) return { allowed: false, reason: 'self role changes are not allowed' };
  if (input.requestedRoles.length === 0 || !input.requestedRoles.every(isProviderRole)) {
    return { allowed: false, reason: 'one or more requested roles are invalid' };
  }
  if (input.actorRoles.includes('organization_owner')) return { allowed: true };
  if (!input.actorRoles.includes('provider_admin')) return { allowed: false, reason: 'membership management permission required' };
  if (input.requestedRoles.some((role) => role === 'organization_owner' || role === 'privacy_auditor')) {
    return { allowed: false, reason: 'only organization owners can delegate owner or auditor roles' };
  }
  return { allowed: true };
}

export function hasRecentAal2(
  assurance: { aal: string | null; authenticatedAt: string | null },
  now = new Date(),
  maxAgeSeconds = 24 * 60 * 60,
): boolean {
  if (assurance.aal !== 'aal2' || !assurance.authenticatedAt) return false;
  const authenticatedAt = new Date(assurance.authenticatedAt);
  const ageSeconds = (now.getTime() - authenticatedAt.getTime()) / 1000;
  return Number.isFinite(ageSeconds) && ageSeconds >= 0 && ageSeconds <= maxAgeSeconds;
}

export function authorizeWorkspaceAccess(
  context: { accountStatus: string; membershipStatus: string; permissions: readonly string[]; hasAal2: boolean; hasRecentAal2: boolean },
  permission: string,
  options: { requireRecentAal2?: boolean } = {},
): { allowed: boolean; reason?: string } {
  if (!context.hasAal2) return { allowed: false, reason: 'AAL2 authentication required' };
  if (options.requireRecentAal2 && !context.hasRecentAal2) return { allowed: false, reason: 'recent AAL2 authentication required' };
  if (context.accountStatus !== 'active' || context.membershipStatus !== 'active') return { allowed: false, reason: 'active provider membership required' };
  if (!context.permissions.includes(permission)) return { allowed: false, reason: `${permission} permission required` };
  return { allowed: true };
}

interface MembershipStatusChangeInput {
  actorId: string;
  targetId: string;
  actorRoles: readonly string[];
  targetRoles: readonly string[];
  requestedStatus: 'active' | 'suspended' | 'removed';
  activeOwnerCount: number;
  hasRecentAal2: boolean;
}

export function authorizeMembershipStatusChange(input: MembershipStatusChangeInput): { allowed: boolean; reason?: string } {
  if (!input.hasRecentAal2) return { allowed: false, reason: 'recent AAL2 authentication required' };
  if (input.actorId === input.targetId) return { allowed: false, reason: 'self status changes are not allowed' };
  const actorIsOwner = input.actorRoles.includes('organization_owner');
  const actorIsAdmin = input.actorRoles.includes('provider_admin');
  if (!actorIsOwner && !actorIsAdmin) return { allowed: false, reason: 'membership management permission required' };
  const targetIsOwner = input.targetRoles.includes('organization_owner');
  if (targetIsOwner && !actorIsOwner) return { allowed: false, reason: 'only owners can change owner status' };
  if (targetIsOwner && input.requestedStatus !== 'active' && input.activeOwnerCount <= 1) {
    return { allowed: false, reason: 'the last active owner cannot be suspended or removed' };
  }
  return { allowed: true };
}
