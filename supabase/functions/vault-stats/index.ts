import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Platform",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(supabaseUrl, serviceKey);

    const [recordsRes, connectionsRes, requestsRes, syncRes] = await Promise.all([
      sb.from("health_records").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      sb.from("provider_connections").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "active"),
      sb.from("health_record_requests").select("id", { count: "exact", head: true }).eq("user_id", user.id).in("status", ["pending", "sent"]),
      sb.from("provider_connections").select("last_synced_at").eq("user_id", user.id).eq("status", "active").order("last_synced_at", { ascending: false }).limit(1),
    ]);

    const lastSyncedAt = syncRes.data?.[0]?.last_synced_at ?? null;

    const stats = {
      totalRecords: recordsRes.count ?? 0,
      connectedProviders: connectionsRes.count ?? 0,
      pendingRequests: requestsRes.count ?? 0,
      lastSyncedAt,
    };

    return new Response(JSON.stringify(stats), {
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
