import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  createEpicClientAssertion,
  exchangeAuthorizationCode,
  tokenExpiresAt,
} from "../_shared/smart-oauth.ts";

async function epicClientAssertion(params: {
  clientId: string;
  tokenEndpoint: string;
  environment?: string | null;
}): Promise<string | undefined> {
  const prefix = params.environment === "production"
    ? "FHIR_EPIC_PRODUCTION"
    : "FHIR_EPIC_SANDBOX";
  const privateKeyPkcs8Base64 = Deno.env.get(`${prefix}_PRIVATE_KEY_PKCS8_BASE64`);
  const keyId = Deno.env.get(`${prefix}_KEY_ID`);
  const jwksUrl = Deno.env.get(`${prefix}_JWKS_URL`);
  if (!privateKeyPkcs8Base64 && !keyId) return undefined;
  if (!privateKeyPkcs8Base64 || !keyId) {
    throw new Error(`${prefix} signing key is incomplete`);
  }
  return createEpicClientAssertion({
    clientId: params.clientId,
    tokenEndpoint: params.tokenEndpoint,
    privateKeyPkcs8Base64,
    keyId,
    jwksUrl,
  });
}

function redirectUri(): string {
  const explicit = Deno.env.get("FHIR_REDIRECT_URI");
  if (explicit) return explicit;
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl) throw new Error("SUPABASE_URL is not configured");
  return `${supabaseUrl.replace(/\/+$/, "")}/functions/v1/fhir-oauth-callback`;
}

function appCompleteUrl(connectionId: string, redirectAfter?: string | null): string {
  if (redirectAfter) return redirectAfter;
  const appUrl = (Deno.env.get("APP_URL") || "http://localhost:5173").replace(/\/+$/, "");
  return `${appUrl}/connect/fhir/complete?connectionId=${encodeURIComponent(connectionId)}`;
}

function errorRedirect(message: string): Response {
  const appUrl = (Deno.env.get("APP_URL") || "http://localhost:5173").replace(/\/+$/, "");
  const url = new URL(`${appUrl}/connect/fhir/complete`);
  url.searchParams.set("error", message);
  return Response.redirect(url.toString(), 302);
}

Deno.serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const oauthError = url.searchParams.get("error");

    if (oauthError) {
      return errorRedirect(url.searchParams.get("error_description") || oauthError);
    }

    if (!code || !state) {
      return errorRedirect("Missing authorization code or state");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const clientSecret = Deno.env.get("FHIR_CLIENT_SECRET");

    const sb = createClient(supabaseUrl, serviceKey);

    const { data: oauthState, error: stateError } = await sb
      .from("fhir_oauth_states")
      .select("*")
      .eq("state", state)
      .is("consumed_at", null)
      .maybeSingle();

    if (stateError || !oauthState) {
      return errorRedirect("Invalid or expired authorization state");
    }

    if (new Date(oauthState.expires_at).getTime() < Date.now()) {
      return errorRedirect("Authorization session expired. Please try again.");
    }

    const { data: org, error: orgError } = await sb
      .from("provider_organizations")
      .select("*")
      .eq("id", oauthState.provider_organization_id)
      .maybeSingle();

    if (orgError || !org?.token_endpoint) {
      return errorRedirect("Provider organization configuration missing");
    }

    const isEpic = org.ehr_vendor?.toLowerCase() === "epic" ||
      oauthState.connection_method === "epic_connection";
    const isEpicSandbox = isEpic &&
      (org.fhir_environment === "sandbox" ||
        org.fhir_endpoint_url?.includes("fhir.epic.com"));
    const clientId = isEpic
      ? isEpicSandbox
        ? Deno.env.get("FHIR_EPIC_SANDBOX_CLIENT_ID") || Deno.env.get("FHIR_CLIENT_ID")
        : Deno.env.get("FHIR_EPIC_PRODUCTION_CLIENT_ID") || Deno.env.get("FHIR_CLIENT_ID")
      : Deno.env.get("FHIR_CLIENT_ID");
    if (!clientId) return errorRedirect("FHIR client ID is not configured");

    const clientAssertion = isEpic
      ? await epicClientAssertion({
        clientId,
        tokenEndpoint: org.token_endpoint,
        environment: isEpicSandbox ? "sandbox" : "production",
      })
      : undefined;

    const tokenPayload = await exchangeAuthorizationCode({
      tokenEndpoint: org.token_endpoint,
      code,
      redirectUri: redirectUri(),
      clientId,
      clientSecret: clientAssertion ? undefined : clientSecret || undefined,
      clientAssertion,
      codeVerifier: oauthState.code_verifier,
    });

    const accessToken = typeof tokenPayload.access_token === "string"
      ? tokenPayload.access_token
      : null;
    const refreshToken = typeof tokenPayload.refresh_token === "string"
      ? tokenPayload.refresh_token
      : null;
    const patientId = typeof tokenPayload.patient === "string"
      ? tokenPayload.patient
      : null;

    if (!accessToken || !patientId) {
      return errorRedirect("Authorization succeeded but patient context was missing");
    }

    const { error: updateError } = await sb
      .from("provider_connections")
      .update({
        status: "active",
        fhir_access_token: accessToken,
        fhir_refresh_token: refreshToken,
        fhir_patient_id: patientId,
        token_expires_at: tokenExpiresAt(tokenPayload.expires_in),
        updated_at: new Date().toISOString(),
      })
      .eq("id", oauthState.connection_id)
      .eq("user_id", oauthState.user_id);

    if (updateError) return errorRedirect(updateError.message);

    await sb
      .from("fhir_oauth_states")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", oauthState.id);

    return Response.redirect(
      appCompleteUrl(oauthState.connection_id, oauthState.redirect_after),
      302,
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Authorization failed";
    return errorRedirect(message);
  }
});
