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

    const { data, error } = await supabase
      .from("medical_forms")
      .select("id, title, category, status, description, user_id")
      .eq("user_id", parsed.data.userId)
      .neq("status", "complete");

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: {
        totalIncomplete: data.length,
        forms: data,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
