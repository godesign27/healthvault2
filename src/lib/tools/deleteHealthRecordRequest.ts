import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";

export const deleteHealthRecordRequestInputSchema = z.object({
  userId: z.string().min(1),
  requestId: z.string().min(1),
  confirmed: z.boolean(),
});

export async function deleteHealthRecordRequest(input: unknown) {
  const parsed = deleteHealthRecordRequestInputSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const { userId, requestId, confirmed } = parsed.data;

  if (!confirmed) {
    return { success: false, error: "Deleting a record request requires confirmation." };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .from("health_record_requests")
      .delete()
      .eq("id", requestId)
      .eq("user_id", userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: { requestId, deleted: true },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
