export function resolveAccessiblePractitionerPatientIds(input: {
  assignments: Array<{ patientId: string; status: string; expiresAt: string | null }>;
  identityLinks: Array<{ patientId: string; consumerPrincipalId: string; status: string }>;
  grants: Array<{ patientId: string; consumerPrincipalId: string; status: string; expiresAt: string | null }>;
}, now = new Date()) {
  return [...new Set(input.assignments.filter((assignment) =>
    assignment.status === 'active' && (!assignment.expiresAt || new Date(assignment.expiresAt) > now) &&
    input.identityLinks.some((link) => link.patientId === assignment.patientId && link.status === 'active' &&
      input.grants.some((grant) => grant.patientId === assignment.patientId && grant.consumerPrincipalId === link.consumerPrincipalId &&
        grant.status === 'active' && (!grant.expiresAt || new Date(grant.expiresAt) > now)))
  ).map((assignment) => assignment.patientId))];
}
