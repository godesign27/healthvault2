import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const KERAGON_WEBHOOK_URL =
  "https://webhooks.us-1.keragon.com/v1/workflows/f1c0830b-9552-4f34-968f-e9a90f5c9d44/trigger/signal";

const SUPPORTED_EHR_SOURCES = [
  "athenahealth",
  "elation",
  "charmhealth",
  "openemr",
  "eclinicalworks",
  "nextech",
  "healthgorilla",
] as const;

type EhrSource = (typeof SUPPORTED_EHR_SOURCES)[number];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Validate JWT and get user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const hvKeragonApiKey = Deno.env.get("HV_KERAGON_API_KEY");

    if (!hvKeragonApiKey) {
      return new Response(
        JSON.stringify({ error: "Keragon API key not configured. Contact your administrator." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user JWT
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
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

    const body = await req.json();
    const { connectionId, ehrSource, ehrPatientId, ehrDepartmentId } = body as {
      connectionId?: string;
      ehrSource?: string;
      ehrPatientId?: string;
      ehrDepartmentId?: string;
    };

    const sb = createClient(supabaseUrl, supabaseServiceKey);

    let resolvedEhrSource: string;
    let resolvedEhrPatientId: string;
    let resolvedDepartmentId: string | undefined;
    let resolvedConnectionId: string | undefined = connectionId;

    if (connectionId) {
      // Resolve from stored connection
      const { data: conn, error: connErr } = await sb
        .from("provider_connections")
        .select("id, ehr_source, fhir_patient_id, ehr_department_id, user_id")
        .eq("id", connectionId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (connErr || !conn) {
        return new Response(JSON.stringify({ error: "Connection not found." }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!conn.ehr_source || !conn.fhir_patient_id) {
        return new Response(
          JSON.stringify({ error: "Connection is missing EHR source or patient ID." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      resolvedEhrSource = conn.ehr_source;
      resolvedEhrPatientId = conn.fhir_patient_id;
      resolvedDepartmentId = conn.ehr_department_id ?? undefined;
    } else {
      // Use provided fields
      if (!ehrSource || !ehrPatientId) {
        return new Response(
          JSON.stringify({ error: "Provide either connectionId or both ehrSource and ehrPatientId." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!SUPPORTED_EHR_SOURCES.includes(ehrSource as EhrSource)) {
        return new Response(
          JSON.stringify({
            error: `Unsupported EHR source: ${ehrSource}. Supported: ${SUPPORTED_EHR_SOURCES.join(", ")}`,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      resolvedEhrSource = ehrSource;
      resolvedEhrPatientId = ehrPatientId;
      resolvedDepartmentId = ehrDepartmentId;
    }

    if (resolvedEhrSource === "athenahealth" && !resolvedDepartmentId) {
      return new Response(
        JSON.stringify({ error: "department_id is required for Athena Health." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get patient email
    const { data: profile } = await sb
      .from("user_profiles")
      .select("email")
      .eq("user_id", user.id)
      .maybeSingle();

    const patientEmail = profile?.email || user.email;

    if (!patientEmail) {
      return new Response(
        JSON.stringify({ error: "Patient email not found. Please complete your profile." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build Keragon payload
    const keragonPayload: Record<string, string> = {
      ehr_source: resolvedEhrSource,
      patient_id: resolvedEhrPatientId,
      patient_email: patientEmail,
      hv_api_key: hvKeragonApiKey,
    };

    if (resolvedDepartmentId) {
      keragonPayload.department_id = resolvedDepartmentId;
    }

    // Trigger Keragon webhook
    const keragonRes = await fetch(KERAGON_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(keragonPayload),
    });

    if (!keragonRes.ok) {
      const errText = await keragonRes.text().catch(() => "");
      return new Response(
        JSON.stringify({ error: `EHR fetch failed: ${keragonRes.status} ${errText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update last_synced_at on the connection if we have one
    if (resolvedConnectionId) {
      await sb
        .from("provider_connections")
        .update({ last_synced_at: new Date().toISOString(), status: "active" })
        .eq("id", resolvedConnectionId)
        .eq("user_id", user.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Record fetch triggered for ${resolvedEhrSource}. Records will appear in your vault within a few minutes.`,
        ehrSource: resolvedEhrSource,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
