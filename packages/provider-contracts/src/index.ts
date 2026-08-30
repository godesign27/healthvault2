export const PROVIDER_ACCOUNT_STATUSES = [
  'draft', 'verification_pending', 'active', 'degraded', 'suspended', 'archived',
] as const;
export type ProviderAccountStatus = (typeof PROVIDER_ACCOUNT_STATUSES)[number];
export type ProviderConnectionStatus = 'draft' | 'testing' | 'active' | 'degraded' | 'disabled';

export const PROVIDER_ROLE_KEYS = [
  'organization_owner', 'provider_admin', 'practitioner', 'operations_staff',
  'integration_operator', 'privacy_auditor',
] as const;
export type ProviderRoleKey = (typeof PROVIDER_ROLE_KEYS)[number];

export const PROVIDER_PERMISSIONS = [
  'organization.read', 'organization.manage', 'members.read', 'members.manage',
  'imports.read', 'imports.manage', 'patients.read_assigned', 'patients.read_all',
  'patient_panels.manage', 'forms.read', 'requests.read', 'integrations.read',
  'integrations.manage', 'provider_audit.read',
] as const;
export type ProviderPermission = (typeof PROVIDER_PERMISSIONS)[number];

export const PROVIDER_ROLE_PERMISSIONS: Readonly<Record<ProviderRoleKey, readonly ProviderPermission[]>> = {
  organization_owner: ['organization.read', 'organization.manage', 'members.read', 'members.manage', 'imports.read', 'imports.manage', 'patient_panels.manage', 'forms.read', 'requests.read', 'integrations.read', 'integrations.manage', 'provider_audit.read'],
  provider_admin: ['organization.read', 'members.read', 'members.manage', 'imports.read', 'imports.manage', 'patient_panels.manage', 'forms.read', 'requests.read', 'integrations.read', 'integrations.manage', 'provider_audit.read'],
  practitioner: ['organization.read', 'patients.read_assigned', 'forms.read', 'requests.read'],
  operations_staff: ['organization.read', 'imports.read', 'forms.read', 'requests.read'],
  integration_operator: ['organization.read', 'imports.read', 'imports.manage', 'integrations.read', 'integrations.manage'],
  privacy_auditor: ['organization.read', 'provider_audit.read'],
};

export type ProviderMembershipStatus = 'invited' | 'active' | 'suspended' | 'removed';
export type ProviderPatientAssignmentStatus = 'active' | 'ended' | 'revoked';
export type ProviderAccessGrantStatus = 'pending' | 'active' | 'denied' | 'revoked' | 'expired';

export interface ProviderAccountSummary { id: string; legalName: string; displayName: string; status: ProviderAccountStatus; providerType: string; lastActivityAt: string | null; activeConnectionCount: number }
export interface ProviderTenantContext { providerAccountId: string; principalId: string; roles: readonly ProviderRoleKey[]; permissions: readonly ProviderPermission[] }
export interface ProviderAuthorizationContext extends ProviderTenantContext { accountStatus: ProviderAccountStatus; membershipStatus: ProviderMembershipStatus }
export interface ProviderPatientAccessContext { assignmentStatus: ProviderPatientAssignmentStatus | null; accessGrantStatus: ProviderAccessGrantStatus | null; grantExpiresAt: string | null }

export function canPerformProviderAction(context: ProviderAuthorizationContext, permission: ProviderPermission): boolean {
  return context.accountStatus === 'active' && context.membershipStatus === 'active' && context.permissions.includes(permission);
}

export function canAccessProviderPatient(context: ProviderAuthorizationContext, patientAccess: ProviderPatientAccessContext, now = new Date()): boolean {
  if (!canPerformProviderAction(context, 'patients.read_assigned')) return false;
  if (patientAccess.assignmentStatus !== 'active' || patientAccess.accessGrantStatus !== 'active') return false;
  return !patientAccess.grantExpiresAt || new Date(patientAccess.grantExpiresAt) > now;
}

export * from './roster-import.ts';
