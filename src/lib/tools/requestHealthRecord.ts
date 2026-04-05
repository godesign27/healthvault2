import { z } from "zod";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

export const requestHealthRecordInputSchema = z.object({
  userId: z.string().min(1),
  providerName: z.string().min(1),
  providerEmail: z.string().email(),
  providerId: z.string().optional(),
  doctorName: z.string().optional(),
  patientName: z.string().optional(),
  recordTypes: z.array(z.string()).optional(),
  dateRangeStart: z.string().optional(),
  dateRangeEnd: z.string().optional(),
  message: z.string().optional(),
  notes: z.string().optional(),
  urgency: z.enum(["routine", "urgent", "stat"]).optional(),
  confirmed: z.boolean(),
});

export async function requestHealthRecord(input: unknown) {
  const parsed = requestHealthRecordInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input",
    };
  }

  const args = parsed.data;

  if (!args.confirmed) {
    return { success: false, error: "Record request requires confirmation." };
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return { success: false, error: "Server Supabase configuration missing." };
  }

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/record-request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        userId: args.userId,
        providerName: args.providerName,
        providerEmail: args.providerEmail,
        providerId: args.providerId,
        doctorName: args.doctorName,
        patientName: args.patientName,
        recordTypes:
          args.recordTypes && args.recordTypes.length > 0
            ? args.recordTypes
            : ['OTHER'],
        dateRangeStart: args.dateRangeStart,
        dateRangeEnd: args.dateRangeEnd,
        message: args.message,
        notes: args.notes,
        urgency: args.urgency ?? "routine",
      }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        error: typeof body.error === "string" ? body.error : `Request failed (${res.status})`,
      };
    }

    return {
      success: true,
      data: {
        requestId: body.id,
        providerName: args.providerName,
        status: body.status,
        emailSent: body.emailSent,
        emailError: body.emailError ?? null,
        expiresAt: body.expiresAt ?? null,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
