export function authorizePatientInvitationPreview(input: {
  invitation: { status: string; email: string; expiresAt: string; synthetic: boolean };
  userEmail: string | null;
  emailVerified: boolean;
}, now = new Date()) {
  if (!input.invitation.synthetic) return { allowed: false, code: 'synthetic_pilot_only' };
  if (input.invitation.status !== 'pending') return { allowed: false, code: 'invitation_unavailable' };
  if (new Date(input.invitation.expiresAt) <= now) return { allowed: false, code: 'invitation_expired' };
  if (!input.emailVerified) return { allowed: false, code: 'verified_email_required' };
  if (!input.userEmail || input.userEmail.trim().toLowerCase() !== input.invitation.email.trim().toLowerCase()) return { allowed: false, code: 'invited_email_required' };
  return { allowed: true };
}
