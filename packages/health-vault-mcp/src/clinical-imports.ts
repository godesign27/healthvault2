import type { SupabaseClient } from "@supabase/supabase-js";

type HealthImportSource = "chatgpt_health_apple_health" | "chatgpt_health_medical_records" | "provider_fhir";

export const CLINICAL_RECORD_TYPES = ["medication", "condition", "allergy", "immunization", "lab", "encounter", "document"] as const;
export type ClinicalRecordType = typeof CLINICAL_RECORD_TYPES[number];

export type ClinicalRecordInput = {
  recordType: ClinicalRecordType;
  title: string;
  code?: string;
  status?: string;
  effectiveDate?: string;
  providerName?: string;
  sourceRecordId?: string;
  details?: Record<string, string | number | boolean | null>;
};

export type ClinicalImportInput = {
  sourceKind: HealthImportSource;
  sourceName: string;
  idempotencyKey: string;
  records: ClinicalRecordInput[];
};

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
  return JSON.stringify(value);
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function normalizeClinicalImport(input: ClinicalImportInput) {
  const sourceName = input.sourceName.trim();
  if (!sourceName) throw new Error("Name the ChatGPT Health account or record source.");
  const records = await Promise.all(input.records.map(async (item) => {
    const title = item.title.trim();
    if (!title) throw new Error("Every health record needs a title.");
    let effectiveDate: string | undefined;
    if (item.effectiveDate) {
      const date = new Date(`${item.effectiveDate}T00:00:00Z`);
      if (!Number.isFinite(date.getTime())) throw new Error("Every record date must be valid.");
      if (date.getTime() > Date.now() + 86_400_000) throw new Error("A health record cannot be dated in the future.");
      effectiveDate = item.effectiveDate;
    }
    const normalized = {
      recordType: item.recordType, title,
      ...(item.code?.trim() ? { code: item.code.trim() } : {}),
      ...(item.status?.trim() ? { status: item.status.trim() } : {}),
      ...(effectiveDate ? { effectiveDate } : {}),
      ...(item.providerName?.trim() ? { providerName: item.providerName.trim() } : {}),
      ...(item.sourceRecordId?.trim() ? { sourceRecordId: item.sourceRecordId.trim() } : {}),
      details: item.details ?? {},
    };
    return { ...normalized, fingerprint: await sha256(canonical({ sourceKind: input.sourceKind, sourceName, ...normalized })) };
  }));
  if (new Set(records.map((item) => item.fingerprint)).size !== records.length) throw new Error("The same health record appears more than once in this review.");
  return { sourceKind: input.sourceKind, sourceName, records };
}

export async function previewClinicalImport(supabase: SupabaseClient, userId: string, input: ClinicalImportInput) {
  const normalized = await normalizeClinicalImport(input);
  const payloadHash = await sha256(canonical(normalized));
  const { data: existing, error: existingError } = await supabase.from("health_import_proposals")
    .select("id, payload_hash, status, expires_at, result").eq("user_id", userId).eq("idempotency_key", input.idempotencyKey).maybeSingle();
  if (existingError) throw new Error(`Unable to check the record review: ${existingError.message}`);
  if (existing) {
    if (existing.payload_hash !== payloadHash) throw new Error("This review request was already used with different records. Start a new review.");
    return { proposalId: existing.id, sourceKind: normalized.sourceKind, sourceName: normalized.sourceName, status: existing.status, saved: existing.status === "confirmed", expiresAt: existing.expires_at, items: normalized.records.map(({ fingerprint: _fingerprint, ...item }) => item), requiresConfirmation: existing.status === "pending", result: existing.result };
  }
  const fingerprints = normalized.records.map((item) => item.fingerprint);
  const { data: duplicates, error: duplicateError } = await supabase.from("connected_health_records").select("fingerprint").in("fingerprint", fingerprints);
  if (duplicateError) throw new Error(`Unable to compare existing records: ${duplicateError.message}`);
  const duplicateSet = new Set((duplicates ?? []).map((row: { fingerprint: string }) => row.fingerprint));
  const { data: proposal, error } = await supabase.from("health_import_proposals").insert({ user_id: userId, source_kind: normalized.sourceKind,
    source_name: normalized.sourceName, idempotency_key: input.idempotencyKey, payload_hash: payloadHash, payload: normalized,
    expires_at: new Date(Date.now() + 30 * 60_000).toISOString() }).select("id, status, expires_at").single();
  if (error) throw new Error(`Unable to create the record review: ${error.message}`);
  return { proposalId: proposal.id, sourceKind: normalized.sourceKind, sourceName: normalized.sourceName, status: proposal.status, saved: false,
    expiresAt: proposal.expires_at, items: normalized.records.map(({ fingerprint, ...item }) => ({ ...item, importState: duplicateSet.has(fingerprint) ? "duplicate" : "new" })),
    summary: { total: normalized.records.length, new: normalized.records.length - duplicateSet.size, duplicates: duplicateSet.size }, requiresConfirmation: true };
}

export async function listConnectedHealthRecords(supabase: SupabaseClient, limit: number) {
  const { data, error } = await supabase.from("connected_health_records")
    .select("id, record_type, title, code, status, effective_date, provider_name, details, source_kind, source_name, created_at")
    .order("effective_date", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(limit);
  if (error) throw new Error(`Unable to read connected health records: ${error.message}`);
  return data ?? [];
}
