import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";

export const summarizeRecordInputSchema = z.object({
  userId: z.string().min(1),
  recordId: z.string().min(1),
});

export type SummarizeRecordInput = z.infer<typeof summarizeRecordInputSchema>;

export async function summarizeRecord(input: unknown) {
  const parsed = summarizeRecordInputSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { userId, recordId } = parsed.data;

    const { data: record, error } = await supabase
      .from("health_records")
      .select("id, kind, title, provider_name, service_date, source, ai_summary, tags, file_type")
      .eq("id", recordId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!record) {
      return { success: false, error: "Record not found or access denied." };
    }

    const kindLabels: Record<string, string> = {
      lab: "Lab",
      imaging: "Imaging",
      pathology: "Pathology",
      specialist_report: "Specialist Report",
      other: "Other",
    };

    return {
      success: true,
      data: {
        id: record.id,
        title: record.title,
        category: kindLabels[record.kind] || record.kind,
        date: record.service_date,
        provider: record.provider_name,
        source: record.source,
        summary: record.ai_summary || null,
        tags: record.tags || [],
        fileType: record.file_type,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
