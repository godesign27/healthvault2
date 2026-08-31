export type AdminMfaStep = 'checking' | 'enroll' | 'challenge' | 'verified';

export function hasRecentTotpInAccessToken(accessToken: string | null, now = new Date(), maxAgeSeconds = 24 * 60 * 60) {
  if (!accessToken) return false;
  try {
    const encoded = accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=')));
    const totp = Array.isArray(payload.amr) ? payload.amr.find((entry: { method?: string }) => entry?.method === 'totp') : null;
    const ageSeconds = (now.getTime() - Number(totp?.timestamp) * 1000) / 1000;
    return payload.aal === 'aal2' && Number.isFinite(ageSeconds) && ageSeconds >= 0 && ageSeconds <= maxAgeSeconds;
  } catch { return false; }
}

export function getAdminMfaStep(input: { loading: boolean; hasVerifiedTotp: boolean; currentAal: string | null; hasRecentTotp: boolean }): AdminMfaStep {
  if (input.loading) return 'checking';
  if (!input.hasVerifiedTotp) return 'enroll';
  if (input.currentAal !== 'aal2' || !input.hasRecentTotp) return 'challenge';
  return 'verified';
}
