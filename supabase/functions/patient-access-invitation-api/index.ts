import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { authorizePatientInvitationPreview } from "./authorization.ts";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-request-id" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
function assurance(authHeader: string) { try { const encoded = authHeader.replace(/^Bearer\s+/i, "").split(".")[1].replace(/-/g, "+").replace(/_/g, "/"); const payload = JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, "="))); return typeof payload.aal === "string" ? payload.aal : "unknown"; } catch { return "unknown"; } }

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const requestId = req.headers.get("X-Request-Id") ?? crypto.randomUUID();
  const url = Deno.env.get("SUPABASE_URL"), anonKey = Deno.env.get("SUPABASE_ANON_KEY"), serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return json({ error: "Server configuration unavailable", requestId }, 500);
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing authorization", requestId }, 401);
  const body = await req.json().catch(() => null) as null | { action?: "preview" | "accept" | "deny"; invitationId?: string };
  if (!body?.action || !body.invitationId) return json({ error: "action and invitationId are required", requestId }, 400);
  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const service = createClient(url, serviceKey);
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: "Unauthorized", requestId }, 401);
  const { data: invitation } = await service.from("patient_access_invitations")
    .select("id, provider_account_id, provider_patient_identity_id, email, requested_scope, purpose, consent_version, synthetic, status, expires_at, access_expires_at")
    .eq("id", body.invitationId).maybeSingle();
  if (!invitation) return json({ error: "Invitation unavailable", requestId }, 404);
  const decision = authorizePatientInvitationPreview({ invitation: { status: invitation.status, email: invitation.email, expiresAt: invitation.expires_at, synthetic: invitation.synthetic }, userEmail: user.email ?? null, emailVerified: Boolean(user.email_confirmed_at) });
  if (!decision.allowed) return json({ error: "Patient access invitation denied", code: decision.code, requestId }, decision.code === "invitation_expired" ? 410 : 403);
  if (body.action === "preview") {
    const [{ data: provider }, { data: demographic }] = await Promise.all([
      service.from("provider_accounts").select("display_name").eq("id", invitation.provider_account_id).maybeSingle(),
      service.from("provider_import_rows").select("given_name, family_name, organization_patient_number, birth_date, administrative_sex, email, phone, address_line_1, address_line_2, city, state, postal_code, country").eq("committed_patient_identity_id", invitation.provider_patient_identity_id).maybeSingle(),
    ]);
    const { data: packages } = await service.from("provider_clinical_packages").select("id").eq("provider_patient_identity_id", invitation.provider_patient_identity_id).eq("synthetic", true).in("status", ["validated", "released"]);
    const packageIds = (packages ?? []).map((item) => item.id);
    const { data: resources } = packageIds.length ? await service.from("provider_clinical_resources").select("resource_type").in("package_id", packageIds) : { data: [] };
    const types = (resources ?? []).map((item) => item.resource_type);
    const profileDetails = demographic ? [demographic.given_name, demographic.family_name, demographic.organization_patient_number, demographic.birth_date, demographic.administrative_sex, demographic.email, demographic.phone, demographic.address_line_1, demographic.address_line_2, demographic.city, demographic.state, demographic.postal_code, demographic.country].filter((value) => typeof value === "string" && value.trim()).length : 0;
    return json({ invitation: { providerDisplayName: provider?.display_name ?? "Provider organization", patientDisplayName: demographic ? `${demographic.given_name} ${demographic.family_name}` : "Roster patient", organizationPatientNumber: demographic?.organization_patient_number ?? null, scope: invitation.requested_scope, purpose: invitation.purpose, consentVersion: invitation.consent_version, expiresAt: invitation.expires_at, accessExpiresAt: invitation.access_expires_at, synthetic: true, dataSummary: { profileDetails, healthRecords: types.length, labs: types.filter((type) => type === "lab").length, medications: types.filter((type) => type === "medication").length, vitals: types.filter((type) => type === "vital").length, clinicalImportEnabled: true } }, requestId });
  }
  const { data, error } = await userClient.rpc("respond_patient_access_invitation", { p_invitation_id: invitation.id, p_accept: body.action === "accept", p_request_id: requestId, p_assurance_level: assurance(authHeader) });
  if (error || !data) return json({ error: "Unable to record patient response", requestId }, 409);
  return json({ response: data, requestId });
});
