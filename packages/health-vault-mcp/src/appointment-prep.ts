import type { SupabaseClient } from "@supabase/supabase-js";
import { getAllergies, getConditions, getHealthRecords, getMedications } from "./health-details.js";

export async function createAppointmentPrep(supabase: SupabaseClient, concerns: string[], questions: string[]) {
  const now = new Date().toISOString();
  const [appointmentResult, conditions, medications, allergies, recentRecords] = await Promise.all([
    supabase.from("appointments")
      .select("id, provider_name, appointment_type, scheduled_at, location, notes")
      .eq("status", "scheduled")
      .gte("scheduled_at", now)
      .order("scheduled_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    getConditions(supabase, true),
    getMedications(supabase, true),
    getAllergies(supabase),
    getHealthRecords(supabase, 5),
  ]);
  if (appointmentResult.error) throw new Error(`Unable to read upcoming appointment: ${appointmentResult.error.message}`);
  const appointment = appointmentResult.data;
  const suggestedQuestions = [
    "Are there any changes I should make to my current medications?",
    "Are any follow-up tests or records needed after this visit?",
    "What symptoms or changes should prompt me to contact the care team?",
  ];
  return {
    appointment,
    visitGoals: concerns,
    questionsToAsk: [...questions, ...suggestedQuestions].filter((value, index, all) => all.indexOf(value) === index).slice(0, 8),
    relevantContext: {
      activeConditions: conditions.slice(0, 10),
      activeMedications: medications.slice(0, 10),
      allergies: allergies.slice(0, 10),
      recentRecords,
    },
    provenance: { source: "health_vault_confirmed_records", generatedAt: new Date().toISOString() },
    confirmationState: "not_required",
    safeSummary: appointment
      ? `Appointment-prep brief for ${appointment.appointment_type || "visit"} with ${appointment.provider_name || "your provider"}.`
      : "Appointment-prep brief created without a scheduled appointment.",
    medicalDisclaimer: "Review this informational brief for accuracy. It is not medical advice or a diagnosis.",
  };
}
