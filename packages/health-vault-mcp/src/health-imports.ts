import type { SupabaseClient } from "@supabase/supabase-js";

export const HEALTH_IMPORT_SOURCES = [
  "chatgpt_health_apple_health",
  "chatgpt_health_medical_records",
  "provider_fhir",
] as const;

export const VITAL_METRICS = [
  "heart_rate",
  "blood_pressure",
  "respiratory_rate",
  "oxygen_saturation",
  "body_temperature",
  "weight",
  "blood_glucose",
  "steps",
  "sleep_duration",
  "active_energy",
  "workout_duration",
] as const;

export type HealthImportSource = typeof HEALTH_IMPORT_SOURCES[number];
export type VitalMetric = typeof VITAL_METRICS[number];

export type VitalImportInput = {
  metric: VitalMetric;
  value: number;
  secondaryValue?: number;
  unit: string;
  observedAt: string;
  sourceRecordId?: string;
  deviceName?: string;
};

export type HealthImportInput = {
  sourceKind: HealthImportSource;
  sourceName: string;
  idempotencyKey: string;
  vitals: VitalImportInput[];
};

const allowedUnits: Record<VitalMetric, readonly string[]> = {
  heart_rate: ["bpm"],
  blood_pressure: ["mmHg"],
  respiratory_rate: ["breaths/min"],
  oxygen_saturation: ["%"],
  body_temperature: ["Cel", "[degF]"],
  weight: ["kg", "lb"],
  blood_glucose: ["mg/dL", "mmol/L"],
  steps: ["count"],
  sleep_duration: ["min", "h"],
  active_energy: ["kcal"],
  workout_duration: ["min", "h"],
};

const bounds: Record<string, readonly [number, number]> = {
  "heart_rate:bpm": [20, 300],
  "blood_pressure:mmHg": [40, 300],
  "blood_pressure:mmHg:secondary": [20, 200],
  "respiratory_rate:breaths/min": [3, 80],
  "oxygen_saturation:%": [0, 100],
  "body_temperature:Cel": [25, 45],
  "body_temperature:[degF]": [77, 113],
  "weight:kg": [0.5, 1000],
  "weight:lb": [1, 2205],
  "blood_glucose:mg/dL": [10, 2000],
  "blood_glucose:mmol/L": [0.5, 111],
  "steps:count": [0, 1_000_000],
  "sleep_duration:min": [0, 1440],
  "sleep_duration:h": [0, 24],
  "active_energy:kcal": [0, 100_000],
  "workout_duration:min": [0, 1440],
  "workout_duration:h": [0, 24],
};

function assertBounded(label: string, value: number, range: readonly [number, number]) {
  if (!Number.isFinite(value) || value < range[0] || value > range[1]) throw new Error(`${label} is outside the supported measurement range.`);
}

