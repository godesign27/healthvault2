import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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

    if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

    const platform = req.headers.get("X-Platform") ?? "unknown";
    console.log(`sync-status platform=${platform} user=${user.id}`);

    const sb = createClient(supabaseUrl, serviceKey);

    // Get the most recent active connection and its sync time
    const { data: connections, error } = await sb
      .from("provider_connections")
      .select("id, ehr_source, provider_name, status, last_synced_at")
      .eq("user_id", user.id)
      .order("last_synced_at", { ascending: false, nullsFirst: false })
      .limit(10);

    if (error) return json({ error: error.message }, 500);

    const rows = connections ?? [];
    const lastSyncedAt = rows.find((r) => r.last_synced_at)?.last_synced_at ?? null;
    const hasActive = rows.some((r) => r.status === "active");
    const hasPending = rows.some((r) => r.status === "pending");

    const overallStatus = hasActive
      ? "synced"
      : hasPending
      ? "pending"
      : rows.length > 0
      ? "inactive"
      : "no_connections";

    return json({
      lastSyncedAt,
      status: overallStatus,
      connections: rows.map((r) => ({
        id: r.id,
        ehrSource: r.ehr_source,
        providerName: r.provider_name ?? r.ehr_source,
        status: r.status,
        lastSyncedAt: r.last_synced_at ?? null,
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return json({ error: message }, 500);
  }
});
