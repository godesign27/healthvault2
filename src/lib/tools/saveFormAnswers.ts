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

    const { data: existing, error: fetchErr } = await supabase
      .from("form_responses")
      .select("answers_json, template_id")
      .eq("id", formId)
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
      updated_at: new Date().toISOString(),
    };

    if (signedAt) {
      updatePayload.signed_at = signedAt;
    }

    const { error: updateErr } = await supabase
      .from("form_responses")
      .update(updatePayload)
      .eq("id", formId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

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
