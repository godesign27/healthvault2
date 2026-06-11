import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  buildAuthorizeUrl,
  createPkcePair,
  randomUrlSafeString,
} from "../_shared/smart-oauth.ts";

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

function redirectUri(): string {
  const explicit = Deno.env.get("FHIR_REDIRECT_URI");
  if (explicit) return explicit;
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl) throw new Error("SUPABASE_URL is not configured");
  return `${supabaseUrl.replace(/\/+$/, "")}/functions/v1/fhir-oauth-callback`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const clientId = Deno.env.get("FHIR_CLIENT_ID");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const body = await req.json() as {
      providerOrganizationId?: string;
      connectionMethod?: "direct_provider_connection" | "epic_connection";
      redirectAfter?: string;
    };

    if (!body.providerOrganizationId) {
      return json({ error: "providerOrganizationId is required" }, 400);
    }

    const connectionMethod = body.connectionMethod || "direct_provider_connection";
    const sb = createClient(supabaseUrl, serviceKey);

    const { data: org, error: orgError } = await sb
      .from("provider_organizations")
      .select("*")
      .eq("id", body.providerOrganizationId)
      .maybeSingle();

    if (orgError) return json({ error: orgError.message }, 500);
    if (!org) return json({ error: "Provider organization not found" }, 404);

    const supportsDirect = org.supports_direct_connection === true;
    const supportsEpic = org.supports_epic_connection === true;
    if (connectionMethod === "direct_provider_connection" && !supportsDirect) {
      return json({ error: "Organization does not support direct connection" }, 400);
    }
    if (connectionMethod === "epic_connection" && !supportsEpic) {
      return json({ error: "Organization does not support Epic connection" }, 400);
    }

    if (!org.fhir_endpoint_url || !org.authorization_endpoint || !org.token_endpoint) {
      return json({
        error: "FHIR OAuth is not configured for this organization",
        status: "not_configured",
      }, 422);
    }

    if (!clientId) {
      return json({
        error: "FHIR_CLIENT_ID is not configured on the server",
        status: "not_configured",
      }, 503);
    }

    await sb
      .from("provider_connections")
      .delete()
      .eq("user_id", user.id)
      .eq("provider_organization_id", body.providerOrganizationId)
      .eq("status", "pending");

    const { data: connection, error: connError } = await sb
      .from("provider_connections")
      .insert({
        user_id: user.id,
        provider_organization_id: body.providerOrganizationId,
        connection_method: connectionMethod,
        status: "pending",
      })
      .select("id")
      .single();

    if (connError) return json({ error: connError.message }, 500);

    const { codeVerifier, codeChallenge } = await createPkcePair();
    const state = randomUrlSafeString(24);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: stateError } = await sb.from("fhir_oauth_states").insert({
      user_id: user.id,
      connection_id: connection.id,
      provider_organization_id: body.providerOrganizationId,
      state,
      code_verifier: codeVerifier,
      connection_method: connectionMethod,
      redirect_after: body.redirectAfter || null,
      expires_at: expiresAt,
    });

    if (stateError) return json({ error: stateError.message }, 500);

    const scope = org.smart_scopes ||
      "patient/*.read openid offline_access";
    const launchUrl = buildAuthorizeUrl({
      authorizationEndpoint: org.authorization_endpoint,
      clientId,
      redirectUri: redirectUri(),
      scope,
      state,
      codeChallenge,
      aud: org.fhir_endpoint_url,
    });

    return json({
      strategy: connectionMethod,
      status: "authorizing",
      connectionId: connection.id,
      launchUrl,
      message: `Redirecting to ${org.name} to authorize access.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return json({ error: message }, 500);
  }
});
