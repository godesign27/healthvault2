import { z } from "zod";
import { saveFormAnswers as saveFormImpl } from "../ai-tools/forms";

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

  const { userId, formId, values, markComplete } = parsed.data;

  const existingRes = await import("../supabase").then((m) =>
    m.supabase
      .from("form_responses")
      .select("template_id")
      .eq("id", formId)
      .maybeSingle()
  );

  if (!existingRes.data?.template_id) {
    return { success: false, error: "Form response not found" };
  }

  const result = await saveFormImpl(
    {
      formId,
      templateId: existingRes.data.template_id,
      answers: values,
      markComplete,
    },
    userId
  );

  if (!result.success || !result.data) {
    return { success: false, error: result.error || "Save failed" };
  }

  return {
    success: true,
    data: {
      formId: result.data.formId,
      saved: true,
      status: result.data.status,
      savedFields: result.data.savedFields,
    },
  };
}
