import { z } from "zod";
import { openForm } from "../ai-tools/forms";

export const getFormDetailsInputSchema = z.object({
  userId: z.string().min(1),
  formId: z.string().min(1),
});

export type GetFormDetailsInput = z.infer<typeof getFormDetailsInputSchema>;

export async function getFormDetails(input: unknown) {
  const parsed = getFormDetailsInputSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const { userId, formId } = parsed.data;

  const result = await openForm({ formId }, userId);

  if (!result.success || !result.data) {
    return { success: false, error: result.error || "Form not found" };
  }

  const detail = result.data;

  return {
    success: true,
    data: {
      id: detail.responseId || formId,
      title: detail.title,
      category: detail.category,
      status: detail.status,
      description: detail.description,
      fields: detail.fields.map((f) => ({
        key: f.linkId,
        label: f.text,
        type: f.type,
        required: f.required,
        options: f.options || null,
      })),
      values: detail.savedAnswers,
    },
  };
}
