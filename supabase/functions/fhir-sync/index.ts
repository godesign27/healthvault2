import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.112.3";
import {
  refreshAccessToken,
  tokenExpiresAt,
} from "../_shared/smart-oauth.ts";
import {
  bundleToPreviewItems,
  fetchPatientResources,
} from "../_shared/fhir-resources.ts";

import { requireActiveAccount, ImportAccessError } from "../inbound-records/access.ts";

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
  sb: SupabaseClient,
  connection: Record<string, unknown> & { id: string },
  org: Record<string, unknown>,
  userId: string,
): Promise<string> {
  let accessToken = connection.fhir_access_token as string | null;
  const refreshToken = connection.fhir_refresh_token as string | null;
  const expiresAt = connection.token_expires_at as string | null;
  const clientId = Deno.env.get("FHIR_CLIENT_ID");
  const clientSecret = Deno.env.get("FHIR_CLIENT_SECRET");

  const isExpired = expiresAt
    ? new Date(expiresAt).getTime() <= Date.now() + 60_000
    : false;

  if (!isExpired && accessToken) return accessToken;
  if (!refreshToken || !clientId || !org.token_endpoint) {
    throw new Error("Connection token expired and cannot be refreshed");
  }

  const refreshed = await refreshAccessToken({
    tokenEndpoint: org.token_endpoint as string,
    refreshToken,
    clientId,
    clientSecret: clientSecret || undefined,
  });

  accessToken = typeof refreshed.access_token === "string"
    ? refreshed.access_token
    : null;
  if (!accessToken) throw new Error("Token refresh did not return an access token");

  const { data: saved, error: refreshError } = await sb.rpc("refresh_fhir_connection", {
    p_user_id: userId,
    p_connection_id: connection.id,
    p_expected_token: connection.fhir_access_token ?? null,
    p_access_token: accessToken,
    p_refresh_token: typeof refreshed.refresh_token === "string" ? refreshed.refresh_token : refreshToken,
    p_expires_at: tokenExpiresAt(refreshed.expires_in),
  });
  if (refreshError) throw new Error("Unable to save the refreshed provider connection");
  if (saved !== true) throw new ImportAccessError(409, "Connection changed. Please reconnect or try again.");

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

    const body = await req.json().catch(() => null);
    if (typeof body?.connectionId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.connectionId)) {
      return json({ error: "A valid connectionId is required" }, 400);
    }

    const sb = createClient(supabaseUrl, serviceKey);
    await requireActiveAccount(sb, user.id);

    const { data: connection, error: connError } = await sb
      .from("provider_connections")
      .select("*")
      .eq("id", body.connectionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (connError) return json({ error: "Unable to verify connection" }, 500);
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

    const accessToken = await ensureAccessToken(sb, connection, org, user.id);
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

    const { data: jobId, error: jobError } = await sb.rpc("save_fhir_preview", {
      p_user_id: user.id,
      p_connection_id: connection.id,
      p_expected_token: accessToken,
      p_preview: itemsByType,
      p_counts: counts,
    });
    if (jobError) return json({ error: "Unable to save the record preview. Please try again." }, 500);
    if (!jobId) return json({ error: "Account or connection changed. Please try again." }, 409);

    return json({
      source: "fhir",
      counts,
      itemsByType,
      importJobId: jobId,
      bundles,
      message: `Fetched ${counts.total} records from ${org.name}.`,
    });
  } catch (err: unknown) {
    if (err instanceof ImportAccessError) return json({ error: err.message }, err.status);
    return json({ error: "Unable to retrieve the record preview. Please try again." }, 500);
  }
});
