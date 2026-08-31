export const PANEL_RELATIONSHIP_TYPES = ["care_team", "primary_care", "specialist", "care_coordinator"] as const;

type RelationshipType = typeof PANEL_RELATIONSHIP_TYPES[number];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validatePanelAssignmentInput(input: {
  practitionerProfileId?: unknown;
  patientIdentityId?: unknown;
  relationshipType?: unknown;
}) {
  if (typeof input.practitionerProfileId !== "string" || !UUID_PATTERN.test(input.practitionerProfileId)) {
    throw new Error("practitionerProfileId must be a valid UUID");
  }
  if (typeof input.patientIdentityId !== "string" || !UUID_PATTERN.test(input.patientIdentityId)) {
    throw new Error("patientIdentityId must be a valid UUID");
  }
  if (typeof input.relationshipType !== "string" || !PANEL_RELATIONSHIP_TYPES.includes(input.relationshipType as RelationshipType)) {
    throw new Error("relationshipType is unsupported");
  }
  return {
    practitionerProfileId: input.practitionerProfileId,
    patientIdentityId: input.patientIdentityId,
    relationshipType: input.relationshipType as RelationshipType,
  };
}

export function canAssignToPanel(input: {
  sameProvider: boolean;
  profileStatus: string;
  credentialStatus: string;
  patientStatus: string;
}) {
  if (!input.sameProvider) return { allowed: false, reason: "Practitioner and patient must belong to this provider." };
  if (input.profileStatus !== "active") return { allowed: false, reason: "An active practitioner profile is required." };
  if (input.credentialStatus !== "verified") return { allowed: false, reason: "A verified practitioner credential is required." };
  if (input.patientStatus !== "active") return { allowed: false, reason: "An active provider patient is required." };
  return { allowed: true };
}

export function validateBulkPanelAssignments(input: unknown) {
  if (!Array.isArray(input) || input.length < 1 || input.length > 2000) throw new Error("assignments must contain 1 to 2,000 rows");
  const seen = new Set<string>();
  return input.map((value, index) => {
    const row = value as Record<string, unknown>;
    const practitionerEmail = String(row?.practitionerEmail ?? "").trim().toLowerCase();
    const patientNumber = String(row?.patientNumber ?? "").trim();
    const relationshipType = String(row?.relationshipType ?? "");
    if (!EMAIL_PATTERN.test(practitionerEmail)) throw new Error(`row ${index + 1}: practitionerEmail is invalid`);
    if (!patientNumber || patientNumber.length > 250) throw new Error(`row ${index + 1}: patientNumber is required`);
    if (!PANEL_RELATIONSHIP_TYPES.includes(relationshipType as RelationshipType)) throw new Error(`row ${index + 1}: relationshipType is unsupported`);
    const key = `${practitionerEmail}\u0000${patientNumber}`;
    if (seen.has(key)) throw new Error(`row ${index + 1}: assignment is duplicated`);
    seen.add(key);
    return { practitionerEmail, patientNumber, relationshipType: relationshipType as RelationshipType };
  });
}
