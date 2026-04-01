import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";

export const getMedicationsInputSchema = z.object({
  userId: z.string().min(1),
  activeOnly: z.boolean().default(false),
});

export type GetMedicationsInput = z.infer<typeof getMedicationsInputSchema>;

export async function getMedications(input: unknown) {
  const parsed = getMedicationsInputSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { userId, activeOnly } = parsed.data;
    const today = new Date().toISOString().split("T")[0];

    let query = supabase
      .from("medications")
      .select("id, name, dosage, frequency, prescribed_by, start_date, end_date, notes, refills_total, refills_remaining")
      .eq("user_id", userId)
      .order("start_date", { ascending: false, nullsFirst: false });

    if (activeOnly) {
      query = query.or(`end_date.is.null,end_date.gte.${today}`);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    const medications = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      dosage: row.dosage,
      frequency: row.frequency,
      prescriber: row.prescribed_by,
      startedAt: row.start_date,
      endDate: row.end_date,
      status: !row.end_date || row.end_date >= today ? "active" : "inactive",
      refillsTotal: row.refills_total,
      refillsRemaining: row.refills_remaining,
      notes: row.notes,
    }));

    return {
      success: true,
      data: {
        total: medications.length,
        medications,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
