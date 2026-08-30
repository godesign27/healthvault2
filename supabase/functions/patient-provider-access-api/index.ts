import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { authorizePatientProviderRevocation } from "./authorization.ts";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-request-id" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const requestId = req.headers.get("X-Request-Id") ?? crypto.randomUUID();
  const url = Deno.env.get("SUPABASE_URL"), anonKey = Deno.env.get("SUPABASE_ANON_KEY"), serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return json({ error: "Server configuration unavailable", requestId }, 500);
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing authorization", requestId }, 401);
  const body = await req.json().catch(() => null) as null | { action?: "list" | "withdraw"; providerPatientIdentityId?: string; reason?: string };
  if (!body?.action) return json({ error: "action is required", requestId }, 400);

  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const service = createClient(url, serviceKey);
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: "Unauthorized", requestId }, 401);

  const { data: links, error: linkError } = await service.from("patient_identity_links")
    .select("id, provider_patient_identity_id, status, decided_at, revoked_at, created_at")
    .eq("consumer_principal_id", user.id)
    .order("created_at", { ascending: false });
  if (linkError) return json({ error: "Unable to load provider connections", requestId }, 500);
  const patientIds = [...new Set((links ?? []).map((link) => link.provider_patient_identity_id))];

  if (body.action === "list") {
    if (patientIds.length === 0) return json({ connections: [], requestId });
    const [{ data: patients, error: patientError }, { data: grants, error: grantError }, { data: receipts, error: receiptError }] = await Promise.all([
      service.from("provider_patient_identities").select("id, provider_account_id, organization_patient_number").in("id", patientIds),
      service.from("provider_access_grants").select("id, provider_patient_identity_id, scope, purpose, consent_version, status, effective_at, expires_at, granted_at, revoked_at, created_at").eq("consumer_principal_id", user.id).in("provider_patient_identity_id", patientIds).order("created_at", { ascending: false }),
      service.from("patient_access_consent_receipts").select("id, provider_patient_identity_id, consented_at, evidence_type").eq("consumer_principal_id", user.id).in("provider_patient_identity_id", patientIds).order("consented_at", { ascending: false }),
    ]);
    if (patientError || grantError || receiptError) return json({ error: "Unable to load provider connections", requestId }, 500);
    const providerIds = [...new Set((patients ?? []).map((patient) => patient.provider_account_id))];
    const { data: providers, error: providerError } = await service.from("provider_accounts").select("id, display_name").in("id", providerIds);
    if (providerError) return json({ error: "Unable to load provider connections", requestId }, 500);
    const patientById = new Map((patients ?? []).map((patient) => [patient.id, patient]));
    const providerById = new Map((providers ?? []).map((provider) => [provider.id, provider]));
    const latestGrantByPatient = new Map<string, NonNullable<typeof grants>[number]>();
    for (const grant of grants ?? []) if (!latestGrantByPatient.has(grant.provider_patient_identity_id)) latestGrantByPatient.set(grant.provider_patient_identity_id, grant);
    const now = Date.now();
    const connections = (links ?? []).map((link) => {
      const patient = patientById.get(link.provider_patient_identity_id);
      const grant = latestGrantByPatient.get(link.provider_patient_identity_id);
      const receipt = (receipts ?? []).find((entry) => entry.provider_patient_identity_id === link.provider_patient_identity_id);
      const expired = grant?.expires_at ? new Date(grant.expires_at).getTime() <= now : false;
      const status = link.status === "active" && grant?.status === "active" && !expired ? "active" : expired ? "expired" : link.status === "revoked" || grant?.status === "revoked" ? "revoked" : grant?.status ?? link.status;
      return { providerPatientIdentityId: link.provider_patient_identity_id, providerDisplayName: providerById.get(patient?.provider_account_id ?? "")?.display_name ?? "Provider organization", organizationPatientNumber: patient?.organization_patient_number ?? null, status, scope: grant?.scope ?? [], purpose: grant?.purpose ?? null, consentVersion: grant?.consent_version ?? null, effectiveAt: grant?.effective_at ?? grant?.granted_at ?? link.decided_at, expiresAt: grant?.expires_at ?? null, revokedAt: grant?.revoked_at ?? link.revoked_at, consentReceiptId: receipt?.id ?? null, consentedAt: receipt?.consented_at ?? null, consentEvidenceType: receipt?.evidence_type ?? null };
    });
    return json({ connections, requestId });
  }

  if (!body.providerPatientIdentityId || !uuidPattern.test(body.providerPatientIdentityId)) return json({ error: "Valid providerPatientIdentityId is required", requestId }, 400);
  const link = (links ?? []).find((item) => item.provider_patient_identity_id === body.providerPatientIdentityId && item.status === "active");
  const { data: grant } = await service.from("provider_access_grants").select("status").eq("provider_patient_identity_id", body.providerPatientIdentityId).eq("consumer_principal_id", user.id).eq("status", "active").maybeSingle();
  const decision = authorizePatientProviderRevocation({ currentUserId: user.id, linkConsumerPrincipalId: link ? user.id : null, linkStatus: link?.status ?? "missing", grantStatus: grant?.status ?? "missing" });
  if (!decision.allowed) return json({ error: "Active patient-owned connection required", code: decision.code, requestId }, 403);
  const reason = typeof body.reason === "string" && body.reason.trim() ? body.reason.trim().slice(0, 500) : "Withdrawn by patient";
  const { data, error } = await service.rpc("withdraw_patient_provider_access", { p_provider_patient_identity_id: body.providerPatientIdentityId, p_actor_principal_id: user.id, p_request_id: requestId, p_reason: reason });
  if (error || !data) return json({ error: "Unable to withdraw provider access", requestId }, 409);
  return json({ withdrawal: data, requestId });
});
