export async function fetchFhirBundle(
  fhirBaseUrl: string,
  resourceType: string,
  accessToken: string,
  patientId: string,
): Promise<Record<string, unknown>> {
  const base = fhirBaseUrl.replace(/\/+$/, "");
  const url = new URL(`${base}/${resourceType}`);
  url.searchParams.set("patient", patientId);
  if (resourceType === "MedicationStatement") {
    url.searchParams.set("_include", "MedicationStatement:medication");
  }

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

function nonEmptyText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function codingDisplay(code: unknown): string | null {
  if (!code || typeof code !== "object") return null;
  const c = code as { text?: unknown; coding?: Array<{ display?: unknown }> };
  return nonEmptyText(c.text) || (Array.isArray(c.coding)
    ? c.coding.map(coding => nonEmptyText(coding?.display)).find(Boolean) || null
    : null);
}

type FhirResource = Record<string, unknown>;
type BundleEntry = { fullUrl?: string; resource?: FhirResource };

function medicationName(statement: FhirResource, entry: BundleEntry, entries: BundleEntry[]): string {
  const direct = codingDisplay(statement.medicationCodeableConcept);
  if (direct) return direct;
  const ref = statement.medicationReference as { reference?: unknown; display?: unknown } | undefined;
  const reference = nonEmptyText(ref?.reference);
  let medication: FhirResource | undefined;
  if (reference?.startsWith("#")) {
    // Contained identifiers are scoped to this statement, never the whole bundle.
    const contained = Array.isArray(statement.contained) ? statement.contained as FhirResource[] : [];
    medication = contained.find(r => r?.resourceType === "Medication" && r.id === reference.slice(1));
  } else if (reference) {
    let absoluteReference: string | null = null;
    // Resolve a relative Medication/id only against the enclosing statement's fullUrl.
    // Do not match an external absolute reference to a local medication with the same id.
    if (/^Medication\/[A-Za-z0-9.-]+$/.test(reference) && entry.fullUrl) {
      try {
        const base = entry.fullUrl.replace(/MedicationStatement\/[^/]+(?:\/_history\/[^/]+)?$/, "");
        if (base !== entry.fullUrl) absoluteReference = new URL(reference, base).href;
      } catch { /* Non-URL bundle identifiers can still be matched exactly below. */ }
    }
    medication = entries.find(e => e.resource?.resourceType === "Medication" && (
      e.fullUrl === reference || (absoluteReference !== null && e.fullUrl === absoluteReference) ||
      (!e.fullUrl && reference === `Medication/${e.resource.id}`)
    ))?.resource;
  }
  // Resolve only resources already returned in this bundle. Never send the bearer
  // token to a URL supplied by a clinical reference.
  return codingDisplay(medication?.code) || nonEmptyText(ref?.display) || "Medication";
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
    Array.isArray(bundle.entry) ? bundle.entry as BundleEntry[] : [];

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

  const medicationEntries = entries(bundles.medications);
  for (const entry of medicationEntries) {
    const r = entry.resource;
    // Included Medication resources supply names; they are not additional statements.
    if (!r || r.resourceType !== "MedicationStatement") continue;
    items.push({
      resourceType: "medication",
      name: medicationName(r, entry, medicationEntries),
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
