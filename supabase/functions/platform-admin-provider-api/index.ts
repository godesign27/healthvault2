import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { authorizePatientAccessIntervention, authorizePlatformProviderAction, hasRecentAal2 } from "./authorization.ts";
import { validateBulkPractitionerVerification, validatePractitionerVerification } from "./practitioner-verification.ts";
import { validatePatientAccessIntervention } from "./patient-access-intervention.ts";
import { countActiveProviderConnections } from "./provider-connection-metrics.ts";
import { validateMfaRecoveryLookup, validateMfaRecoveryReset } from "./mfa-recovery.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-request-id",
};
const ROLE_PERMISSIONS: Record<string, string[]> = {
  organization_owner: ["organization.read", "organization.manage", "members.read", "members.manage", "imports.read", "imports.manage", "patient_panels.manage", "forms.read", "requests.read", "integrations.read", "integrations.manage", "provider_audit.read"],
  provider_admin: ["organization.read", "members.read", "members.manage", "imports.read", "imports.manage", "patient_panels.manage", "forms.read", "requests.read", "integrations.read", "integrations.manage", "provider_audit.read"],
  practitioner: ["organization.read", "patients.read_assigned", "forms.read", "requests.read"],
  operations_staff: ["organization.read", "imports.read", "forms.read", "requests.read"],
  integration_operator: ["organization.read", "imports.read", "imports.manage", "integrations.read", "integrations.manage"],
  privacy_auditor: ["organization.read", "provider_audit.read"],
};

