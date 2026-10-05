import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";

export const saveFormAnswersInputSchema = z.object({
  userId: z.string().min(1),
  formId: z.string().min(1),
  values: z.record(z.string(), z.unknown()),
  markComplete: z.boolean().default(false),
});

export type SaveFormAnswersInput = z.infer<typeof saveFormAnswersInputSchema>;

export async function saveFormAnswers(input: unknown) {
  const parsed = saveFormAnswersInputSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { userId, formId, values, markComplete } = parsed.data;

    const { data: patient, error: patientError } = await supabase
      .from("patient_profiles").select("id").eq("user_id", userId).maybeSingle();
    if (patientError) return { success: false, error: patientError.message };
    if (!patient) return { success: false, error: "Patient profile not found" };

    const { data: existing, error: fetchErr } = await supabase
      .from("form_responses")
      .select("answers_json, template_id")
      .eq("id", formId)
      .eq("patient_id", patient.id)
      .maybeSingle();

    if (fetchErr) {
      return { success: false, error: fetchErr.message };
    }

    if (!existing) {
      return { success: false, error: "Form response not found" };
    }

    const mergedAnswers = { ...(existing.answers_json || {}), ...values };
    const status = markComplete ? "complete" : "incomplete";
    const signedAt = markComplete ? new Date().toISOString() : null;

    const updatePayload: Record<string, unknown> = {
      answers_json: mergedAnswers,
      status,
      signed_at: signedAt,
      updated_at: new Date().toISOString(),
    };

    const { data: saved, error: updateErr } = await supabase
      .from("form_responses")
      .update(updatePayload)
      .eq("id", formId)
      .eq("patient_id", patient.id)
      .select("id")
      .maybeSingle();

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    if (!saved || saved.id !== formId) return { success: false, error: "Form save could not be confirmed" };

    return {
      success: true,
      data: {
        formId,
        saved: true,
        status,
        savedFields: Object.keys(mergedAnswers).length,
        updatedAt: updatePayload.updated_at,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
