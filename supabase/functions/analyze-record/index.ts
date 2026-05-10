import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Platform",
};

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonError("Missing authorization", 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return jsonError("Unauthorized", 401);

    const body = await req.json();
    const { recordId } = body as { recordId?: string };
    if (!recordId) return jsonError("recordId is required", 400);

    const sb = createClient(supabaseUrl, serviceKey);

    const { data: record, error: recErr } = await sb
      .from("health_records")
      .select("*")
      .eq("id", recordId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (recErr) return jsonError(`Database error: ${recErr.message}`, 500);
    if (!record) return jsonError("Record not found", 404);

    // If already summarized, return existing summary
    if (record.ai_summary) {
      return new Response(JSON.stringify({ recordId, summary: record.ai_summary }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let summary: string;

    if (openaiKey) {
      const kindLabels: Record<string, string> = {
        lab: "laboratory results",
        imaging: "imaging study",
        pathology: "pathology report",
        specialist_report: "specialist report",
        other: "health record",
      };
      const prompt = `You are summarizing a ${kindLabels[record.kind] ?? "health record"} titled "${record.title}"${record.provider_name ? ` from ${record.provider_name}` : ""}${record.service_date ? ` dated ${record.service_date}` : ""}. Provide a single plain-language sentence describing what this record likely contains. Do not provide medical advice or interpretation. Be factual and brief.`;

      const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 100,
        }),
      });

      if (aiRes.ok) {
        const aiJson = await aiRes.json();
        summary = aiJson.choices?.[0]?.message?.content?.trim() ?? buildFallbackSummary(record);
      } else {
        summary = buildFallbackSummary(record);
      }
    } else {
      summary = buildFallbackSummary(record);
    }

    // Persist the summary
    await sb
      .from("health_records")
      .update({ ai_summary: summary })
      .eq("id", recordId)
      .eq("user_id", user.id);

    return new Response(JSON.stringify({ recordId, summary }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildFallbackSummary(record: Record<string, unknown>): string {
  const kindLabel: Record<string, string> = {
    lab: "Lab",
    imaging: "Imaging",
    pathology: "Pathology",
    specialist_report: "Specialist Report",
    other: "Other",
  };
  const parts = [`${kindLabel[record.kind as string] ?? record.kind} record: "${record.title}"`];
  if (record.provider_name) parts.push(`from ${record.provider_name}`);
  if (record.service_date) parts.push(`dated ${record.service_date}`);
  return parts.join(" — ") + ".";
}