function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
function assurance(authHeader: string) {
  try {
    const encoded = authHeader.replace(/^Bearer\s+/i, "").split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, "=")));
    const recentTotp = Array.isArray(payload.amr) ? payload.amr.find((entry: { method?: string }) => entry?.method === "totp") : null;
    const authenticatedAt = Number(recentTotp?.timestamp ?? payload.auth_time ?? payload.iat);
    return { aal: typeof payload.aal === "string" ? payload.aal : null, authenticatedAt: Number.isFinite(authenticatedAt) ? new Date(authenticatedAt * 1000).toISOString() : null };
  } catch { return { aal: null, authenticatedAt: null }; }
}
function invitationUrl(appUrl: string, invitationId: string) {
  const url = new URL(appUrl);
  if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") throw new Error("APP_URL must use HTTPS outside local development");
  return new URL(`/provider/invitations/${invitationId}`, url).toString();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const requestId = req.headers.get("X-Request-Id") ?? crypto.randomUUID();
  const url = Deno.env.get("SUPABASE_URL"), anonKey = Deno.env.get("SUPABASE_ANON_KEY"), serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return json({ error: "Server configuration unavailable", requestId }, 500);
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing authorization", requestId }, 401);
  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: "Unauthorized", requestId }, 401);
  const service = createClient(url, serviceKey);
  const body = await req.json().catch(() => null) as null | { action?: string; providerAccountId?: string; providerPatientIdentityId?: string; email?: string; confirmEmail?: string; userId?: string; roles?: string[]; invitationId?: string; practitionerProfileId?: string; practitionerProfileIds?: string[]; credentialStatus?: string; evidenceRef?: string; reason?: string };
  if (!body?.action) return json({ error: "action is required", requestId }, 400);
  const { data: assignmentRows } = await service.from("admin_role_assignments").select("role_key, permissions").eq("principal_id", user.id).is("revoked_at", null);
  const assignments = (assignmentRows ?? []).map((row) => ({ roleKey: String(row.role_key), permissions: Array.isArray(row.permissions) ? row.permissions.map(String) : [] }));
  const interventionAction = ["list-patient-connections", "terminate-patient-connection", "lookup-mfa-recovery", "reset-user-mfa"].includes(body.action);
  const manageAction = ["create-invitation", "resend-invitation", "update-practitioner-credential", "bulk-update-practitioner-credentials", "terminate-patient-connection", "reset-user-mfa"].includes(body.action);
  const decision = interventionAction ? authorizePatientAccessIntervention(assignments) : authorizePlatformProviderAction(assignments, manageAction ? "manage" : "read");
  const audit = async (action: string, outcome: string, targetRef?: string, reason?: string) => {
    await service.from("admin_audit_events").insert({ actor_principal_id: user.id, provider_account_id: body.providerAccountId ?? null, action, target_type: "provider_account", target_ref: targetRef ?? body.providerAccountId ?? null, authorization_context: { source: "platform-admin-provider-api", requestedAction: body.action }, reason: reason ?? null, outcome, request_id: requestId });
  };
  if (!decision.allowed) { await audit(`platform.providers.${body.action}`, "denied", undefined, decision.reason); return json({ error: decision.reason, requestId }, 403); }
  if (manageAction && !hasRecentAal2(assurance(authHeader))) { await audit(`platform.providers.${body.action}`, "denied", undefined, "recent AAL2 authentication required"); return json({ error: "recent AAL2 authentication required", requestId }, 403); }

  if (body.action === "lookup-mfa-recovery") {
    let input;
    try { input = validateMfaRecoveryLookup(body); }
    catch (error) { return json({ error: error instanceof Error ? error.message : "Invalid recovery lookup", requestId }, 400); }
    let matchedUser: { id: string; email?: string; factors?: Array<{ id: string; factor_type: string; status: string; friendly_name?: string }> } | null = null;
    for (let page = 1; page <= 10 && !matchedUser; page += 1) {
      const { data, error } = await service.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) return json({ error: "Unable to search authentication accounts", requestId }, 500);
      matchedUser = (data.users as typeof matchedUser[]).find((entry) => entry?.email?.toLowerCase() === input.email) ?? null;
      if (data.users.length < 1000) break;
    }
    if (!matchedUser) return json({ error: "Authentication account not found", requestId }, 404);
    const { data: userData, error: userError } = await service.auth.admin.getUserById(matchedUser.id);
    if (userError || !userData.user) return json({ error: "Unable to load authentication account", requestId }, 500);
    const factors = (userData.user.factors ?? []).filter((factor) => factor.status === "verified").map((factor) => ({ id: factor.id, type: factor.factor_type, status: factor.status, friendlyName: factor.friendly_name ?? null }));
    await audit("platform.identity.mfa_recovery.lookup", "succeeded", matchedUser.id);
    return json({ account: { userId: matchedUser.id, email: matchedUser.email, verifiedFactors: factors }, requestId });
  }

  if (body.action === "reset-user-mfa") {
    let input;
    try { input = validateMfaRecoveryReset(body); }
    catch (error) { return json({ error: error instanceof Error ? error.message : "Invalid recovery reset", requestId }, 400); }
    if (input.userId === user.id) return json({ error: "A super administrator cannot reset their own MFA", requestId }, 409);
    const { data: target, error: targetError } = await service.auth.admin.getUserById(input.userId);
    if (targetError || !target.user || target.user.email?.toLowerCase() !== input.email) return json({ error: "Exact authentication account match required", requestId }, 409);
    const factors = (target.user.factors ?? []).filter((factor) => factor.status === "verified");
    if (!factors.length) return json({ error: "This account has no verified MFA factors", requestId }, 409);
    let removed = 0;
    for (const factor of factors) {
      const { error } = await service.auth.admin.mfa.deleteFactor({ userId: input.userId, id: factor.id });
      if (error) { await audit("platform.identity.mfa_recovery.reset", "failed", input.userId, "factor deletion failed"); return json({ error: "MFA reset did not complete", removed, requestId }, 500); }
      removed += 1;
    }
    await service.from("admin_audit_events").insert({ actor_principal_id: user.id, action: "platform.identity.mfa_recovery.reset", target_type: "auth_user", target_ref: input.userId, authorization_context: { source: "platform-admin-provider-api", requestedAction: body.action, confirmedEmail: input.email, removedFactorCount: removed }, reason: input.reason, outcome: "succeeded", request_id: requestId });
    return json({ reset: { userId: input.userId, email: input.email, removedFactorCount: removed, sessionsInvalidated: true }, requestId });
  }

  if (body.action === "list-patient-connections") {
    const [{ data: links, error }, { data: grants }, { data: patients }, { data: providers }, { data: invitations }, { data: demographics }, { data: receipts }] = await Promise.all([
      service.from("patient_identity_links").select("id, provider_patient_identity_id, consumer_principal_id, status, decided_at, revoked_at, created_at").order("created_at", { ascending: false }).limit(250),
      service.from("provider_access_grants").select("provider_patient_identity_id, consumer_principal_id, scope, purpose, consent_version, status, effective_at, expires_at, revoked_at, created_at").order("created_at", { ascending: false }).limit(500),
      service.from("provider_patient_identities").select("id, provider_account_id, organization_patient_number, status"),
      service.from("provider_accounts").select("id, display_name"),
      service.from("patient_access_invitations").select("provider_patient_identity_id, response_principal_id, email, status, responded_at, created_at").order("created_at", { ascending: false }).limit(500),
      service.from("provider_import_rows").select("committed_patient_identity_id, given_name, family_name, email").not("committed_patient_identity_id", "is", null).limit(500),
      service.from("patient_access_consent_receipts").select("id, provider_patient_identity_id, consumer_principal_id, consented_at, evidence_type").order("consented_at", { ascending: false }).limit(500),
    ]);
    if (error) return json({ error: "Unable to load patient connections", requestId }, 500);
    const patientById = new Map((patients ?? []).map((entry) => [entry.id, entry]));
    const providerById = new Map((providers ?? []).map((entry) => [entry.id, entry]));
    const connections = (links ?? []).map((link) => {
      const patient = patientById.get(link.provider_patient_identity_id);
      const grant = (grants ?? []).find((entry) => entry.provider_patient_identity_id === link.provider_patient_identity_id && entry.consumer_principal_id === link.consumer_principal_id);
      const invitation = (invitations ?? []).find((entry) => entry.provider_patient_identity_id === link.provider_patient_identity_id && entry.response_principal_id === link.consumer_principal_id);
      const demographic = (demographics ?? []).find((entry) => entry.committed_patient_identity_id === link.provider_patient_identity_id);
      const receipt = (receipts ?? []).find((entry) => entry.provider_patient_identity_id === link.provider_patient_identity_id && entry.consumer_principal_id === link.consumer_principal_id);
      const expired = grant?.expires_at ? new Date(grant.expires_at).getTime() <= Date.now() : false;
      const status = link.status === "active" && grant?.status === "active" && !expired ? "active" : expired ? "expired" : link.status === "revoked" || grant?.status === "revoked" ? "revoked" : grant?.status ?? link.status;
      return { providerPatientIdentityId: link.provider_patient_identity_id, providerAccountId: patient?.provider_account_id ?? null, providerName: providerById.get(patient?.provider_account_id ?? "")?.display_name ?? "Unknown provider", patientName: demographic ? `${demographic.given_name} ${demographic.family_name}`.trim() : "Roster patient", organizationPatientNumber: patient?.organization_patient_number ?? null, email: invitation?.email ?? demographic?.email ?? null, status, scope: grant?.scope ?? [], purpose: grant?.purpose ?? null, consentVersion: grant?.consent_version ?? null, effectiveAt: grant?.effective_at ?? link.decided_at, expiresAt: grant?.expires_at ?? null, revokedAt: grant?.revoked_at ?? link.revoked_at, consentReceiptId: receipt?.id ?? null, consentedAt: receipt?.consented_at ?? null, consentEvidenceType: receipt?.evidence_type ?? null };
    }).filter((entry) => entry.providerAccountId);
    await audit("platform.patient_connections.list", "succeeded");
    return json({ connections, requestId });
  }

  if (body.action === "terminate-patient-connection") {
    let input;
    try { input = validatePatientAccessIntervention(body); }
    catch (error) { return json({ error: error instanceof Error ? error.message : "Invalid patient access intervention", requestId }, 400); }
    const { data, error } = await service.rpc("revoke_provider_patient_access", { p_provider_account_id: input.providerAccountId, p_provider_patient_identity_id: input.providerPatientIdentityId, p_actor_principal_id: user.id, p_request_id: requestId, p_reason: input.reason });
    if (error || !data) { await audit("platform.patient_connection.terminate", "failed", input.providerPatientIdentityId, "termination transaction failed"); return json({ error: "Unable to terminate patient connection", requestId }, 409); }
    return json({ intervention: data, requestId });
  }

  if (body.action === "list-providers") {
    const [{ data: accounts, error }, { data: memberships }, { data: identities }, { data: imports }, { data: links, error: linkError }, { data: grants, error: grantError }] = await Promise.all([
      service.from("provider_accounts").select("id, display_name, legal_name, slug, provider_type, status, created_at").order("display_name"),
      service.from("provider_memberships").select("provider_account_id, status"),
      service.from("provider_patient_identities").select("id, provider_account_id, status"),
      service.from("provider_import_jobs").select("provider_account_id, created_at").order("created_at", { ascending: false }),
      service.from("patient_identity_links").select("provider_patient_identity_id, consumer_principal_id, status").eq("status", "active"),
      service.from("provider_access_grants").select("provider_patient_identity_id, consumer_principal_id, status, effective_at, expires_at").eq("status", "active"),
    ]);
    if (error || linkError || grantError) return json({ error: "Unable to load provider directory", requestId }, 500);
    const activeConnectionCounts = countActiveProviderConnections({
      patients: (identities ?? []).map((entry) => ({ id: entry.id, providerAccountId: entry.provider_account_id, status: entry.status })),
      links: (links ?? []).map((entry) => ({ patientId: entry.provider_patient_identity_id, consumerPrincipalId: entry.consumer_principal_id, status: entry.status })),
      grants: (grants ?? []).map((entry) => ({ patientId: entry.provider_patient_identity_id, consumerPrincipalId: entry.consumer_principal_id, status: entry.status, effectiveAt: entry.effective_at, expiresAt: entry.expires_at })),
    });
    const providers = (accounts ?? []).map((account) => ({
      id: account.id, displayName: account.display_name, legalName: account.legal_name, slug: account.slug,
      providerType: account.provider_type, status: account.status, locationCount: 0, activeConnectionCount: activeConnectionCounts.get(account.id) ?? 0,
      activeMemberCount: (memberships ?? []).filter((row) => row.provider_account_id === account.id && row.status === "active").length,
      rosterCount: (identities ?? []).filter((row) => row.provider_account_id === account.id).length,
      readiness: account.status === "active" ? "Pilot active" : account.status === "verification_pending" ? "Identity verification" : "Needs review",
      lastActivityAt: (imports ?? []).find((row) => row.provider_account_id === account.id)?.created_at ?? account.created_at,
    }));
    await audit("platform.providers.list", "succeeded");
    return json({ providers, requestId });
  }

  if (body.action === "list-imports") {
    const [{ data: jobs, error }, { data: accounts }, { data: sources }, { data: reconciliations }, { data: exceptions }] = await Promise.all([
      service.from("provider_import_jobs").select("id, provider_account_id, import_source_id, schema_version, status, row_count, valid_row_count, invalid_row_count, created_at, committed_at, rolled_back_at").order("created_at", { ascending: false }).limit(100),
      service.from("provider_accounts").select("id, display_name"),
      service.from("provider_import_sources").select("id, display_name, source_system, synthetic"),
      service.from("provider_import_reconciliations").select("import_job_id, inserted_count, unchanged_count, exception_count"),
      service.from("provider_import_exceptions").select("import_job_id"),
    ]);
    if (error) { await audit("platform.providers.imports.list", "failed", undefined, "import aggregate query failed"); return json({ error: "Unable to load provider imports", requestId }, 500); }
    const imports = (jobs ?? []).map((job) => {
      const account = (accounts ?? []).find((entry) => entry.id === job.provider_account_id);
      const source = (sources ?? []).find((entry) => entry.id === job.import_source_id);
      const reconciliation = (reconciliations ?? []).find((entry) => entry.import_job_id === job.id);
      return {
        id: job.id, providerAccountId: job.provider_account_id, providerName: account?.display_name ?? "Unknown provider",
        sourceName: source?.display_name ?? "Unknown source", sourceSystem: source?.source_system ?? "unknown", synthetic: source?.synthetic === true,
        schemaVersion: job.schema_version, status: job.status, rowCount: job.row_count, validRowCount: job.valid_row_count,
        invalidRowCount: job.invalid_row_count, exceptionCount: reconciliation?.exception_count ?? (exceptions ?? []).filter((entry) => entry.import_job_id === job.id).length,
        insertedCount: reconciliation?.inserted_count ?? 0, unchangedCount: reconciliation?.unchanged_count ?? 0,
        createdAt: job.created_at, committedAt: job.committed_at, rolledBackAt: job.rolled_back_at,
      };
    });
    await audit("platform.providers.imports.list", "succeeded");
    return json({ imports, requestId });
  }

  if (body.action === "list-members") {
    if (!body.providerAccountId) return json({ error: "providerAccountId is required", requestId }, 400);
    const [{ data: memberships, error }, { data: invitations }] = await Promise.all([
      service.from("provider_memberships").select("id, principal_id, roles, status, invited_at, activated_at, suspended_at").eq("provider_account_id", body.providerAccountId).neq("status", "removed"),
      service.from("provider_membership_invitations").select("id, email, roles, status, invited_at, expires_at, delivery_status, delivery_attempts, last_delivery_at").eq("provider_account_id", body.providerAccountId).eq("status", "pending"),
    ]);
    if (error) return json({ error: "Unable to load provider memberships", requestId }, 500);
    const members = await Promise.all((memberships ?? []).map(async (membership) => {
      const { data } = await service.auth.admin.getUserById(membership.principal_id);
      return { id: membership.id, principalId: membership.principal_id, email: data.user?.email ?? null, roles: membership.roles, status: membership.status, invitedAt: membership.invited_at, lastActiveAt: membership.activated_at ?? membership.suspended_at };
    }));
    await audit("platform.providers.members.list", "succeeded");
    return json({ members, invitations: invitations ?? [], requestId });
  }

  if (body.action === "list-practitioners") {
    const { data, error } = await service.from("practitioner_profiles")
      .select("id, provider_account_id, membership_id, display_name, specialty, professional_identifier_type, professional_identifier_value, credential_status, credential_evidence_ref, credential_review_reason, credential_reviewed_at, status, updated_at")
      .order("updated_at", { ascending: false });
    if (error) return json({ error: "Unable to load practitioner credential reviews", requestId }, 500);
    const providerIds = [...new Set((data ?? []).map((profile) => profile.provider_account_id))];
    const { data: accounts } = providerIds.length ? await service.from("provider_accounts").select("id, display_name").in("id", providerIds) : { data: [] };
    const practitioners = await Promise.all((data ?? []).map(async (profile) => {
      const { data: membership } = await service.from("provider_memberships").select("principal_id").eq("id", profile.membership_id).maybeSingle();
      const { data: authUser } = membership?.principal_id ? await service.auth.admin.getUserById(membership.principal_id) : { data: { user: null } };
      return { ...profile, provider_name: (accounts ?? []).find((account) => account.id === profile.provider_account_id)?.display_name ?? "Unknown provider", email: authUser.user?.email ?? null };
    }));
    await audit("platform.providers.practitioners.list", "succeeded");
    return json({ practitioners, requestId });
  }

  if (body.action === "update-practitioner-credential") {
    let input;
    try { input = validatePractitionerVerification(body); }
    catch (error) { return json({ error: error instanceof Error ? error.message : "Invalid credential review", requestId }, 400); }
    const { data: existing } = await service.from("practitioner_profiles").select("id, provider_account_id, credential_status").eq("id", input.practitionerProfileId).maybeSingle();
    if (!existing || (body.providerAccountId && existing.provider_account_id !== body.providerAccountId)) return json({ error: "Practitioner profile not found", requestId }, 404);
    const reviewedAt = new Date().toISOString();
    const { data: practitioner, error } = await service.from("practitioner_profiles").update({
      credential_status: input.credentialStatus,
      credential_evidence_ref: input.evidenceRef || null,
      credential_review_reason: input.reason || null,
      credential_reviewed_by: user.id,
      credential_reviewed_at: reviewedAt,
      updated_at: reviewedAt,
    }).eq("id", input.practitionerProfileId).select("id, provider_account_id, credential_status, credential_evidence_ref, credential_review_reason, credential_reviewed_at, updated_at").single();
    if (error || !practitioner) { await audit("platform.providers.practitioners.credential.update", "failed", input.practitionerProfileId, "credential update failed"); return json({ error: "Unable to update practitioner credential", requestId }, 500); }
    await service.from("admin_audit_events").insert({
      actor_principal_id: user.id, provider_account_id: practitioner.provider_account_id,
      action: "platform.providers.practitioners.credential.update", target_type: "practitioner_profile", target_ref: practitioner.id,
      authorization_context: { source: "platform-admin-provider-api", requestedAction: body.action, previousStatus: existing.credential_status },
      reason: input.reason || null, outcome: "succeeded", request_id: requestId,
      metadata: { credentialStatus: input.credentialStatus, evidenceRef: input.evidenceRef || null },
    });
    return json({ practitioner, requestId });
  }

  if (body.action === "bulk-update-practitioner-credentials") {
    let input;
    try { input = validateBulkPractitionerVerification(body); }
    catch (error) { return json({ error: error instanceof Error ? error.message : "Invalid bulk credential review", requestId }, 400); }
    const { data: existing, error: existingError } = await service.from("practitioner_profiles").select("id, provider_account_id, credential_status").in("id", input.practitionerProfileIds);
    if (existingError || !existing || existing.length !== input.practitionerProfileIds.length) return json({ error: "One or more practitioner profiles were not found", requestId }, 404);
    const reviewedAt = new Date().toISOString();
    const { data: practitioners, error } = await service.from("practitioner_profiles").update({
      credential_status: input.credentialStatus, credential_evidence_ref: input.evidenceRef || null,
      credential_review_reason: input.reason || null, credential_reviewed_by: user.id,
      credential_reviewed_at: reviewedAt, updated_at: reviewedAt,
    }).in("id", input.practitionerProfileIds).select("id, provider_account_id, credential_status");
    if (error || !practitioners || practitioners.length !== input.practitionerProfileIds.length) return json({ error: "Unable to update all practitioner credentials", requestId }, 500);
    await service.from("admin_audit_events").insert(existing.map((profile) => ({
      actor_principal_id: user.id, provider_account_id: profile.provider_account_id,
      action: "platform.providers.practitioners.credential.bulk_update", target_type: "practitioner_profile", target_ref: profile.id,
      authorization_context: { source: "platform-admin-provider-api", requestedAction: body.action, previousStatus: profile.credential_status, batchSize: existing.length },
      reason: input.reason || null, outcome: "succeeded", request_id: requestId,
      metadata: { credentialStatus: input.credentialStatus, evidenceRef: input.evidenceRef || null },
    })));
    return json({ practitioners, updatedCount: practitioners.length, requestId });
  }

  const deliver = async (invitation: { id: string; email: string; delivery_attempts?: number }) => {
    const appUrl = Deno.env.get("APP_URL");
    if (!appUrl) throw new Error("APP_URL is not configured");
    const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await client.auth.signInWithOtp({ email: invitation.email, options: { emailRedirectTo: invitationUrl(appUrl, invitation.id), shouldCreateUser: true, data: { provider_invitation_id: invitation.id, account_kind: "provider" } } });
    if (error) throw error;
    await service.from("provider_membership_invitations").update({ delivery_status: "sent", delivery_attempts: Number(invitation.delivery_attempts ?? 0) + 1, last_delivery_at: new Date().toISOString(), last_delivery_error: null }).eq("id", invitation.id);
  };

  if (body.action === "create-invitation") {
    const email = body.email?.trim().toLowerCase();
    if (!body.providerAccountId || !email || !/^\S+@\S+\.\S+$/.test(email) || !Array.isArray(body.roles) || !body.roles.length || !body.roles.every((role) => role in ROLE_PERMISSIONS)) return json({ error: "providerAccountId, valid email, and valid roles are required", requestId }, 400);
    const permissions = [...new Set(body.roles.flatMap((role) => ROLE_PERMISSIONS[role]))];
    const { data, error } = await service.from("provider_membership_invitations").insert({ provider_account_id: body.providerAccountId, email, roles: body.roles, permissions, invited_by: user.id, expires_at: new Date(Date.now() + 7 * 86400000).toISOString() }).select("id, email, roles, status, invited_at, expires_at, delivery_attempts").single();
    if (error || !data) return json({ error: "Unable to create invitation", requestId }, 409);
    try { await deliver(data); } catch (deliveryError) { await service.from("provider_membership_invitations").update({ delivery_status: "failed", delivery_attempts: 1, last_delivery_at: new Date().toISOString(), last_delivery_error: deliveryError instanceof Error ? deliveryError.message.slice(0, 500) : "delivery failed" }).eq("id", data.id); }
    await audit("platform.providers.members.invite", "succeeded", data.id);
    return json({ invitation: data, requestId }, 201);
  }

  if (body.action === "resend-invitation") {
    if (!body.providerAccountId || !body.invitationId) return json({ error: "providerAccountId and invitationId are required", requestId }, 400);
    const { data } = await service.from("provider_membership_invitations").select("id, email, status, expires_at, delivery_attempts, last_delivery_at").eq("id", body.invitationId).eq("provider_account_id", body.providerAccountId).maybeSingle();
    if (!data || data.status !== "pending" || new Date(data.expires_at) <= new Date()) return json({ error: "Pending unexpired invitation required", requestId }, 409);
    if (data.last_delivery_at && Date.now() - new Date(data.last_delivery_at).getTime() < 60000) return json({ error: "Wait before resending this invitation", requestId }, 429);
    try { await deliver(data); } catch { return json({ error: "Invitation delivery failed", requestId }, 502); }
    await audit("platform.providers.members.invitation.resend", "succeeded", data.id);
    return json({ invitationId: data.id, deliveryStatus: "sent", requestId });
  }

  await audit(`platform.providers.${body.action}`, "denied", undefined, "unsupported action");
  return json({ error: "Unsupported action", requestId }, 400);
});
