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

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashKey(raw: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function jsonError(message: string, status: number): Response {
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonError("Missing authorization", 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const appUrl = Deno.env.get("APP_URL") ?? "https://healthvault27.com";

    const sb = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();

    let userId: string;

    if (authHeader === `Bearer ${supabaseServiceKey}`) {
      // Internal call from AI assistant tool
      userId = body._userId;
      if (!userId) return jsonError("Missing _userId for internal call", 400);
    } else {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: authErr } = await userClient.auth.getUser();
      if (authErr || !user) return jsonError("Unauthorized", 401);
      userId = user.id;
    }

    return await handleFetch(sb, appUrl, userId, body);
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
  appUrl: string,
  userId: string,
  body: Record<string, unknown>
): Promise<Response> {
  const { connectionId, ehrSource, ehrPatientId, ehrDepartmentId, providerName } = body as {
    connectionId?: string;
    ehrSource?: string;
    ehrPatientId?: string;
    ehrDepartmentId?: string;
    providerName?: string;
  };

  // ── Path A: Existing connection ──────────────────────────────────────────────
  if (connectionId) {
    const { data: conn, error: connErr } = await sb
      .from("provider_connections")
      .select("id, ehr_source, fhir_patient_id, ehr_department_id, user_id, provider_organizations(name)")
      .eq("id", connectionId)
      .eq("user_id", userId)
      .maybeSingle();

    if (connErr || !conn) return jsonError("Connection not found.", 404);
    if (!conn.ehr_source || !conn.fhir_patient_id) {
      return jsonError("Connection is missing EHR source or patient ID.", 400);
    }

    if (conn.ehr_source === "athenahealth" && !conn.ehr_department_id) {
      return jsonError("department_id is required for Athena Health.", 400);
    }

    const patientEmail = await resolvePatientEmail(sb, userId);
    if (!patientEmail) return jsonError("Patient email not found. Please complete your profile.", 400);

    const rawKey = await provisionApiKey(sb, userId, conn.ehr_source);
    if (!rawKey) return jsonError("Failed to provision fetch key.", 500);

    const payload: Record<string, string | boolean> = {
      ehr_source: conn.ehr_source,
      patient_id: conn.fhir_patient_id,
      patient_email: patientEmail,
      hv_api_key: rawKey,
      provider_connected: true,
    };
    if (conn.ehr_department_id) payload.department_id = conn.ehr_department_id;

    const ok = await fireKeragon(payload);
    if (!ok) return jsonError("EHR fetch failed — Keragon webhook returned an error.", 502);

    await sb
      .from("provider_connections")
      .update({ last_synced_at: new Date().toISOString(), status: "active" })
      .eq("id", connectionId)
      .eq("user_id", userId);

    const org = (conn.provider_organizations as any)?.name ?? conn.ehr_source;
    return new Response(
      JSON.stringify({
        success: true,
        message: `Record fetch triggered for ${org}. Records will appear in your vault within a few minutes.`,
        ehrSource: conn.ehr_source,
        providerConnected: true,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── Path B: No connection — send auth email via Keragon ──────────────────────
  if (ehrSource) {
    if (!SUPPORTED_EHR_SOURCES.includes(ehrSource as EhrSource)) {
      return jsonError(
        `Unsupported EHR source: ${ehrSource}. Supported: ${SUPPORTED_EHR_SOURCES.join(", ")}`,
        400
      );
    }

    if (ehrSource === "athenahealth" && !ehrDepartmentId) {
      return jsonError("department_id is required for Athena Health.", 400);
    }

    const patientEmail = await resolvePatientEmail(sb, userId);
    if (!patientEmail) return jsonError("Patient email not found. Please complete your profile.", 400);

    // Generate a short-lived auth token the patient will use to complete connection
    const authToken = generateToken();
    const { error: tokenErr } = await sb.from("ehr_auth_tokens").insert({
      token: authToken,
      user_id: userId,
      ehr_source: ehrSource,
      provider_name: providerName ?? ehrSource,
      expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    });

    if (tokenErr) return jsonError(`Failed to generate auth token: ${tokenErr.message}`, 500);

    const authLink = `${appUrl}/ehr-connect?token=${authToken}`;
    const rawKey = await provisionApiKey(sb, userId, ehrSource);
    if (!rawKey) return jsonError("Failed to provision fetch key.", 500);

    const payload: Record<string, string | boolean> = {
      ehr_source: ehrSource,
      patient_id: ehrPatientId ?? "",
      patient_email: patientEmail,
      hv_api_key: rawKey,
      provider_connected: false,
      auth_link: authLink,
    };
    if (ehrDepartmentId) payload.department_id = ehrDepartmentId;

    const ok = await fireKeragon(payload);
    if (!ok) return jsonError("Failed to notify Keragon — webhook returned an error.", 502);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Authorization email sent to ${patientEmail}. The patient will receive a link to connect their ${ehrSource} account.`,
        ehrSource,
        providerConnected: false,
        authLink,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return jsonError("Provide either connectionId (existing connection) or ehrSource (new connection).", 400);
}

async function resolvePatientEmail(
  sb: ReturnType<typeof createClient>,
  userId: string
): Promise<string | null> {
  const { data: profile } = await sb
    .from("user_profiles")
    .select("email")
    .eq("user_id", userId)
    .maybeSingle();

  if (profile?.email) return profile.email;

  const { data: adminUser } = await sb.auth.admin.getUserById(userId);
  return adminUser?.user?.email ?? null;
}

async function provisionApiKey(
  sb: ReturnType<typeof createClient>,
  userId: string,
  ehrSource: string
): Promise<string | null> {
  const rawKey = generateApiKey();
  const keyHash = await hashKey(rawKey);

  const { error } = await sb.from("inbound_api_keys").insert({
    key_hash: keyHash,
    name: "Keragon EHR Fetch",
    organization_name: ehrSource,
    is_active: true,
    created_by: userId,
  });

  return error ? null : rawKey;
}

async function fireKeragon(payload: Record<string, string | boolean>): Promise<boolean> {
  const res = await fetch(KERAGON_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.ok;
}
