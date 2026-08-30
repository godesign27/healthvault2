const PROVIDER_ROLE_KEYS = [
  'organization_owner', 'provider_admin', 'practitioner', 'operations_staff',
  'integration_operator', 'privacy_auditor',
] as const;

interface InvitationAcceptanceInput {
  invitation: { status: string; email: string; expiresAt: string; roles: readonly string[] };
  userEmail: string | null;
  emailVerified: boolean;
  hasVerifiedTotp: boolean;
  aal: string | null;
  now?: Date;
}

export type InvitationAcceptanceDecision =
  | { allowed: true; code: 'allowed' }
  | { allowed: false; code: 'verified_email_required' | 'email_mismatch' | 'mfa_enrollment_required' | 'mfa_challenge_required' | 'invitation_unavailable' | 'invitation_expired' | 'invalid_invitation_roles' };

type InvitationPreviewInput = Pick<InvitationAcceptanceInput, 'invitation' | 'userEmail' | 'emailVerified' | 'now'>;
type InvitationPreviewDecision =
  | { allowed: true; code: 'allowed' }
  | { allowed: false; code: 'verified_email_required' | 'email_mismatch' | 'invitation_unavailable' | 'invitation_expired' | 'invalid_invitation_roles' };

export function authorizeInvitationPreview(input: InvitationPreviewInput): InvitationPreviewDecision {
  const now = input.now ?? new Date();
  if (!input.emailVerified || !input.userEmail) return { allowed: false, code: 'verified_email_required' };
  if (input.userEmail.trim().toLocaleLowerCase() !== input.invitation.email.trim().toLocaleLowerCase()) return { allowed: false, code: 'email_mismatch' };
  if (input.invitation.status !== 'pending') return { allowed: false, code: 'invitation_unavailable' };
  const expiresAt = new Date(input.invitation.expiresAt);
  if (!Number.isFinite(expiresAt.getTime()) || expiresAt <= now) return { allowed: false, code: 'invitation_expired' };
  if (input.invitation.roles.length === 0 || !input.invitation.roles.every((role) => (PROVIDER_ROLE_KEYS as readonly string[]).includes(role))) {
    return { allowed: false, code: 'invalid_invitation_roles' };
  }
  return { allowed: true, code: 'allowed' };
}

export function authorizeInvitationAcceptance(input: InvitationAcceptanceInput): InvitationAcceptanceDecision {
  const now = input.now ?? new Date();
  if (!input.emailVerified || !input.userEmail) return { allowed: false, code: 'verified_email_required' };
  if (input.userEmail.trim().toLocaleLowerCase() !== input.invitation.email.trim().toLocaleLowerCase()) return { allowed: false, code: 'email_mismatch' };
  if (!input.hasVerifiedTotp) return { allowed: false, code: 'mfa_enrollment_required' };
  if (input.aal !== 'aal2') return { allowed: false, code: 'mfa_challenge_required' };
  if (input.invitation.status !== 'pending') return { allowed: false, code: 'invitation_unavailable' };
  const expiresAt = new Date(input.invitation.expiresAt);
  if (!Number.isFinite(expiresAt.getTime()) || expiresAt <= now) return { allowed: false, code: 'invitation_expired' };
  if (input.invitation.roles.length === 0 || !input.invitation.roles.every((role) => (PROVIDER_ROLE_KEYS as readonly string[]).includes(role))) {
    return { allowed: false, code: 'invalid_invitation_roles' };
  }
  return { allowed: true, code: 'allowed' };
}
