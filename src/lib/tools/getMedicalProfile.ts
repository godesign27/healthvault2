import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";

export const getMedicalProfileInputSchema = z.object({
  userId: z.string().min(1),
});

export type GetMedicalProfileInput = z.infer<typeof getMedicalProfileInputSchema>;

export async function getMedicalProfile(input: unknown) {
  const parsed = getMedicalProfileInputSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { userId } = parsed.data;
    const today = new Date().toISOString().split("T")[0];

    const [userRes, patientRes, conditionsRes, medsRes, allergiesRes, immunizationsRes, preventiveRes] =
      await Promise.all([
        supabase
          .from("user_profiles")
          .select("first_name, last_name, email, date_of_birth, phone")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("patient_profiles")
          .select("blood_type, organ_donor, emergency_contact_name, emergency_contact_phone")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("conditions")
          .select("id, name, status, diagnosed_on, managing_physician, notes")
          .eq("user_id", userId)
          .order("name", { ascending: true }),
        supabase
          .from("medications")
          .select("id, name, dosage, frequency, prescriber, start_date, end_date, status")
          .eq("user_id", userId)
          .order("name", { ascending: true }),
        supabase
          .from("allergies")
          .select("id, allergen, severity, reaction, diagnosed_on")
          .eq("user_id", userId)
          .order("allergen", { ascending: true }),
        supabase
          .from("immunizations")
          .select("id, vaccine, administered_on, provider, lot_number, next_dose")
          .eq("user_id", userId)
          .order("administered_on", { ascending: false, nullsFirst: false }),
        supabase
          .from("preventive_care")
          .select("id, item_name, status, recommended_date, next_due_date")
          .eq("user_id", userId)
          .order("recommended_date", { ascending: true, nullsFirst: false }),
      ]);

    const user = userRes.data;
    const patient = patientRes.data;

    const activeConditions = (conditionsRes.data || []).filter(
      (c: any) => c.status === "Active"
    );
    const allergyList = allergiesRes.data || [];

    const patientCard = {
      fullName: user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : null,
      dateOfBirth: user?.date_of_birth || null,
      allergiesSummary:
        allergyList.length > 0
          ? allergyList.map((a: any) => a.allergen).join(", ")
          : "None reported",
      conditionsSummary:
        activeConditions.length > 0
          ? activeConditions.map((c: any) => c.name).join(", ")
          : "None reported",
      organDonorStatus: patient?.organ_donor ? "Yes" : "Not listed",
      bloodType: patient?.blood_type || "Not listed",
      emergencyContact: patient?.emergency_contact_name || null,
    };

    const conditions = (conditionsRes.data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      diagnosedOn: c.diagnosed_on,
      managingPhysician: c.managing_physician,
      summary: c.notes || null,
    }));

    const medications = (medsRes.data || []).map((m: any) => ({
      id: m.id,
      name: m.name,
      dosage: m.dosage,
      instructions: m.frequency,
      prescriber: m.prescriber,
      startedAt: m.start_date,
      active: !m.end_date || m.end_date >= today,
    }));

    const allergies = allergyList.map((a: any) => ({
      id: a.id,
      name: a.allergen,
      severity: a.severity,
      reaction: a.reaction,
      diagnosedAt: a.diagnosed_on,
    }));

    const immunizations = (immunizationsRes.data || []).map((i: any) => ({
      id: i.id,
      name: i.vaccine,
      administeredAt: i.administered_on,
      provider: i.provider,
      lotNumber: i.lot_number,
    }));

    const preventiveCare = (preventiveRes.data || []).map((p: any) => ({
      id: p.id,
      title: p.item_name,
      status: p.status,
      dueDate: p.next_due_date || p.recommended_date || null,
    }));

    return {
      success: true,
      data: {
        patientCard,
        conditions,
        medications,
        allergies,
        immunizations,
        preventiveCare,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
