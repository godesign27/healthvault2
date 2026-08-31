export type ProviderInvitationStep = 'loading' | 'sign_in' | 'verify_email' | 'enroll_mfa' | 'challenge_mfa' | 'ready' | 'accepted';

interface ProviderInvitationState {
  loading: boolean;
  signedIn: boolean;
  emailVerified: boolean;
  hasVerifiedTotp: boolean;
  currentAal: string | null;
  accepted: boolean;
}

export function getProviderInvitationStep(state: ProviderInvitationState): ProviderInvitationStep {
  if (state.accepted) return 'accepted';
  if (state.loading) return 'loading';
  if (!state.signedIn) return 'sign_in';
  if (!state.emailVerified) return 'verify_email';
  if (!state.hasVerifiedTotp) return 'enroll_mfa';
  if (state.currentAal !== 'aal2') return 'challenge_mfa';
  return 'ready';
}
