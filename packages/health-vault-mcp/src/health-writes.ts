import type { SupabaseClient } from "@supabase/supabase-js";
import { confirmHealthRecord } from "./health-record-confirmation.ts";

const clean = (value?: string | null) => value?.trim() || null;
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
  const { requiresConfirmation: _requiresConfirmation, ...value } = preview;
  return confirmHealthRecord(supabase, "conditions", {
    name: value.name,
    status: value.status,
    diagnosed_on: value.diagnosedOn,
    managing_physician: value.managingPhysician,
    notes: value.notes,
  });
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
  const { requiresConfirmation: _requiresConfirmation, ...value } = preview;
  return confirmHealthRecord(supabase, "medications", {
    name: value.name,
    dosage: value.dosage,
    frequency: value.frequency,
    prescribed_by: value.prescribedBy,
    start_date: value.startDate,
    end_date: value.endDate,
    notes: value.notes,
  });
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
  const { requiresConfirmation: _requiresConfirmation, ...value } = preview;
  return confirmHealthRecord(supabase, "allergies", {
    allergen: value.allergen,
    reaction: value.reaction,
    severity: value.severity,
    diagnosed_on: value.diagnosedOn,
    notes: value.notes,
  });
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
  const { requiresConfirmation: _requiresConfirmation, ...value } = preview;
  return confirmHealthRecord(supabase, "health_records", {
    title: value.title,
    kind: value.kind,
    provider_name: value.providerName,
    service_date: value.serviceDate,
    ai_summary: value.summary,
    tags: value.tags,
    source: value.source,
  });
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
