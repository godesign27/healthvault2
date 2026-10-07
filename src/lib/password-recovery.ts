export const recoveryRedirect = 'https://healthvault.me';

export function normalizeRecoveryEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error('Enter a valid email address.');
  return normalized;
}

export function isPasswordRecoveryUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value, 'https://healthvault.me');
  } catch {
    return false;
  }
  const hash = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash);
  return hash.get('type') === 'recovery' || url.searchParams.get('type') === 'recovery';
}

export function validateNewPassword(password: string, confirmation: string): string | null {
  if (password.length < 12) return 'Use at least 12 characters.';
  if (password !== confirmation) return 'The passwords do not match.';
  return null;
}

export function clearAuthRecoveryUrl(): void {
  const url = new URL(window.location.href);
  url.hash = '';
  url.searchParams.delete('type');
  window.history.replaceState({}, '', `${url.pathname}${url.search}`);
}
