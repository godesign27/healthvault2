import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";

export const getIncompleteFormsInputSchema = z.object({
  userId: z.string().min(1),
});

export type GetIncompleteFormsInput = z.infer<typeof getIncompleteFormsInputSchema>;

export async function getIncompleteForms(input: unknown) {
  const parsed = getIncompleteFormsInputSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  try {
    const supabase = createSupabaseServerClient();

    const patientResult = await supabase
      .from("patient_profiles")
      .select("id")
      .eq("user_id", parsed.data.userId)
      .maybeSingle();

    if (!patientResult.data?.id) {
      return {
        success: true,
        data: { totalIncomplete: 0, forms: [] },
        message: "No patient profile found. No forms to display.",
      };
    }

    const { data, error } = await supabase
      .from("form_responses")
      .select(`
        id,
        template_id,
        answers_json,
        status,
        updated_at,
        form_templates!inner (
          id,
          title,
          description,
          category,
          fhir_questionnaire_json
        )
      `)
      .eq("patient_id", patientResult.data.id)
      .eq("status", "incomplete")
      .order("updated_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    const forms = (data || []).map((row: any) => {
      const template = row.form_templates;
      const answers = row.answers_json || {};
      const questionnaire = template?.fhir_questionnaire_json;
      const totalFields = questionnaire?.item?.length || 0;
      const answeredFields = Object.keys(answers).length;

      return {
        id: row.id,
        templateId: row.template_id,
        title: template?.title || "Untitled Form",
        description: template?.description || "",
        category: template?.category || "",
        status: row.status,
        answeredFields,
        totalFields,
        updatedAt: row.updated_at,
      };
    });

    return {
      success: true,
      data: {
        totalIncomplete: forms.length,
        forms,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
