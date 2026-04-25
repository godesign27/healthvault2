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

function generateApiKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return "hvk_" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashKey(raw: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the caller's JWT — supports both user tokens and service role calls
    const sb = createClient(supabaseUrl, supabaseServiceKey);

    let userId: string;

    if (authHeader === `Bearer ${supabaseServiceKey}`) {
      // Called internally from the AI assistant tool — userId passed in body
      const body = await req.json();
      userId = body._userId;

      if (!userId) {
        return new Response(JSON.stringify({ error: "Missing _userId for internal call" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return await handleFetch(sb, supabaseUrl, supabaseServiceKey, userId, body);
    } else {
      // Called directly by a user
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
      return await handleFetch(sb, supabaseUrl, supabaseServiceKey, user.id, body);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleFetch(
  sb: ReturnType<typeof createClient>,
  _supabaseUrl: string,
  _serviceKey: string,
  userId: string,
  body: Record<string, unknown>
): Promise<Response> {
  const { connectionId, ehrSource, ehrPatientId, ehrDepartmentId } = body as {
    connectionId?: string;
    ehrSource?: string;
    ehrPatientId?: string;
    ehrDepartmentId?: string;
  };

  let resolvedEhrSource: string;
  let resolvedEhrPatientId: string;
  let resolvedDepartmentId: string | undefined;
  let resolvedConnectionId: string | undefined = connectionId;

  if (connectionId) {
    const { data: conn, error: connErr } = await sb
      .from("provider_connections")
      .select("id, ehr_source, fhir_patient_id, ehr_department_id, user_id")
      .eq("id", connectionId)
      .eq("user_id", userId)
      .maybeSingle();

    if (connErr || !conn) {
      return jsonError("Connection not found.", 404);
    }

    if (!conn.ehr_source || !conn.fhir_patient_id) {
      return jsonError("Connection is missing EHR source or patient ID.", 400);
    }

    resolvedEhrSource = conn.ehr_source;
    resolvedEhrPatientId = conn.fhir_patient_id;
    resolvedDepartmentId = conn.ehr_department_id ?? undefined;
  } else {
    if (!ehrSource || !ehrPatientId) {
      return jsonError("Provide either connectionId or both ehrSource and ehrPatientId.", 400);
    }

    if (!SUPPORTED_EHR_SOURCES.includes(ehrSource as EhrSource)) {
      return jsonError(
        `Unsupported EHR source: ${ehrSource}. Supported: ${SUPPORTED_EHR_SOURCES.join(", ")}`,
        400
      );
    }

    resolvedEhrSource = ehrSource;
    resolvedEhrPatientId = ehrPatientId;
    resolvedDepartmentId = ehrDepartmentId;
  }

  if (resolvedEhrSource === "athenahealth" && !resolvedDepartmentId) {
    return jsonError("department_id is required for Athena Health.", 400);
  }

  // Get patient email
  const { data: profile } = await sb
    .from("user_profiles")
    .select("email")
    .eq("user_id", userId)
    .maybeSingle();

  // Fall back to auth.users email via admin API if profile email is missing
  let patientEmail = profile?.email;
  if (!patientEmail) {
    const { data: adminUser } = await sb.auth.admin.getUserById(userId);
    patientEmail = adminUser?.user?.email;
  }

  if (!patientEmail) {
    return jsonError("Patient email not found. Please complete your profile.", 400);
  }

  // Generate a fresh API key for this Keragon fetch call
  const rawKey = generateApiKey();
  const keyHash = await hashKey(rawKey);

  const { error: keyErr } = await sb.from("inbound_api_keys").insert({
    key_hash: keyHash,
    name: "Keragon EHR Fetch",
    organization_name: resolvedEhrSource,
    is_active: true,
    created_by: userId,
  });

  if (keyErr) {
    return jsonError(`Failed to provision fetch key: ${keyErr.message}`, 500);
  }

  // Build and fire the Keragon webhook payload
  const keragonPayload: Record<string, string> = {
    ehr_source: resolvedEhrSource,
    patient_id: resolvedEhrPatientId,
    patient_email: patientEmail,
    hv_api_key: rawKey,
  };

  if (resolvedDepartmentId) {
    keragonPayload.department_id = resolvedDepartmentId;
  }

  const keragonRes = await fetch(KERAGON_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(keragonPayload),
  });

  if (!keragonRes.ok) {
    const errText = await keragonRes.text().catch(() => "");
    return jsonError(`EHR fetch failed: ${keragonRes.status} ${errText}`, 502);
  }

  // Mark connection as synced
  if (resolvedConnectionId) {
    await sb
      .from("provider_connections")
      .update({ last_synced_at: new Date().toISOString(), status: "active" })
      .eq("id", resolvedConnectionId)
      .eq("user_id", userId);
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: `Record fetch triggered for ${resolvedEhrSource}. Records will appear in your vault within a few minutes.`,
      ehrSource: resolvedEhrSource,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
