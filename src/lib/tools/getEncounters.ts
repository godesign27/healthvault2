import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";

export const getEncountersInputSchema = z.object({
  userId: z.string().min(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type GetEncountersInput = z.infer<typeof getEncountersInputSchema>;

export async function getEncounters(input: unknown) {
  const parsed = getEncountersInputSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { userId, limit } = parsed.data;

    const { data, error } = await supabase
      .from("encounters")
      .select("id, title, encounter_date, provider_name, location, encounter_type, description")
      .eq("user_id", userId)
      .order("encounter_date", { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message };
    }

    const encounters = (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      encounterDate: row.encounter_date,
      providerName: row.provider_name,
      location: row.location,
      encounterType: row.encounter_type,
      description: row.description,
    }));

    return {
      success: true,
      data: {
        total: encounters.length,
        encounters,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
