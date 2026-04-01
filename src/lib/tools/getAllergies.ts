import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";

export const getAllergiesInputSchema = z.object({
  userId: z.string().min(1),
});

export type GetAllergiesInput = z.infer<typeof getAllergiesInputSchema>;

export async function getAllergies(input: unknown) {
  const parsed = getAllergiesInputSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { userId } = parsed.data;

    const { data, error } = await supabase
      .from("allergies")
      .select("id, allergen, reaction, severity, diagnosed_on, notes")
      .eq("user_id", userId)
      .order("allergen", { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    const allergies = (data || []).map((row: any) => ({
      id: row.id,
      allergen: row.allergen,
      reaction: row.reaction,
      severity: row.severity,
      diagnosedOn: row.diagnosed_on,
      notes: row.notes,
    }));

    return {
      success: true,
      data: {
        total: allergies.length,
        allergies,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
