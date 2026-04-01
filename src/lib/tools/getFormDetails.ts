import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";

export const getFormDetailsInputSchema = z.object({
  userId: z.string().min(1),
  formId: z.string().min(1),
});

export type GetFormDetailsInput = z.infer<typeof getFormDetailsInputSchema>;

interface FormField {
  key: string;
  label: string;
  type: string;
  required: boolean;
  options: string[] | null;
}

export async function getFormDetails(input: unknown) {
  const parsed = getFormDetailsInputSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { formId } = parsed.data;

    const { data: formResponse, error: responseError } = await supabase
      .from("form_responses")
      .select("id, template_id, answers_json, status, signed_at, updated_at")
      .eq("id", formId)
      .maybeSingle();

    if (responseError) {
      return { success: false, error: responseError.message };
    }

    if (!formResponse) {
      return { success: false, error: "Form response not found" };
    }

    const { data: template, error: templateError } = await supabase
      .from("form_templates")
      .select("id, title, description, category, version, fhir_questionnaire_json")
      .eq("id", formResponse.template_id)
      .maybeSingle();

    if (templateError) {
      return { success: false, error: templateError.message };
    }

    if (!template) {
      return { success: false, error: "Form template not found" };
    }

    const questionnaire = template.fhir_questionnaire_json || {};
    const fields: FormField[] = (questionnaire.item || []).map((item: any) => ({
      key: item.linkId || "",
      label: item.text || "",
      type: item.type || "string",
      required: item.required || false,
      options:
        item.answerOption?.map(
          (opt: any) => opt.valueCoding?.display || opt.valueString
        ) || null,
    }));

    return {
      success: true,
      data: {
        id: formResponse.id,
        templateId: formResponse.template_id,
        title: template.title,
        category: template.category,
        status: formResponse.status,
        description: template.description,
        fields,
        values: formResponse.answers_json || {},
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
