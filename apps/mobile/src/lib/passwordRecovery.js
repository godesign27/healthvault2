export const recoveryRedirect = 'https://healthvault.me';
export function parseRecoveryLink(value) {
  if (!value) return null;
  let url;
  try { url = new URL(value); } catch { return null; }
  if (url.protocol !== 'healthvault:' || url.hostname !== 'auth' || url.pathname !== '/recovery') return null;
  const params = new URLSearchParams(url.hash.slice(1));
  if (params.has('error') || url.searchParams.has('error')) throw new Error('This recovery link is invalid or expired. Request a new link.');
  if (params.get('type') !== 'recovery' || !params.get('access_token') || !params.get('refresh_token')) throw new Error('This recovery link is incomplete. Request a new link.');
  return { access_token: params.get('access_token'), refresh_token: params.get('refresh_token') };
}
export async function requestPasswordRecovery(auth, email) {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error('Enter a valid email address.');
  const { error } = await auth.resetPasswordForEmail(normalized, { redirectTo: recoveryRedirect });
  if (error) throw error;
}
export async function saveRecoveredPassword(auth, password, confirmation) {
  if (password.length < 12) throw new Error('Use at least 12 characters.');
  if (password !== confirmation) throw new Error('The passwords do not match.');
  const { error } = await auth.updateUser({ password });
  if (error) throw error;
}
