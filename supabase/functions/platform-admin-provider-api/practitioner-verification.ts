export const REVIEWABLE_CREDENTIAL_STATUSES = ['pending', 'verified', 'rejected', 'expired'] as const;
type ReviewableCredentialStatus = typeof REVIEWABLE_CREDENTIAL_STATUSES[number];
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validatePractitionerVerification(input: {
  practitionerProfileId?: unknown;
  credentialStatus?: unknown;
  evidenceRef?: unknown;
  reason?: unknown;
}) {
  if (typeof input.practitionerProfileId !== 'string' || !UUID_PATTERN.test(input.practitionerProfileId)) throw new Error('practitionerProfileId must be a valid UUID');
  if (typeof input.credentialStatus !== 'string' || !REVIEWABLE_CREDENTIAL_STATUSES.includes(input.credentialStatus as ReviewableCredentialStatus)) throw new Error('credentialStatus is unsupported');
  const evidenceRef = typeof input.evidenceRef === 'string' ? input.evidenceRef.trim() : '';
  const reason = typeof input.reason === 'string' ? input.reason.trim() : '';
  if (evidenceRef.length > 500) throw new Error('evidenceRef must be 500 characters or fewer');
  if (reason.length > 1000) throw new Error('reason must be 1000 characters or fewer');
  if (input.credentialStatus === 'verified' && !evidenceRef) throw new Error('evidenceRef is required for verification');
  if (input.credentialStatus === 'rejected' && !reason) throw new Error('reason is required for rejection');
  return { practitionerProfileId: input.practitionerProfileId, credentialStatus: input.credentialStatus as ReviewableCredentialStatus, evidenceRef, reason };
}

export function validateBulkPractitionerVerification(input: {
  practitionerProfileIds?: unknown;
  credentialStatus?: unknown;
  evidenceRef?: unknown;
  reason?: unknown;
}) {
  if (!Array.isArray(input.practitionerProfileIds) || input.practitionerProfileIds.length < 1 || input.practitionerProfileIds.length > 500) {
    throw new Error('practitionerProfileIds must contain 1 to 500 profiles');
  }
  const practitionerProfileIds = input.practitionerProfileIds.map((value) => {
    if (typeof value !== 'string' || !UUID_PATTERN.test(value)) throw new Error('each practitionerProfileId must be a valid UUID');
    return value;
  });
  if (new Set(practitionerProfileIds).size !== practitionerProfileIds.length) throw new Error('practitionerProfileIds must be unique');
  const common = validatePractitionerVerification({ practitionerProfileId: practitionerProfileIds[0], credentialStatus: input.credentialStatus, evidenceRef: input.evidenceRef, reason: input.reason });
  return { practitionerProfileIds, credentialStatus: common.credentialStatus, evidenceRef: common.evidenceRef, reason: common.reason };
}
