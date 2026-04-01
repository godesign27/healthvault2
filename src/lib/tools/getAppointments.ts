import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";

export const getAppointmentsInputSchema = z.object({
  userId: z.string().min(1),
  upcomingOnly: z.boolean().default(false),
  limit: z.number().int().min(1).max(100).default(20),
});

export type GetAppointmentsInput = z.infer<typeof getAppointmentsInputSchema>;

export async function getAppointments(input: unknown) {
  const parsed = getAppointmentsInputSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { userId, upcomingOnly, limit } = parsed.data;

    let query = supabase
      .from("appointments")
      .select("id, provider_name, appointment_type, scheduled_at, location, status, notes")
      .eq("user_id", userId)
      .order("scheduled_at", { ascending: true })
      .limit(limit);

    if (upcomingOnly) {
      query = query
        .gte("scheduled_at", new Date().toISOString())
        .eq("status", "scheduled");
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    const appointments = (data || []).map((row: any) => ({
      id: row.id,
      providerName: row.provider_name,
      appointmentType: row.appointment_type,
      scheduledAt: row.scheduled_at,
      location: row.location,
      status: row.status,
      notes: row.notes,
    }));

    return {
      success: true,
      data: {
        total: appointments.length,
        appointments,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
