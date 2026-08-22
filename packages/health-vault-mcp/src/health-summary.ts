import type { SupabaseClient } from "@supabase/supabase-js";

type QueryResult = {
  count: number | null;
  data: unknown;
  error: { message: string } | null;
};

function assertSuccessful(label: string, result: QueryResult): void {
  if (result.error) {
    throw new Error(`Unable to read ${label}: ${result.error.message}`);
  }
}

export async function getHealthSummary(supabase: SupabaseClient) {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  const [profile, conditions, medications, allergies, records, appointments, coverages, preferences] =
    await Promise.all([
      supabase
        .from("user_profiles")
        .select("first_name, last_name, email_verified, identity_verified, onboarding_complete")
        .maybeSingle(),
      supabase
        .from("conditions")
        .select("id", { count: "exact", head: true })
        .eq("status", "Active"),
      supabase.from("medications").select("id, end_date"),
      supabase.from("allergies").select("id", { count: "exact", head: true }),
      supabase.from("health_records").select("id", { count: "exact", head: true }),
      supabase
        .from("appointments")
        .select("provider_name, appointment_type, scheduled_at, location")
        .eq("status", "scheduled")
        .gte("scheduled_at", now)
        .order("scheduled_at", { ascending: true })
        .limit(1),
      supabase.from("insurance_coverages").select("id", { count: "exact", head: true }),
      supabase.from("user_preferences").select("id").maybeSingle(),
    ]);

  assertSuccessful("profile", profile);
  assertSuccessful("conditions", conditions);
  assertSuccessful("medications", medications);
  assertSuccessful("allergies", allergies);
  assertSuccessful("health records", records);
  assertSuccessful("appointments", appointments);
  assertSuccessful("insurance coverages", coverages);
  assertSuccessful("preferences", preferences);

  const medicationRows = (medications.data ?? []) as Array<{ end_date: string | null }>;
  const activeMedications = medicationRows.filter(
    ({ end_date }) => !end_date || end_date >= today,
  ).length;
  const profileRow = profile.data as {
    first_name?: string;
    last_name?: string;
    email_verified?: boolean;
    identity_verified?: boolean;
    onboarding_complete?: boolean;
  } | null;
  const appointmentRows = (appointments.data ?? []) as Array<{
    provider_name: string | null;
    appointment_type: string | null;
    scheduled_at: string;
    location: string | null;
  }>;
  const nextAppointment = appointmentRows[0];
  const detailResults = await Promise.allSettled([
    supabase
      .from("conditions")
      .select("id, name, status, diagnosed_on, managing_physician, notes")
      .eq("status", "Active")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("medications")
      .select("id, name, dosage, frequency, prescribed_by, start_date, end_date")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("allergies")
      .select("id, allergen, reaction, severity")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("health_records")
      .select("id, title, kind, provider_name, service_date, received_at")
      .order("service_date", { ascending: false, nullsFirst: false })
      .limit(6),
  ]);
  const detailRows = detailResults.map((result) =>
    result.status === "fulfilled" && !result.value.error
      ? result.value.data ?? []
      : [],
  );
  const activeMedicationRows = (detailRows[1] as Array<{ end_date?: string | null }>).filter(
    ({ end_date }) => !end_date || end_date >= today,
  );

  return {
    patientName:
      [profileRow?.first_name, profileRow?.last_name].filter(Boolean).join(" ") || null,
    activeConditions: conditions.count ?? 0,
    activeMedications,
    allergies: allergies.count ?? 0,
    healthRecords: records.count ?? 0,
    details: {
      conditions: detailRows[0],
      medications: activeMedicationRows,
      allergies: detailRows[2],
      recentRecords: detailRows[3],
    },
    nextAppointment: nextAppointment
      ? {
          providerName: nextAppointment.provider_name,
          appointmentType: nextAppointment.appointment_type,
          scheduledAt: nextAppointment.scheduled_at,
          location: nextAppointment.location,
        }
      : null,
    onboarding: {
      complete: Boolean(profileRow?.onboarding_complete),
      checklist: [
        { key: "email", label: "Verify email", complete: Boolean(profileRow?.email_verified || profileRow?.onboarding_complete), optional: false },
        { key: "identity", label: "Complete identity profile", complete: Boolean(profileRow?.identity_verified || profileRow?.onboarding_complete), optional: false },
        { key: "insurance", label: "Add insurance", complete: (coverages.count ?? 0) > 0, optional: true },
        { key: "preferences", label: "Choose assistant preferences", complete: Boolean(preferences.data), optional: true },
      ],
    },
  };
}
