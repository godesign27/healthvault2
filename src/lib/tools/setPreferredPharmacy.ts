import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";

export const setPreferredPharmacyInputSchema = z.object({
  userId: z.string().min(1),
  pharmacyId: z.string().min(1),
});

export async function setPreferredPharmacy(input: unknown) {
  const parsed = setPreferredPharmacyInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input: " + parsed.error.issues[0]?.message };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { userId, pharmacyId } = parsed.data;

    // Verify the pharmacy belongs to this user
    const { data: pharmacy, error: fetchErr } = await supabase
      .from("pharmacies")
      .select("id, name")
      .eq("id", pharmacyId)
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchErr) {
      return { success: false, error: `Database error: ${fetchErr.message}` };
    }

    if (!pharmacy) {
      return { success: false, error: "Pharmacy not found or does not belong to this user." };
    }

    // Clear all preferred flags for this user
    const { error: clearError } = await supabase
      .from("pharmacies")
      .update({ preferred: false, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (clearError) {
      return { success: false, error: `Failed to clear preferred status: ${clearError.message}` };
    }

    // Set the selected pharmacy as preferred
    const { error: setError } = await supabase
      .from("pharmacies")
      .update({ preferred: true, updated_at: new Date().toISOString() })
      .eq("id", pharmacyId)
      .eq("user_id", userId);

    if (setError) {
      return { success: false, error: `Failed to set preferred pharmacy: ${setError.message}` };
    }

    return {
      success: true,
      data: {
        saved: true,
        pharmacy: {
          id: pharmacy.id,
          name: pharmacy.name,
          preferred: true,
        },
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
