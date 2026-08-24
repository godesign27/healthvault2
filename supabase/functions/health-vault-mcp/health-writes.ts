import type { SupabaseClient } from "npm:@supabase/supabase-js@2.112.3";

const clean = (value?: string | null) => value?.trim() || null;
const normalize = (value?: string | null) => clean(value)?.toLocaleLowerCase() ?? "";

async function assertNotDuplicate(
  supabase: SupabaseClient,
  table: string,
  columns: string,
  matches: (row: Record<string, unknown>) => boolean,
  label: string,
) {
  const { data, error } = await supabase.from(table).select(columns).limit(100);
  if (error) throw new Error(`Unable to check existing ${label}: ${error.message}`);
  if (((data ?? []) as unknown as Array<Record<string, unknown>>).some((row) => matches(row))) {
    throw new Error(`This ${label} already exists in Health Vault. Nothing was added.`);
  }
}

export type ConditionInput = {
  name: string;
  status?: "Active" | "In remission" | "Resolved";
  diagnosedOn?: string;
  managingPhysician?: string;
  notes?: string;
};

export function previewCondition(input: ConditionInput) {
  return {
    name: input.name.trim(),
    status: input.status ?? "Active",
    diagnosedOn: clean(input.diagnosedOn),
    managingPhysician: clean(input.managingPhysician),
    notes: clean(input.notes),
    requiresConfirmation: true,
  };
}

export async function createCondition(supabase: SupabaseClient, userId: string, input: ConditionInput) {
  const preview = previewCondition(input);
  await assertNotDuplicate(
    supabase,
    "conditions",
    "id, name, status",
    (row) => normalize(row.name as string) === normalize(preview.name) && row.status === preview.status,
    "condition",
  );
  const { requiresConfirmation: _requiresConfirmation, ...value } = preview;
  const { data, error } = await supabase.from("conditions").insert({
    user_id: userId,
    name: value.name,
    status: value.status,
    diagnosed_on: value.diagnosedOn,
    managing_physician: value.managingPhysician,
    notes: value.notes,
  }).select("id, name, status, diagnosed_on, managing_physician, notes").single();
  if (error) throw new Error(`Unable to add condition: ${error.message}`);
  return data;
}

export type MedicationInput = {
  name: string;
  dosage?: string;
  frequency?: string;
  prescribedBy?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
};

export function previewMedication(input: MedicationInput) {
  return {
    name: input.name.trim(),
    dosage: clean(input.dosage),
    frequency: clean(input.frequency),
    prescribedBy: clean(input.prescribedBy),
    startDate: clean(input.startDate),
    endDate: clean(input.endDate),
    notes: clean(input.notes),
    requiresConfirmation: true,
  };
}

export async function createMedication(supabase: SupabaseClient, userId: string, input: MedicationInput) {
  const preview = previewMedication(input);
  await assertNotDuplicate(
    supabase,
    "medications",
    "id, name, dosage, frequency, end_date",
    (row) => normalize(row.name as string) === normalize(preview.name)
      && normalize(row.dosage as string) === normalize(preview.dosage)
      && normalize(row.frequency as string) === normalize(preview.frequency)
      && !row.end_date,
    "active medication",
  );
  const { requiresConfirmation: _requiresConfirmation, ...value } = preview;
  const { data, error } = await supabase.from("medications").insert({
    user_id: userId,
    name: value.name,
    dosage: value.dosage,
    frequency: value.frequency,
    prescribed_by: value.prescribedBy,
    start_date: value.startDate,
    end_date: value.endDate,
    notes: value.notes,
  }).select("id, name, dosage, frequency, prescribed_by, start_date, end_date, notes").single();
  if (error) throw new Error(`Unable to add medication: ${error.message}`);
  return data;
}

export type AllergyInput = {
  allergen: string;
  reaction?: string;
  severity?: "Mild" | "Moderate" | "Severe";
  diagnosedOn?: string;
  notes?: string;
};

export function previewAllergy(input: AllergyInput) {
  return {
    allergen: input.allergen.trim(),
    reaction: clean(input.reaction),
    severity: input.severity ?? null,
    diagnosedOn: clean(input.diagnosedOn),
    notes: clean(input.notes),
    requiresConfirmation: true,
  };
}

export async function createAllergy(supabase: SupabaseClient, userId: string, input: AllergyInput) {
  const preview = previewAllergy(input);
  await assertNotDuplicate(
    supabase,
    "allergies",
    "id, allergen, reaction",
    (row) => normalize(row.allergen as string) === normalize(preview.allergen)
      && normalize(row.reaction as string) === normalize(preview.reaction),
    "allergy",
  );
  const { requiresConfirmation: _requiresConfirmation, ...value } = preview;
  const { data, error } = await supabase.from("allergies").insert({
    user_id: userId,
    allergen: value.allergen,
    reaction: value.reaction,
    severity: value.severity,
    diagnosed_on: value.diagnosedOn,
    notes: value.notes,
  }).select("id, allergen, reaction, severity, diagnosed_on, notes").single();
  if (error) throw new Error(`Unable to add allergy: ${error.message}`);
  return data;
}

export type HealthRecordInput = {
  title: string;
  kind: "lab" | "imaging" | "pathology" | "specialist_report" | "other";
  providerName?: string;
  serviceDate?: string;
  summary?: string;
  tags?: string[];
};

export function previewHealthRecord(input: HealthRecordInput) {
  return {
    title: input.title.trim(),
    kind: input.kind,
    providerName: clean(input.providerName),
    serviceDate: clean(input.serviceDate),
    summary: clean(input.summary),
    tags: (input.tags ?? []).map((tag) => tag.trim()).filter(Boolean).slice(0, 12),
    source: "shared" as const,
    requiresConfirmation: true,
  };
}

export async function createHealthRecord(supabase: SupabaseClient, userId: string, input: HealthRecordInput) {
  const preview = previewHealthRecord(input);
  await assertNotDuplicate(
    supabase,
    "health_records",
    "id, title, provider_name, service_date",
    (row) => normalize(row.title as string) === normalize(preview.title)
      && normalize(row.provider_name as string) === normalize(preview.providerName)
      && row.service_date === preview.serviceDate,
    "health record",
  );
  const { requiresConfirmation: _requiresConfirmation, ...value } = preview;
  const { data, error } = await supabase.from("health_records").insert({
    user_id: userId,
    title: value.title,
    kind: value.kind,
    provider_name: value.providerName,
    service_date: value.serviceDate,
    ai_summary: value.summary,
    tags: value.tags,
    source: value.source,
  }).select("id, title, kind, provider_name, service_date, ai_summary, tags, source").single();
  if (error) throw new Error(`Unable to add health record: ${error.message}`);
  return data;
}

export async function previewAppointmentCancellation(supabase: SupabaseClient, appointmentId: string) {
  const { data, error } = await supabase.from("appointments")
    .select("id, provider_name, appointment_type, scheduled_at, location, status")
    .eq("id", appointmentId)
    .single();
  if (error) throw new Error(`Unable to find appointment: ${error.message}`);
  if (data.status !== "scheduled") throw new Error("Only a scheduled appointment can be cancelled");
  return { ...data, requiresConfirmation: true };
}

export async function cancelAppointment(supabase: SupabaseClient, appointmentId: string) {
  await previewAppointmentCancellation(supabase, appointmentId);
  const { data, error } = await supabase.from("appointments")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", appointmentId)
    .eq("status", "scheduled")
    .select("id, provider_name, appointment_type, scheduled_at, location, status")
    .single();
  if (error) throw new Error(`Unable to cancel appointment: ${error.message}`);
  return data;
}
