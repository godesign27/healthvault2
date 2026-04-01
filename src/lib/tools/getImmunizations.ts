import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";

export const getImmunizationsInputSchema = z.object({
  userId: z.string().min(1),
});

export type GetImmunizationsInput = z.infer<typeof getImmunizationsInputSchema>;

export async function getImmunizations(input: unknown) {
  const parsed = getImmunizationsInputSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { userId } = parsed.data;
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("immunizations")
      .select("id, vaccine, administered_on, provider, lot_number, next_dose, notes")
      .eq("user_id", userId)
      .order("administered_on", { ascending: false, nullsFirst: false });

    if (error) {
      return { success: false, error: error.message };
    }

    const immunizations = (data || []).map((row: any) => ({
      id: row.id,
      vaccine: row.vaccine,
      administeredOn: row.administered_on,
      provider: row.provider,
      lotNumber: row.lot_number,
      nextDose: row.next_dose,
      isUpcoming: row.next_dose ? row.next_dose >= today : false,
      notes: row.notes,
    }));

    const upcomingCount = immunizations.filter((i) => i.isUpcoming).length;

    return {
      success: true,
      data: {
        total: immunizations.length,
        upcomingCount,
        immunizations,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
