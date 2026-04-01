import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";

export const getConditionsInputSchema = z.object({
  userId: z.string().min(1),
  activeOnly: z.boolean().default(false),
});

export type GetConditionsInput = z.infer<typeof getConditionsInputSchema>;

export async function getConditions(input: unknown) {
  const parsed = getConditionsInputSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { userId, activeOnly } = parsed.data;

    let query = supabase
      .from("conditions")
      .select("id, name, diagnosed_on, status, managing_physician, notes")
      .eq("user_id", userId)
      .order("name", { ascending: true });

    if (activeOnly) {
      query = query.eq("status", "Active");
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    const conditions = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      diagnosedOn: row.diagnosed_on,
      status: row.status,
      managingPhysician: row.managing_physician,
      notes: row.notes,
    }));

    const activeCount = conditions.filter((c) => c.status === "Active").length;

    return {
      success: true,
      data: {
        total: conditions.length,
        activeCount,
        conditions,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
