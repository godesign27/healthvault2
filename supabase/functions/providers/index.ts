import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Platform",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function rowToConnection(r: Record<string, unknown>) {
  return {
    id: r.id,
    ehrSource: r.ehr_source,
    ehrPatientId: r.fhir_patient_id ?? null,
    providerName: r.provider_name ?? r.ehr_source,
    status: r.status,
    lastSyncedAt: r.last_synced_at ?? null,
  };
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

    const sb = createClient(supabaseUrl, serviceKey);
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean).slice(1);
    const connectionId = parts[0] ?? null;

    const platform = req.headers.get("X-Platform") ?? "unknown";
    console.log(`providers ${req.method} platform=${platform} user=${user.id}`);

    // ── GET /providers ───────────────────────────────────────────────────────
    if (req.method === "GET") {
      const { data, error } = await sb
        .from("provider_connections")
        .select("id, ehr_source, provider_name, fhir_patient_id, status, last_synced_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) return json({ error: error.message }, 500);
      return json((data ?? []).map(rowToConnection));
    }

    // ── POST /providers — connect ────────────────────────────────────────────
    if (req.method === "POST" && !connectionId) {
      const body = await req.json() as {
        ehrSource?: string;
        ehrPatientId?: string;
        ehrDepartmentId?: string;
        providerName?: string;
      };

      if (!body.ehrSource) return json({ error: "ehrSource is required" }, 400);

      // Insert or upsert the connection record
      const { data, error } = await sb
        .from("provider_connections")
        .insert({
          user_id: user.id,
          ehr_source: body.ehrSource,
          provider_name: body.providerName ?? body.ehrSource,
          fhir_patient_id: body.ehrPatientId ?? null,
          connection_method: "keragon",
          status: "pending",
        })
        .select("id")
        .single();

      if (error) return json({ error: error.message }, 500);

      // Optionally trigger an EHR fetch via the existing webhook function
      let fetchTriggered = false;
      const keragonUrl = Deno.env.get("KERAGON_WEBHOOK_URL");
      if (keragonUrl) {
        try {
          const webhookRes = await fetch(keragonUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              connectionId: data.id,
              userId: user.id,
              ...body,
            }),
          });
          fetchTriggered = webhookRes.ok;
        } catch {
          // Non-fatal — connection created, sync can be retried
        }
      }

      return json({ connectionId: data.id, fetchTriggered }, 201);
    }

    // ── DELETE /providers/:id ────────────────────────────────────────────────
    if (req.method === "DELETE" && connectionId) {
      const { error } = await sb
        .from("provider_connections")
        .update({ status: "inactive" })
        .eq("id", connectionId)
        .eq("user_id", user.id);

      if (error) return json({ error: error.message }, 500);
      return json({ disconnected: true });
    }

    return json({ error: "Not found" }, 404);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return json({ error: message }, 500);
  }
});
