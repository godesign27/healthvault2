import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";

export const getCareOverviewInputSchema = z.object({
  userId: z.string().min(1),
});

export type GetCareOverviewInput = z.infer<typeof getCareOverviewInputSchema>;

export async function getCareOverview(input: unknown) {
  const parsed = getCareOverviewInputSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { userId } = parsed.data;
    const today = new Date().toISOString().split("T")[0];
    const nowIso = new Date().toISOString();

    const [
      careTeamRes,
      medsRes,
      conditionsRes,
      allergiesRes,
      immunizationsRes,
      recordsRes,
      appointmentsRes,
      nextApptRes,
      encountersRes,
      claimsRes,
    ] = await Promise.all([
      supabase.from("care_team").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("medications").select("id, end_date").eq("user_id", userId),
      supabase.from("conditions").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "Active"),
      supabase.from("allergies").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("immunizations").select("id, next_dose").eq("user_id", userId),
      supabase.from("health_records").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("appointments").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "scheduled").gte("scheduled_at", nowIso),
      supabase.from("appointments").select("provider_name, appointment_type, scheduled_at, location").eq("user_id", userId).eq("status", "scheduled").gte("scheduled_at", nowIso).order("scheduled_at", { ascending: true }).limit(1),
      supabase.from("encounters").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("claims").select("id", { count: "exact", head: true }).eq("user_id", userId),
    ]);

    const activeMedications = (medsRes.data || []).filter(
      (m: any) => !m.end_date || m.end_date >= today
    ).length;

    const upcomingImmunizations = (immunizationsRes.data || []).filter(
      (i: any) => i.next_dose && i.next_dose >= today
    ).length;

    const nextApptRow = nextApptRes.data?.[0];
    const nextAppointment = nextApptRow
      ? {
          providerName: nextApptRow.provider_name,
          appointmentType: nextApptRow.appointment_type,
          scheduledAt: nextApptRow.scheduled_at,
          location: nextApptRow.location,
        }
      : null;

    return {
      success: true,
      data: {
        careTeamCount: careTeamRes.count || 0,
        activeMedications,
        activeConditions: conditionsRes.count || 0,
        allergiesCount: allergiesRes.count || 0,
        healthRecordsCount: recordsRes.count || 0,
        upcomingImmunizations,
        appointmentsCount: appointmentsRes.count || 0,
        encountersCount: encountersRes.count || 0,
        claimsCount: claimsRes.count || 0,
        nextAppointment,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
