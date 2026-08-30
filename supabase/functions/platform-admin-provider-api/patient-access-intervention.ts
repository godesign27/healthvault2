const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validatePatientAccessIntervention(input: { providerPatientIdentityId?: string; providerAccountId?: string; reason?: string }) {
  if (!input.providerPatientIdentityId || !input.providerAccountId || !uuidPattern.test(input.providerPatientIdentityId) || !uuidPattern.test(input.providerAccountId)) throw new Error('A valid patient connection is required.');
  const reason = input.reason?.trim() ?? '';
  if (!reason) throw new Error('An intervention reason is required.');
  if (reason.length > 500) throw new Error('The intervention reason must be 500 characters or fewer.');
  return { providerPatientIdentityId: input.providerPatientIdentityId, providerAccountId: input.providerAccountId, reason };
}
