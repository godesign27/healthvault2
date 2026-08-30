import type { ProviderAccountStatus, ProviderMembershipStatus, ProviderRoleKey } from '@health-vault/provider-contracts';

export interface ProviderDirectoryEntry {
  id: string;
  displayName: string;
  slug: string;
  providerType: string;
  status: ProviderAccountStatus;
  locationCount: number;
  activeMemberCount: number;
  activeConnectionCount: number;
  rosterCount: number;
  readiness: string;
  lastActivityAt: string | null;
}

export interface ProviderMembershipEntry {
  id: string;
  providerId: string;
  name: string;
  email: string;
  roles: readonly ProviderRoleKey[];
  status: ProviderMembershipStatus;
  lastActiveAt: string | null;
  invitedAt: string | null;
}

export type ProviderImportStatus = 'staged' | 'validated' | 'rejected' | 'committed' | 'rolled_back';
export interface ProviderImportEntry {
  id: string; providerAccountId: string; providerName: string; sourceName: string; sourceSystem: string;
  synthetic: boolean; schemaVersion: string; status: ProviderImportStatus; rowCount: number;
  validRowCount: number; invalidRowCount: number; exceptionCount: number; insertedCount: number;
  unchangedCount: number; createdAt: string; committedAt: string | null; rolledBackAt: string | null;
}

export type PractitionerCredentialFilter = 'all' | 'needs_review' | 'attention' | 'unverified' | 'pending' | 'verified' | 'rejected' | 'expired';
export interface PractitionerReviewListEntry {
  id: string;
  display_name: string;
  email: string | null;
  specialty: string | null;
  provider_name: string;
  credential_status: Exclude<PractitionerCredentialFilter, 'all' | 'needs_review' | 'attention'>;
  professional_identifier_type: string | null;
  professional_identifier_value: string | null;
}

export type PatientConnectionStatusFilter = 'all' | 'active' | 'expired' | 'revoked';
export interface PatientConnectionListEntry {
  providerPatientIdentityId: string;
  providerName: string;
  patientName: string;
  organizationPatientNumber: string | null;
  email: string | null;
  status: string;
  scope: readonly string[];
  purpose: string | null;
  consentVersion: string | null;
  consentReceiptId: string | null;
  consentEvidenceType: string | null;
}

export const PROVIDER_DIRECTORY_FIXTURES: readonly ProviderDirectoryEntry[] = [
  { id: 'provider-pine-ridge', displayName: 'Pine Ridge Family Medicine', slug: 'pine-ridge-family-medicine', providerType: 'Primary care', status: 'active', locationCount: 3, activeMemberCount: 18, activeConnectionCount: 1, rosterCount: 2840, readiness: 'Pilot ready', lastActivityAt: '2026-08-29T15:42:00Z' },
  { id: 'provider-clearwater', displayName: 'Clearwater Pediatrics', slug: 'clearwater-pediatrics', providerType: 'Pediatrics', status: 'active', locationCount: 2, activeMemberCount: 11, activeConnectionCount: 1, rosterCount: 1675, readiness: 'Pilot ready', lastActivityAt: '2026-08-29T14:18:00Z' },
  { id: 'provider-mesa', displayName: 'Mesa Women’s Health', slug: 'mesa-womens-health', providerType: 'Women’s health', status: 'degraded', locationCount: 4, activeMemberCount: 14, activeConnectionCount: 0, rosterCount: 3210, readiness: 'Connection review', lastActivityAt: '2026-08-28T21:05:00Z' },
  { id: 'provider-summit', displayName: 'Summit Behavioral Care', slug: 'summit-behavioral-care', providerType: 'Behavioral health', status: 'verification_pending', locationCount: 1, activeMemberCount: 2, activeConnectionCount: 0, rosterCount: 0, readiness: 'Identity verification', lastActivityAt: null },
];

export const PROVIDER_MEMBERSHIP_FIXTURES: readonly ProviderMembershipEntry[] = [
  { id: 'member-1', providerId: 'provider-pine-ridge', name: 'Morgan Lee', email: 'morgan.lee@example.test', roles: ['organization_owner'], status: 'active', lastActiveAt: '2026-08-29T15:42:00Z', invitedAt: null },
  { id: 'member-2', providerId: 'provider-pine-ridge', name: 'Jordan Patel', email: 'jordan.patel@example.test', roles: ['provider_admin', 'operations_staff'], status: 'active', lastActiveAt: '2026-08-29T13:11:00Z', invitedAt: null },
  { id: 'member-3', providerId: 'provider-clearwater', name: 'Taylor Brooks', email: 'taylor.brooks@example.test', roles: ['organization_owner'], status: 'active', lastActiveAt: '2026-08-28T19:25:00Z', invitedAt: null },
  { id: 'member-4', providerId: 'provider-mesa', name: 'Casey Rivera', email: 'casey.rivera@example.test', roles: ['integration_operator'], status: 'active', lastActiveAt: '2026-08-28T21:05:00Z', invitedAt: null },
  { id: 'member-5', providerId: 'provider-summit', name: 'Avery Chen', email: 'avery.chen@example.test', roles: ['provider_admin'], status: 'invited', lastActiveAt: null, invitedAt: '2026-08-27T16:30:00Z' },
  { id: 'member-6', providerId: 'provider-mesa', name: 'Riley Davis', email: 'riley.davis@example.test', roles: ['operations_staff'], status: 'suspended', lastActiveAt: '2026-08-20T10:15:00Z', invitedAt: null },
];

