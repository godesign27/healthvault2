export async function fetchFhirBundle(
  fhirBaseUrl: string,
  resourceType: string,
  accessToken: string,
  patientId: string,
): Promise<Record<string, unknown>> {
  const base = fhirBaseUrl.replace(/\/+$/, "");
  const url = new URL(`${base}/${resourceType}`);
  url.searchParams.set("patient", patientId);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/fhir+json",
    },
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const issue = Array.isArray((payload as { issue?: unknown[] }).issue)
      ? (payload as { issue: Array<{ diagnostics?: string }> }).issue[0]?.diagnostics
      : null;
    throw new Error(issue || `FHIR ${resourceType} fetch failed (${res.status})`);
  }
  return payload as Record<string, unknown>;
}

export async function fetchPatientResources(
  fhirBaseUrl: string,
  accessToken: string,
  patientId: string,
): Promise<{
  conditions: Record<string, unknown>;
  medications: Record<string, unknown>;
  allergies: Record<string, unknown>;
  immunizations: Record<string, unknown>;
}> {
  const [conditions, medications, allergies, immunizations] = await Promise.all([
    fetchFhirBundle(fhirBaseUrl, "Condition", accessToken, patientId),
    fetchFhirBundle(fhirBaseUrl, "MedicationStatement", accessToken, patientId),
    fetchFhirBundle(fhirBaseUrl, "AllergyIntolerance", accessToken, patientId),
    fetchFhirBundle(fhirBaseUrl, "Immunization", accessToken, patientId),
  ]);

  return { conditions, medications, allergies, immunizations };
}

function codingDisplay(code: unknown): string | null {
  if (!code || typeof code !== "object") return null;
  const c = code as { text?: string; coding?: Array<{ display?: string }> };
  if (c.text) return c.text;
  return c.coding?.[0]?.display ?? null;
}

export function bundleToPreviewItems(
  bundles: {
    conditions: Record<string, unknown>;
    medications: Record<string, unknown>;
    allergies: Record<string, unknown>;
    immunizations: Record<string, unknown>;
  },
  source: string,
): Array<{
  resourceType: "condition" | "medication" | "allergy" | "immunization";
  name: string;
  date: string | null;
  source: string;
  status: string | null;
  isDuplicate: boolean;
}> {
  const items: Array<{
    resourceType: "condition" | "medication" | "allergy" | "immunization";
    name: string;
    date: string | null;
    source: string;
    status: string | null;
    isDuplicate: boolean;
  }> = [];

  const entries = (bundle: Record<string, unknown>) =>
    Array.isArray(bundle.entry) ? bundle.entry as Array<{ resource?: Record<string, unknown> }> : [];

  for (const entry of entries(bundles.conditions)) {
    const r = entry.resource;
    if (!r) continue;
    items.push({
      resourceType: "condition",
      name: codingDisplay(r.code) || "Condition",
      date: (r.onsetDateTime as string) || (r.recordedDate as string) || null,
      source,
      status: (r.clinicalStatus as { coding?: Array<{ display?: string }> })?.coding?.[0]?.display || "Active",
      isDuplicate: false,
    });
  }

  for (const entry of entries(bundles.medications)) {
    const r = entry.resource;
    if (!r) continue;
    items.push({
      resourceType: "medication",
      name: codingDisplay(r.medicationCodeableConcept) || "Medication",
      date: (r.effectiveDateTime as string) || null,
      source,
      status: (r.status as string) || "Active",
      isDuplicate: false,
    });
  }

  for (const entry of entries(bundles.allergies)) {
    const r = entry.resource;
    if (!r) continue;
    items.push({
      resourceType: "allergy",
      name: codingDisplay(r.code) || "Allergy",
      date: (r.recordedDate as string) || null,
      source,
      status: (r.clinicalStatus as { coding?: Array<{ display?: string }> })?.coding?.[0]?.display || "Active",
      isDuplicate: false,
    });
  }

  for (const entry of entries(bundles.immunizations)) {
    const r = entry.resource;
    if (!r) continue;
    items.push({
      resourceType: "immunization",
      name: codingDisplay(r.vaccineCode) || "Immunization",
      date: (r.occurrenceDateTime as string) || null,
      source,
      status: (r.status as string) || "Completed",
      isDuplicate: false,
    });
  }

  return items;
}
