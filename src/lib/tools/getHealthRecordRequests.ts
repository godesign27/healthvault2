import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";

export const getHealthRecordRequestsInputSchema = z.object({
  userId: z.string().min(1),
  requestId: z.string().optional(),
  status: z.enum(["pending", "sent", "received", "failed"]).optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

export type GetHealthRecordRequestsInput = z.infer<
  typeof getHealthRecordRequestsInputSchema
>;

export async function getHealthRecordRequests(input: unknown) {
  const parsed = getHealthRecordRequestsInputSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { userId, requestId, status, limit } = parsed.data;

    let query = supabase
      .from("health_record_requests")
      .select(
        "id, provider_name, provider_id, provider_email, doctor_name, patient_name, record_types, date_range_start, date_range_end, status, notes, message, urgency, created_at, updated_at, opened_at, submitted_at, expires_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (requestId) {
      query = query.eq("id", requestId);
    }
    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    const requests = (data || []).map((r: any) => ({
      id: r.id,
      providerName: r.provider_name,
      providerId: r.provider_id,
      providerEmail: r.provider_email,
      doctorName: r.doctor_name,
      patientName: r.patient_name,
      recordTypes: r.record_types || [],
      dateRangeStart: r.date_range_start,
      dateRangeEnd: r.date_range_end,
      status: r.status,
      notes: r.notes,
      messagePreview: r.message ? String(r.message).slice(0, 200) : null,
      urgency: r.urgency,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      openedAt: r.opened_at,
      submittedAt: r.submitted_at,
      expiresAt: r.expires_at,
    }));

    return {
      success: true,
      data: {
        total: requests.length,
        requests,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
