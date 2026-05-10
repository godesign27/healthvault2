import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Platform",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
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
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const platform = req.headers.get("X-Platform") ?? "unknown";

    // Accept recordId from body OR from URL path segment: /records-import/:id
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean).slice(1);
    let recordId: string | null = parts[0] ?? null;

    if (!recordId) {
      const body = await req.json().catch(() => ({})) as Record<string, unknown>;
      recordId = (body.recordId as string) ?? null;
    }

    if (!recordId) return json({ error: "recordId is required" }, 400);

    console.log(`records-import platform=${platform} user=${user.id} recordId=${recordId}`);

    const sb = createClient(supabaseUrl, serviceKey);

    // Verify the record exists and belongs to the user
    const { data: record, error: fetchErr } = await sb
      .from("health_records")
      .select("id, source")
      .eq("id", recordId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchErr) return json({ error: fetchErr.message }, 500);
    if (!record) return json({ error: "Record not found" }, 404);

    // Mark as imported — update source to "connected" and set imported_at if the column exists
    const { error: updateErr } = await sb
      .from("health_records")
      .update({ source: "connected" })
      .eq("id", recordId)
      .eq("user_id", user.id);

    if (updateErr) return json({ error: updateErr.message }, 500);

    return json({ imported: true, recordId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return json({ error: message }, 500);
  }
});