export function filterProviderDirectory(entries: readonly ProviderDirectoryEntry[], filters: { query: string; status: ProviderAccountStatus | 'all' }): ProviderDirectoryEntry[] {
  const query = filters.query.trim().toLocaleLowerCase();
  return entries.filter((entry) => {
    const matchesStatus = filters.status === 'all' || entry.status === filters.status;
    const searchable = `${entry.displayName} ${entry.slug} ${entry.providerType}`.toLocaleLowerCase();
    return matchesStatus && (!query || searchable.includes(query));
  });
}

export function getProviderDirectorySummary(entries: readonly ProviderDirectoryEntry[]) {
  return {
    total: entries.length,
    active: entries.filter((entry) => entry.status === 'active').length,
    needsAttention: entries.filter((entry) => ['degraded', 'suspended'].includes(entry.status)).length,
    onboarding: entries.filter((entry) => ['draft', 'verification_pending'].includes(entry.status)).length,
  };
}

export function getMembershipSummary(entries: readonly ProviderMembershipEntry[]) {
  return {
    total: entries.length,
    active: entries.filter((entry) => entry.status === 'active').length,
    invited: entries.filter((entry) => entry.status === 'invited').length,
    suspended: entries.filter((entry) => entry.status === 'suspended').length,
  };
}

export function mergeProviderMemberships(
  providerId: string,
  members: ReadonlyArray<{ id: string; email: string | null; roles: readonly ProviderRoleKey[]; status: Exclude<ProviderMembershipStatus, 'invited'>; lastActiveAt: string | null; invitedAt: string | null }>,
  invitations: ReadonlyArray<{ id: string; email: string; roles: readonly ProviderRoleKey[]; invited_at: string; last_delivery_at: string | null }>,
): ProviderMembershipEntry[] {
  const displayName = (email: string | null) => email?.split('@')[0] || 'Provider member';
  return [
    ...members.map((member) => ({ ...member, email: member.email ?? 'Email unavailable', providerId, name: displayName(member.email) })),
    ...invitations.map((invitation) => ({ id: invitation.id, providerId, name: displayName(invitation.email), email: invitation.email, roles: invitation.roles, status: 'invited' as const, lastActiveAt: null, invitedAt: invitation.invited_at })),
  ];
}

export function getProviderImportSummary(entries: readonly ProviderImportEntry[]) {
  return {
    total: entries.length,
    committed: entries.filter((entry) => entry.status === 'committed').length,
    needsAttention: entries.filter((entry) => entry.status === 'rejected' || entry.invalidRowCount > 0 || entry.exceptionCount > 0).length,
    processedRows: entries.reduce((total, entry) => total + entry.rowCount, 0),
  };
}

export function filterProviderImports(entries: readonly ProviderImportEntry[], filters: { providerId: string | 'all'; status: ProviderImportStatus | 'all'; query: string }) {
  const query = filters.query.trim().toLocaleLowerCase();
  return entries.filter((entry) => {
    const providerMatches = filters.providerId === 'all' || entry.providerAccountId === filters.providerId;
    const statusMatches = filters.status === 'all' || entry.status === filters.status;
    const searchable = `${entry.providerName} ${entry.sourceName} ${entry.sourceSystem}`.toLocaleLowerCase();
    return providerMatches && statusMatches && (!query || searchable.includes(query));
  });
}

export function filterPractitionerReviews<T extends PractitionerReviewListEntry>(entries: readonly T[], filters: { query: string; status: PractitionerCredentialFilter }): T[] {
  const query = filters.query.trim().toLocaleLowerCase();
  return entries.filter((entry) => {
    const statusMatches = filters.status === 'all'
      || (filters.status === 'needs_review' && ['unverified', 'pending'].includes(entry.credential_status))
      || (filters.status === 'attention' && ['rejected', 'expired'].includes(entry.credential_status))
      || entry.credential_status === filters.status;
    const searchable = [entry.display_name, entry.email, entry.specialty, entry.provider_name, entry.professional_identifier_type, entry.professional_identifier_value]
      .filter(Boolean).join(' ').toLocaleLowerCase();
    return statusMatches && (!query || searchable.includes(query));
  });
}

export function getPractitionerReviewSummary(entries: readonly PractitionerReviewListEntry[]) {
  return {
    total: entries.length,
    needsReview: entries.filter((entry) => ['unverified', 'pending'].includes(entry.credential_status)).length,
    verified: entries.filter((entry) => entry.credential_status === 'verified').length,
    attention: entries.filter((entry) => ['rejected', 'expired'].includes(entry.credential_status)).length,
  };
}

export function filterPatientConnections<T extends PatientConnectionListEntry>(entries: readonly T[], filters: { query: string; status: PatientConnectionStatusFilter }): T[] {
  const query = filters.query.trim().toLocaleLowerCase();
  return entries.filter((entry) => {
    const statusMatches = filters.status === 'all' || entry.status === filters.status;
    const searchable = [entry.patientName, entry.email, entry.organizationPatientNumber, entry.providerName, entry.purpose, entry.consentVersion, entry.consentReceiptId, entry.consentEvidenceType, ...entry.scope]
      .filter(Boolean).join(' ').replace(/_/g, ' ').toLocaleLowerCase();
    return statusMatches && (!query || searchable.includes(query));
  });
}

export function getPatientConnectionSummary(entries: readonly PatientConnectionListEntry[]) {
  return {
    total: entries.length,
    active: entries.filter((entry) => entry.status === 'active').length,
    expired: entries.filter((entry) => entry.status === 'expired').length,
    revoked: entries.filter((entry) => entry.status === 'revoked').length,
  };
}
