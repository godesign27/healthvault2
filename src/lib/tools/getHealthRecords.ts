import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";

export const getHealthRecordsInputSchema = z.object({
  userId: z.string().min(1),
  category: z.enum(["lab", "imaging", "pathology", "specialist_report", "other"]).optional(),
  source: z.enum(["connected", "uploaded", "shared"]).optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

export type GetHealthRecordsInput = z.infer<typeof getHealthRecordsInputSchema>;

export async function getHealthRecords(input: unknown) {
  const parsed = getHealthRecordsInputSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { userId, category, source, limit } = parsed.data;

    let query = supabase
      .from("health_records")
      .select("id, kind, title, provider_name, service_date, received_at, source, ai_summary, tags")
      .eq("user_id", userId)
      .order("service_date", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (category) {
      query = query.eq("kind", category);
    }
    if (source) {
      query = query.eq("source", source);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    const records = (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      category: row.kind,
      provider: row.provider_name,
      date: row.service_date,
      receivedAt: row.received_at,
      source: row.source,
      summary: row.ai_summary,
      tags: row.tags || [],
    }));

    return {
      success: true,
      data: {
        total: records.length,
        records,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
