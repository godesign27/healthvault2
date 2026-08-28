import type { SupabaseClient } from "@supabase/supabase-js";
import { formatProfileAddress } from "./profile-address.js";

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

function normalized(value: unknown): string {
  return String(value ?? "").trim().toLocaleLowerCase();
}

function uniqueBy<T>(rows: T[], key: (row: T) => string): T[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const value = key(row);
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

export async function getHealthSummary(supabase: SupabaseClient) {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  const [profile, patientProfile, conditions, medications, allergies, records, appointments, coverages, preferences] =
    await Promise.all([
      supabase
        .from("user_profiles")
        .select("first_name, last_name, profile_photo_url, email, phone, date_of_birth, address_line1, address_line2, city, state, postal_code, email_verified, identity_verified, onboarding_complete")
        .maybeSingle(),
      supabase
        .from("patient_profiles")
        .select("blood_type, organ_donor, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship")
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

  const profileRow = profile.data as {
    first_name?: string;
    last_name?: string;
    profile_photo_url?: string;
    email?: string;
    phone?: string;
    date_of_birth?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    email_verified?: boolean;
    identity_verified?: boolean;
    onboarding_complete?: boolean;
  } | null;
  const patientProfileRow = patientProfile.data as {
    blood_type?: string;
    organ_donor?: boolean;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact_relationship?: string;
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
      .limit(50),
    supabase
      .from("medications")
      .select("id, name, dosage, frequency, prescribed_by, start_date, end_date")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("allergies")
      .select("id, allergen, reaction, severity")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("health_records")
      .select("id, title, kind, provider_name, service_date, received_at")
      .order("service_date", { ascending: false, nullsFirst: false })
      .limit(50),
  ]);
  const detailRows = detailResults.map((result) =>
    result.status === "fulfilled" && !result.value.error
      ? result.value.data ?? []
      : [],
  );
  const conditionRows = uniqueBy(
    detailRows[0] as Array<{ name?: string; status?: string }>,
    (row) => `${normalized(row.name)}|${normalized(row.status)}`,
  );
  const activeMedicationRows = uniqueBy(
    (detailRows[1] as Array<{ name?: string; dosage?: string; frequency?: string; end_date?: string | null }>).filter(
      ({ end_date }) => !end_date || end_date >= today,
    ),
    (row) => `${normalized(row.name)}|${normalized(row.dosage)}|${normalized(row.frequency)}`,
  );
  const allergyRows = uniqueBy(
    detailRows[2] as Array<{ allergen?: string; reaction?: string }>,
    (row) => `${normalized(row.allergen)}|${normalized(row.reaction)}`,
  );
  const recordRows = uniqueBy(
    detailRows[3] as Array<{ title?: string; provider_name?: string; service_date?: string }>,
    (row) => `${normalized(row.title)}|${normalized(row.provider_name)}|${normalized(row.service_date)}`,
  );

  return {
    patientName:
      [profileRow?.first_name, profileRow?.last_name].filter(Boolean).join(" ") || null,
    profile: {
      photoUrl: profileRow?.profile_photo_url || null,
      location: [profileRow?.city, profileRow?.state].filter(Boolean).join(", ") || null,
      identityVerified: Boolean(profileRow?.identity_verified),
      private: {
        dateOfBirth: profileRow?.date_of_birth || null,
        email: profileRow?.email || null,
        phone: profileRow?.phone || null,
        address: profileRow?.address_line1 && profileRow?.city && profileRow?.state && profileRow?.postal_code
          ? formatProfileAddress({
              addressLine1: profileRow.address_line1,
              addressLine2: profileRow.address_line2,
              city: profileRow.city,
              state: profileRow.state,
              postalCode: profileRow.postal_code,
            })
          : [
              profileRow?.address_line1,
              profileRow?.address_line2,
              [profileRow?.city, profileRow?.state, profileRow?.postal_code].filter(Boolean).join(" "),
            ].filter(Boolean).join(", ") || null,
        bloodType: patientProfileRow?.blood_type || null,
        organDonor: typeof patientProfileRow?.organ_donor === "boolean" ? patientProfileRow.organ_donor : null,
        emergencyContact: patientProfileRow?.emergency_contact_name
          ? {
              name: patientProfileRow.emergency_contact_name,
              relationship: patientProfileRow.emergency_contact_relationship || null,
              phone: patientProfileRow.emergency_contact_phone || null,
            }
          : null,
      },
    },
    activeConditions: conditionRows.length,
    activeMedications: activeMedicationRows.length,
    allergies: allergyRows.length,
    healthRecords: recordRows.length,
    details: {
      conditions: conditionRows,
      medications: activeMedicationRows,
      allergies: allergyRows,
      recentRecords: recordRows,
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
