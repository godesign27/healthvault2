import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";

export const getPreventiveCareInputSchema = z.object({
  userId: z.string().min(1),
  statusFilter: z
    .enum(["due", "overdue", "scheduled", "completed", "declined"])
    .optional(),
});

export type GetPreventiveCareInput = z.infer<typeof getPreventiveCareInputSchema>;

export async function getPreventiveCare(input: unknown) {
  const parsed = getPreventiveCareInputSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { userId, statusFilter } = parsed.data;

    let query = supabase
      .from("preventive_care")
      .select(
        "id, item_name, category, status, recommended_date, completed_date, next_due_date, frequency, provider, notes, source"
      )
      .eq("user_id", userId)
      .order("recommended_date", { ascending: true, nullsFirst: false });

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    const today = new Date().toISOString().split("T")[0];

    const items = (data || []).map((row: any) => ({
      id: row.id,
      itemName: row.item_name,
      category: row.category,
      status: row.status,
      recommendedDate: row.recommended_date,
      completedDate: row.completed_date,
      nextDueDate: row.next_due_date,
      frequency: row.frequency,
      provider: row.provider,
      notes: row.notes,
      source: row.source,
      isOverdue:
        row.status === "due" && row.recommended_date && row.recommended_date < today,
    }));

    const dueCount = items.filter((i) => i.status === "due" || i.isOverdue).length;
    const overdueCount = items.filter((i) => i.isOverdue).length;

    return {
      success: true,
      data: {
        total: items.length,
        dueCount,
        overdueCount,
        items,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
