import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";

export const getMedicalIDInputSchema = z.object({
  userId: z.string().min(1),
});

export type GetMedicalIDInput = z.infer<typeof getMedicalIDInputSchema>;

export async function getMedicalID(input: unknown) {
  const parsed = getMedicalIDInputSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { userId } = parsed.data;

    const { data: profile, error: profileError } = await supabase
      .from("patient_profiles")
      .select(
        "id, name, birth_date, contact_email, contact_phone, blood_type, organ_donor, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship"
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    if (!profile) {
      return {
        success: true,
        data: null,
        message: "No patient profile found. Medical ID is not available.",
      };
    }

    const { data: conditions } = await supabase
      .from("conditions")
      .select("name, status")
      .eq("user_id", userId)
      .eq("status", "Active")
      .limit(10);

    const { data: allergies } = await supabase
      .from("allergies")
      .select("allergen, severity")
      .eq("user_id", userId)
      .limit(10);

    return {
      success: true,
      data: {
        name: profile.name,
        dateOfBirth: profile.birth_date,
        contactEmail: profile.contact_email,
        contactPhone: profile.contact_phone,
        bloodType: profile.blood_type || "Not listed",
        organDonor: profile.organ_donor ? "Yes" : "Not listed",
        emergencyContact: profile.emergency_contact_name
          ? {
              name: profile.emergency_contact_name,
              phone: profile.emergency_contact_phone,
              relationship: profile.emergency_contact_relationship,
            }
          : null,
        activeConditions: (conditions || []).map((c: any) => c.name),
        allergies: (allergies || []).map((a: any) => ({
          allergen: a.allergen,
          severity: a.severity,
        })),
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
