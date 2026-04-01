import { z } from "zod";
import { createSupabaseServerClient } from "../supabase/server";

export const getCareTimelineInputSchema = z.object({
  userId: z.string().min(1),
  filter: z
    .enum(["record", "form", "share", "appointment", "encounter"])
    .optional(),
  limit: z.number().int().min(1).max(50).default(25),
});

export type GetCareTimelineInput = z.infer<typeof getCareTimelineInputSchema>;

interface TimelineItem {
  id: string;
  type: string;
  title: string;
  date: string;
  source: string | null;
  summary: string | null;
  tags: string[];
}

export async function getCareTimeline(input: unknown) {
  const parsed = getCareTimelineInputSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { userId, filter, limit } = parsed.data;
    const items: TimelineItem[] = [];
    const types = filter ? [filter] : ["record", "form", "share", "appointment", "encounter"];

    const queries: Promise<void>[] = [];

    if (types.includes("record")) {
      queries.push(
        supabase
          .from("health_records")
          .select("id, title, service_date, kind, provider_name, ai_summary, tags")
          .eq("user_id", userId)
          .order("service_date", { ascending: false, nullsFirst: false })
          .limit(limit)
          .then(({ data }) => {
            for (const r of data || []) {
              items.push({
                id: r.id,
                type: r.kind || "record",
                title: r.title,
                date: r.service_date || "",
                source: r.provider_name || null,
                summary: r.ai_summary || null,
                tags: r.tags || [],
              });
            }
          })
      );
    }

    if (types.includes("form")) {
      queries.push(
        supabase
          .from("form_responses")
          .select("id, status, updated_at, form_templates!inner(title, category)")
          .eq("patient_id", userId)
          .order("updated_at", { ascending: false })
          .limit(limit)
          .then(({ data }) => {
            for (const f of (data || []) as any[]) {
              items.push({
                id: f.id,
                type: "form",
                title: f.form_templates?.title || "Medical Form",
                date: f.updated_at || "",
                source: f.form_templates?.category || null,
                summary: f.status === "complete" ? "Completed" : "In progress",
                tags: [f.status],
              });
            }
          })
      );
    }

    if (types.includes("share")) {
      queries.push(
        supabase
          .from("share_events")
          .select("id, sent_at, status, recipient")
          .eq("patient_id", userId)
          .order("sent_at", { ascending: false })
          .limit(limit)
          .then(({ data }) => {
            for (const s of (data || []) as any[]) {
              const recipientName =
                typeof s.recipient === "object"
                  ? s.recipient?.name || s.recipient?.displayName || "Someone"
                  : "Someone";
              items.push({
                id: s.id,
                type: "share",
                title: `Shared records with ${recipientName}`,
                date: s.sent_at || "",
                source: null,
                summary: s.status,
                tags: ["share", s.status],
              });
            }
          })
      );
    }

    if (types.includes("appointment")) {
      queries.push(
        supabase
          .from("appointments")
          .select("id, provider_name, appointment_type, scheduled_at, location, status")
          .eq("user_id", userId)
          .order("scheduled_at", { ascending: false })
          .limit(limit)
          .then(({ data }) => {
            for (const a of data || []) {
              items.push({
                id: a.id,
                type: "appointment",
                title: `${a.appointment_type} with ${a.provider_name}`,
                date: a.scheduled_at || "",
                source: a.provider_name || null,
                summary: a.location
                  ? `${a.status} — ${a.location}`
                  : a.status,
                tags: [a.status],
              });
            }
          })
      );
    }

    if (types.includes("encounter")) {
      queries.push(
        supabase
          .from("encounters")
          .select("id, title, encounter_date, provider_name, location, encounter_type, description")
          .eq("user_id", userId)
          .order("encounter_date", { ascending: false })
          .limit(limit)
          .then(({ data }) => {
            for (const e of data || []) {
              items.push({
                id: e.id,
                type: e.encounter_type || "encounter",
                title: e.title,
                date: e.encounter_date || "",
                source: e.provider_name || null,
                summary: e.description || null,
                tags: e.encounter_type ? [e.encounter_type] : [],
              });
            }
          })
      );
    }

    await Promise.all(queries);

    items.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    const trimmed = items.slice(0, limit);

    return {
      success: true,
      data: {
        total: trimmed.length,
        items: trimmed,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
