import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  createEpicClientAssertion,
  refreshAccessToken,
  tokenExpiresAt,
} from "../_shared/smart-oauth.ts";
import {
  bundleToPreviewItems,
  fetchPatientResources,
} from "../_shared/fhir-resources.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey, X-Platform",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function ensureAccessToken(
  sb: ReturnType<typeof createClient>,
  connection: Record<string, unknown>,
  org: Record<string, unknown>,
): Promise<string> {
  let accessToken = connection.fhir_access_token as string | null;
  const refreshToken = connection.fhir_refresh_token as string | null;
  const expiresAt = connection.token_expires_at as string | null;
  const clientSecret = Deno.env.get("FHIR_CLIENT_SECRET");
  const isEpic = typeof org.ehr_vendor === "string" &&
    org.ehr_vendor.toLowerCase() === "epic";
  const isEpicSandbox = isEpic &&
    (org.fhir_environment === "sandbox" ||
      (typeof org.fhir_endpoint_url === "string" &&
        org.fhir_endpoint_url.includes("fhir.epic.com")));
  const clientId = isEpic
    ? isEpicSandbox
      ? Deno.env.get("FHIR_EPIC_SANDBOX_CLIENT_ID") || Deno.env.get("FHIR_CLIENT_ID")
      : Deno.env.get("FHIR_EPIC_PRODUCTION_CLIENT_ID") || Deno.env.get("FHIR_CLIENT_ID")
    : Deno.env.get("FHIR_CLIENT_ID");

  const isExpired = expiresAt
    ? new Date(expiresAt).getTime() <= Date.now() + 60_000
    : false;

  if (!isExpired && accessToken) return accessToken;
  if (!refreshToken || !clientId || !org.token_endpoint) {
    throw new Error("Connection token expired and cannot be refreshed");
  }

  const prefix = isEpicSandbox ? "FHIR_EPIC_SANDBOX" : "FHIR_EPIC_PRODUCTION";
  const privateKeyPkcs8Base64 = Deno.env.get(`${prefix}_PRIVATE_KEY_PKCS8_BASE64`);
  const keyId = Deno.env.get(`${prefix}_KEY_ID`);
  const jwksUrl = Deno.env.get(`${prefix}_JWKS_URL`);
  const clientAssertion = isEpic && privateKeyPkcs8Base64 && keyId
    ? await createEpicClientAssertion({
      clientId,
      tokenEndpoint: org.token_endpoint as string,
      privateKeyPkcs8Base64,
      keyId,
      jwksUrl,
    })
    : undefined;

  const refreshed = await refreshAccessToken({
    tokenEndpoint: org.token_endpoint as string,
    refreshToken,
    clientId,
    clientSecret: clientAssertion ? undefined : clientSecret || undefined,
    clientAssertion,
  });

  accessToken = typeof refreshed.access_token === "string"
    ? refreshed.access_token
    : null;
  if (!accessToken) throw new Error("Token refresh did not return an access token");

  await sb
    .from("provider_connections")
    .update({
      fhir_access_token: accessToken,
      fhir_refresh_token: typeof refreshed.refresh_token === "string"
        ? refreshed.refresh_token
        : refreshToken,
      token_expires_at: tokenExpiresAt(refreshed.expires_in),
      updated_at: new Date().toISOString(),
    })
    .eq("id", connection.id);

  return accessToken;
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

    const body = await req.json() as { connectionId?: string };
    if (!body.connectionId) return json({ error: "connectionId is required" }, 400);

    const sb = createClient(supabaseUrl, serviceKey);

    const { data: connection, error: connError } = await sb
      .from("provider_connections")
      .select("*")
      .eq("id", body.connectionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (connError) return json({ error: connError.message }, 500);
    if (!connection) return json({ error: "Connection not found" }, 404);
    if (connection.status !== "active") {
      return json({ error: `Connection is ${connection.status}` }, 409);
    }
    if (!connection.fhir_patient_id) {
      return json({ error: "Connection is missing patient context" }, 409);
    }

    const { data: org, error: orgError } = await sb
      .from("provider_organizations")
      .select("*")
      .eq("id", connection.provider_organization_id)
      .maybeSingle();

    if (orgError || !org?.fhir_endpoint_url) {
      return json({ error: "Provider FHIR endpoint not configured" }, 422);
    }

    const accessToken = await ensureAccessToken(sb, connection, org);
    const bundles = await fetchPatientResources(
      org.fhir_endpoint_url,
      accessToken,
      connection.fhir_patient_id,
    );

    const previewItems = bundleToPreviewItems(bundles, org.name);
    const counts = {
      conditions: previewItems.filter((i) => i.resourceType === "condition").length,
      medications: previewItems.filter((i) => i.resourceType === "medication").length,
      allergies: previewItems.filter((i) => i.resourceType === "allergy").length,
      immunizations: previewItems.filter((i) => i.resourceType === "immunization").length,
      total: previewItems.length,
      duplicates: 0,
    };

    const itemsByType: Record<string, typeof previewItems> = {};
    for (const item of previewItems) {
      if (!itemsByType[item.resourceType]) itemsByType[item.resourceType] = [];
      itemsByType[item.resourceType].push(item);
    }

    const { data: job } = await sb
      .from("record_import_jobs")
      .insert({
        user_id: user.id,
        provider_connection_id: connection.id,
        strategy: connection.connection_method,
        status: "preview",
        preview_data: itemsByType,
        counts,
      })
      .select("id")
      .single();

    await sb
      .from("provider_connections")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", connection.id);

    return json({
      source: "fhir",
      counts,
      itemsByType,
      importJobId: job?.id ?? null,
      bundles,
      message: `Fetched ${counts.total} records from ${org.name}.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return json({ error: message }, 500);
  }
});
