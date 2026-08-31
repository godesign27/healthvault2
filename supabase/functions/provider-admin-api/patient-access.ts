const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const PATIENT_ACCESS_CONSENT_VERSION = 'health-vault-synthetic-pilot-access-v3';
export const PATIENT_ACCESS_SCOPE = ['roster.demographics', 'clinical.imported_records'] as const;

export function normalizePatientInvitationSelection(input: { patientIdentityIds?: unknown; inviteAllEligible?: unknown }) {
  if (input.inviteAllEligible === true) return { inviteAllEligible: true as const, patientIdentityIds: [] as string[] };
  if (!Array.isArray(input.patientIdentityIds) || input.patientIdentityIds.length === 0 || input.patientIdentityIds.length > 500) throw new Error('Select between 1 and 500 patients');
  const patientIdentityIds = [...new Set(input.patientIdentityIds)];
  if (!patientIdentityIds.every((id) => typeof id === 'string' && UUID_PATTERN.test(id))) throw new Error('Every patientIdentityId must be a valid UUID');
  return { inviteAllEligible: false as const, patientIdentityIds };
}

export function buildSyntheticPatientAccessInvitation(input: { patientIdentityId?: unknown; email?: unknown }) {
  if (typeof input.patientIdentityId !== 'string' || !UUID_PATTERN.test(input.patientIdentityId)) throw new Error('patientIdentityId must be a valid UUID');
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 320) throw new Error('email must be a valid address');
  return {
    patientIdentityId: input.patientIdentityId,
    email,
    scope: [...PATIENT_ACCESS_SCOPE],
    purpose: 'care_coordination',
    consentVersion: PATIENT_ACCESS_CONSENT_VERSION,
    synthetic: true as const,
  };
}