function supportedRange(key: string): readonly [number, number] {
  const range = bounds[key];
  if (!range) throw new Error("This measurement does not have a supported validation range.");
  return range;
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function normalizeHealthImport(input: HealthImportInput) {
  const sourceName = input.sourceName.trim();
  if (!sourceName) throw new Error("Name the connected health source before previewing the import.");
  const vitals = await Promise.all(input.vitals.map(async (item) => {
    if (!allowedUnits[item.metric].includes(item.unit)) throw new Error(`${item.unit} is not a supported unit for ${item.metric.replaceAll("_", " ")}.`);
    if (item.metric === "blood_pressure" && item.secondaryValue == null) throw new Error("Blood pressure requires both systolic and diastolic values.");
    if (item.metric !== "blood_pressure" && item.secondaryValue != null) throw new Error(`A second value is not valid for ${item.metric.replaceAll("_", " ")}.`);
    assertBounded(item.metric.replaceAll("_", " "), item.value, supportedRange(`${item.metric}:${item.unit}`));
    if (item.secondaryValue != null) assertBounded("blood pressure diastolic value", item.secondaryValue, supportedRange("blood_pressure:mmHg:secondary"));
    const observedAt = new Date(item.observedAt);
    if (!Number.isFinite(observedAt.getTime())) throw new Error("Every vital measurement needs a valid observation time.");
    if (observedAt.getTime() > Date.now() + 5 * 60_000) throw new Error("A vital measurement cannot be dated in the future.");
    const normalized = {
      metric: item.metric,
      value: item.value,
      ...(item.secondaryValue == null ? {} : { secondaryValue: item.secondaryValue }),
      unit: item.unit,
      observedAt: observedAt.toISOString(),
      ...(item.sourceRecordId?.trim() ? { sourceRecordId: item.sourceRecordId.trim() } : {}),
      ...(item.deviceName?.trim() ? { deviceName: item.deviceName.trim() } : {}),
    };
    const fingerprint = await sha256(canonical({ sourceKind: input.sourceKind, sourceName, ...normalized }));
    return { ...normalized, fingerprint };
  }));
  if (new Set(vitals.map((item) => item.fingerprint)).size !== vitals.length) throw new Error("The same vital measurement appears more than once in this import preview.");
  return { sourceKind: input.sourceKind, sourceName, vitals };
}

export async function previewHealthImport(supabase: SupabaseClient, userId: string, input: HealthImportInput) {
  const normalized = await normalizeHealthImport(input);
  const publicItems = normalized.vitals.map(({ fingerprint: _fingerprint, ...item }) => item);
  const payloadHash = await sha256(canonical(normalized));
  const { data: existingProposal, error: existingError } = await supabase
    .from("health_import_proposals")
    .select("id, payload_hash, status, expires_at, result")
    .eq("user_id", userId)
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();
  if (existingError) throw new Error(`Unable to check the import preview: ${existingError.message}`);
  if (existingProposal) {
    if (existingProposal.payload_hash !== payloadHash) throw new Error("This import request was already used with different information. Start a new preview.");
    return { proposalId: existingProposal.id, sourceKind: normalized.sourceKind, sourceName: normalized.sourceName, status: existingProposal.status, saved: existingProposal.status === "confirmed", expiresAt: existingProposal.expires_at, items: publicItems, requiresConfirmation: existingProposal.status === "pending", result: existingProposal.result };
  }

  const fingerprints = normalized.vitals.map((item) => item.fingerprint);
  const { data: duplicates, error: duplicateError } = fingerprints.length
    ? await supabase.from("vital_measurements").select("fingerprint").in("fingerprint", fingerprints)
    : { data: [], error: null };
  if (duplicateError) throw new Error(`Unable to compare existing vitals: ${duplicateError.message}`);
  const duplicateSet = new Set((duplicates ?? []).map((row: { fingerprint: string }) => row.fingerprint));
  const expiresAt = new Date(Date.now() + 30 * 60_000).toISOString();
  const { data: proposal, error } = await supabase.from("health_import_proposals").insert({
    user_id: userId,
    source_kind: normalized.sourceKind,
    source_name: normalized.sourceName,
    idempotency_key: input.idempotencyKey,
    payload_hash: payloadHash,
    payload: normalized,
    expires_at: expiresAt,
  }).select("id, status, expires_at").single();
  if (error) throw new Error(`Unable to create the import preview: ${error.message}`);
  return {
    proposalId: proposal.id,
    sourceKind: normalized.sourceKind,
    sourceName: normalized.sourceName,
    status: proposal.status,
    saved: false,
    expiresAt: proposal.expires_at,
    items: normalized.vitals.map(({ fingerprint, ...item }) => ({ ...item, importState: duplicateSet.has(fingerprint) ? "duplicate" : "new" })),
    summary: { total: normalized.vitals.length, new: normalized.vitals.length - duplicateSet.size, duplicates: duplicateSet.size },
    requiresConfirmation: true,
  };
}

export async function confirmHealthImport(supabase: SupabaseClient, proposalId: string) {
  const { data, error } = await supabase.rpc("confirm_health_import_proposal", { p_proposal_id: proposalId });
  if (error) throw new Error(`Unable to import the health information: ${error.message}`);
  return data;
}

export async function listVitalMeasurements(supabase: SupabaseClient, days: number) {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data, error } = await supabase.from("vital_measurements")
    .select("id, metric, value, secondary_value, unit, observed_at, source_kind, source_name, device_name")
    .gte("observed_at", since)
    .order("observed_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(`Unable to read vital measurements: ${error.message}`);
  return data ?? [];
}
