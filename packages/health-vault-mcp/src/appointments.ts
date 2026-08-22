import type { SupabaseClient } from "@supabase/supabase-js";

export type AppointmentInput = {
  providerName: string;
  appointmentType: string;
  scheduledAt: string;
  location?: string;
  notes?: string;
};

export function previewAppointment(input: AppointmentInput) {
  const scheduledAt = new Date(input.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) {
    throw new Error("Appointment date and time must be a valid ISO 8601 value with a timezone");
  }
  if (scheduledAt.getTime() <= Date.now()) {
    throw new Error("Appointment date and time must be in the future");
  }

  return {
    providerName: input.providerName.trim(),
    appointmentType: input.appointmentType.trim(),
    scheduledAt: scheduledAt.toISOString(),
    location: input.location?.trim() || null,
    notes: input.notes?.trim() || null,
    status: "scheduled" as const,
    requiresConfirmation: true,
  };
}

export async function createAppointment(
  supabase: SupabaseClient,
  userId: string,
  input: AppointmentInput,
) {
  const preview = previewAppointment(input);
  const { requiresConfirmation: _requiresConfirmation, ...appointment } = preview;
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      user_id: userId,
      provider_name: appointment.providerName,
      appointment_type: appointment.appointmentType,
      scheduled_at: appointment.scheduledAt,
      location: appointment.location,
      notes: appointment.notes,
      status: appointment.status,
    })
    .select("id, provider_name, appointment_type, scheduled_at, location, status, notes")
    .single();

  if (error) throw new Error(`Unable to add appointment: ${error.message}`);
  return data;
}
