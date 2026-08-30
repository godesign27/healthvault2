interface PatientProviderRevocationInput {
  currentUserId: string;
  linkConsumerPrincipalId: string | null;
  linkStatus: string;
  grantStatus: string;
}

export function authorizePatientProviderRevocation(input: PatientProviderRevocationInput) {
  if (
    input.currentUserId !== input.linkConsumerPrincipalId ||
    input.linkStatus !== "active" ||
    input.grantStatus !== "active"
  ) {
    return { allowed: false as const, code: "patient_access_not_active" };
  }

  return { allowed: true as const };
}
