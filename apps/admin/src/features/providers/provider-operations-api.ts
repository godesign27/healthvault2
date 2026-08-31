import type { ProviderRoleKey } from '@health-vault/provider-contracts';
import { supabase } from '../../lib/supabase';
import type { ProviderDirectoryEntry, ProviderImportEntry } from './provider-operations-data';

async function invoke(body: Record<string, unknown>) {
  const response = await supabase.functions.invoke('platform-admin-provider-api', { body });
  if (!response.error) return response.data;
  let detail = response.data?.error;
  const context = (response.error as { context?: Response }).context;
  if (!detail && context && typeof context.json === 'function') {
    try { detail = (await context.clone().json())?.error; } catch { /* retain SDK message */ }
  }
  throw new Error(detail ?? response.error.message);
}

export async function fetchProviderDirectory(): Promise<ProviderDirectoryEntry[]> {
  const data = await invoke({ action: 'list-providers' });
  return data?.providers ?? [];
}

export async function fetchProviderMembers(providerAccountId: string) {
  const data = await invoke({ action: 'list-members', providerAccountId });
  return { members: data?.members ?? [], invitations: data?.invitations ?? [] };
}

export async function fetchProviderImports(): Promise<ProviderImportEntry[]> {
  const data = await invoke({ action: 'list-imports' });
  return data?.imports ?? [];
}

export async function createProviderInvitation(providerAccountId: string, email: string, roles: readonly ProviderRoleKey[]) {
  return invoke({ action: 'create-invitation', providerAccountId, email, roles });
}

export async function resendProviderInvitation(providerAccountId: string, invitationId: string) {
  return invoke({ action: 'resend-invitation', providerAccountId, invitationId });
}

export interface PractitionerReviewEntry {
  id: string; provider_account_id: string; provider_name: string; email: string | null; display_name: string;
  specialty: string | null; professional_identifier_type: string | null; professional_identifier_value: string | null;
  credential_status: 'unverified' | 'pending' | 'verified' | 'rejected' | 'expired'; credential_evidence_ref: string | null;
  credential_review_reason: string | null; credential_reviewed_at: string | null; status: string;
}

export async function fetchPractitionerReviews(): Promise<PractitionerReviewEntry[]> {
  const data = await invoke({ action: 'list-practitioners' });
  return data?.practitioners ?? [];
}

export async function updatePractitionerCredential(input: { practitionerProfileId: string; providerAccountId: string; credentialStatus: 'pending' | 'verified' | 'rejected' | 'expired'; evidenceRef: string; reason: string }) {
  return invoke({ action: 'update-practitioner-credential', ...input });
}

export async function bulkUpdatePractitionerCredentials(input: { practitionerProfileIds: string[]; credentialStatus: 'pending' | 'verified' | 'rejected' | 'expired'; evidenceRef: string; reason: string }) {
  return invoke({ action: 'bulk-update-practitioner-credentials', ...input });
}

export interface PatientConnectionEntry {
  providerPatientIdentityId: string; providerAccountId: string; providerName: string; patientName: string;
  organizationPatientNumber: string | null; email: string | null; status: string; scope: string[];
  purpose: string | null; consentVersion: string | null; effectiveAt: string | null; expiresAt: string | null; revokedAt: string | null;
  consentReceiptId: string | null; consentedAt: string | null; consentEvidenceType: string | null;
}

export async function fetchPatientConnections(): Promise<PatientConnectionEntry[]> {
  const data = await invoke({ action: 'list-patient-connections' });
  return data?.connections ?? [];
}

export async function terminatePatientConnection(input: { providerPatientIdentityId: string; providerAccountId: string; reason: string }) {
  return invoke({ action: 'terminate-patient-connection', ...input });
}

export interface MfaRecoveryAccount {
  userId: string; email: string; verifiedFactors: Array<{ id: string; type: string; status: string; friendlyName: string | null }>;
}

export async function lookupMfaRecoveryAccount(email: string): Promise<MfaRecoveryAccount> {
  const data = await invoke({ action: 'lookup-mfa-recovery', email });
  return data.account;
}

export async function resetUserMfa(input: { userId: string; email: string; confirmEmail: string; reason: string }) {
  return invoke({ action: 'reset-user-mfa', ...input });
}
