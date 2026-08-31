const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateMfaRecoveryLookup(input: { email?: unknown }) {
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 320) throw new Error('A valid exact email is required');
  return { email };
}

export function validateMfaRecoveryReset(input: { userId?: unknown; email?: unknown; confirmEmail?: unknown; reason?: unknown }) {
  const lookup = validateMfaRecoveryLookup(input);
  const confirmEmail = typeof input.confirmEmail === 'string' ? input.confirmEmail.trim().toLowerCase() : '';
  const reason = typeof input.reason === 'string' ? input.reason.trim() : '';
  if (typeof input.userId !== 'string' || !UUID.test(input.userId)) throw new Error('A valid userId is required');
  if (confirmEmail !== lookup.email) throw new Error('Email confirmation must exactly match the account');
  if (reason.length < 10 || reason.length > 500) throw new Error('A recovery reason between 10 and 500 characters is required');
  return { userId: input.userId, email: lookup.email, reason };
}
