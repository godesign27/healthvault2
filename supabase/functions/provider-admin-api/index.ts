import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { authorizeMemberRoleChange, authorizeMembershipStatusChange, authorizeWorkspaceAccess, hasRecentAal2, isProviderRole, permissionsForRoles } from "./authorization.ts";
import { createInvitationDeliveryPlan } from "./invitation-delivery.ts";
import { validateRosterImportPayload } from "./roster-import.ts";
import { canAssignToPanel, validateBulkPanelAssignments, validatePanelAssignmentInput } from "./panel-management.ts";
import { buildSyntheticPatientAccessInvitation, normalizePatientInvitationSelection, PATIENT_ACCESS_CONSENT_VERSION, PATIENT_ACCESS_SCOPE } from "./patient-access.ts";
import { buildDigestDeliveryJobs } from "./patient-access-delivery.ts";
import { resolveAccessiblePractitionerPatientIds } from "./practitioner-patients.ts";
import { sanitizeProviderAuditEvent } from "./provider-audit.ts";
import { clinicalCounts, validateClinicalImport } from "./clinical-import.ts";
import { validatePractitionerImport, validatePractitionerInvitationCancellation } from "./practitioner-import.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-request-id",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function sha256(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function assuranceFromToken(authHeader: string) {
  try {
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const encodedPayload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = encodedPayload.padEnd(Math.ceil(encodedPayload.length / 4) * 4, "=");
    const payload = JSON.parse(atob(paddedPayload));
    const recentTotp = Array.isArray(payload.amr) ? payload.amr.find((entry: { method?: string }) => entry?.method === "totp") : null;
    const authenticatedAtSeconds = Number(recentTotp?.timestamp ?? payload.auth_time ?? payload.iat);
    return {
      aal: typeof payload.aal === "string" ? payload.aal : null,
      authenticatedAt: Number.isFinite(authenticatedAtSeconds) ? new Date(authenticatedAtSeconds * 1000).toISOString() : null,
    };
  } catch {
    return { aal: null, authenticatedAt: null };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const requestId = req.headers.get("X-Request-Id") ?? crypto.randomUUID();
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) return json({ error: "Server configuration unavailable", requestId }, 500);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing authorization", requestId }, 401);

  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: "Unauthorized", requestId }, 401);

  const service = createClient(supabaseUrl, serviceKey);
  const body = await req.json().catch(() => null) as null | {
    action?: string;
    providerAccountId?: string;
    targetPrincipalId?: string;
    email?: string;
    roles?: string[];
    status?: "active" | "suspended" | "removed";
    reason?: string;
    invitationId?: string;
    rows?: unknown;
    sourceDisplayName?: string;
    contentSha256?: string;
    synthetic?: boolean;
    importJobId?: string;
    practitionerProfileId?: string;
    patientIdentityId?: string;
    relationshipType?: string;
    assignmentId?: string;
    patientIdentityIds?: string[];
    inviteAllEligible?: boolean;
    deliveryJobId?: string;
    clinicalPackage?: unknown;
    clinicalPackageId?: string;
    practitioners?: unknown;
    invitationIds?: unknown;
    sourceImportBatchId?: string;
    assignments?: unknown;
  };
  if (!body?.action) return json({ error: "action is required", requestId }, 400);

  const assurance = assuranceFromToken(authHeader);
  const hasAal2 = assurance.aal === "aal2";
  const recentAal2 = hasRecentAal2(assurance);
  if (body.action === "resolve-workspace") {
    if (!hasAal2) return json({ error: "AAL2 authentication required", requestId }, 403);
    const { data: memberships, error: membershipError } = await service.from("provider_memberships")
      .select("id, provider_account_id, status, roles, permissions, activated_at")
      .eq("principal_id", user.id).eq("status", "active").order("activated_at", { ascending: true });
    if (membershipError || !memberships?.length) return json({ error: "No active provider workspace is available", requestId }, 403);
    const providerIds = memberships.map((membership) => membership.provider_account_id);
    const { data: accounts, error: accountError } = await service.from("provider_accounts")
      .select("id, display_name, legal_name, slug, provider_type, status")
      .in("id", providerIds).eq("status", "active");
    if (accountError || !accounts?.length) return json({ error: "No active provider workspace is available", requestId }, 403);
    const account = accounts[0];
    const membership = memberships.find((item) => item.provider_account_id === account.id);
    if (!membership) return json({ error: "Provider access denied", requestId }, 403);
    await service.from("admin_audit_events").insert({
      actor_principal_id: user.id, provider_account_id: account.id, action: "provider.workspace.view",
      target_type: "provider_account", target_ref: account.id,
      authorization_context: { source: "provider-admin-api", aal: "aal2" }, outcome: "succeeded", request_id: requestId,
    });
    return json({ workspace: { account, membership }, requestId });
  }

  if (!body.providerAccountId) return json({ error: "providerAccountId is required", requestId }, 400);

  const audit = async (action: string, outcome: "allowed" | "denied" | "succeeded" | "failed", targetRef?: string, reason?: string, targetType = "provider_membership") => {
    await service.from("admin_audit_events").insert({
      actor_principal_id: user.id,
      provider_account_id: body.providerAccountId,
      action,
      target_type: targetType,
      target_ref: targetRef ?? null,
      authorization_context: { source: "provider-admin-api", requestedAction: body.action },
      reason: reason ?? body.reason ?? null,
      outcome,
      request_id: requestId,
    });
  };

  const [{ data: account }, { data: actorMembership }] = await Promise.all([
    service.from("provider_accounts").select("id, status").eq("id", body.providerAccountId).maybeSingle(),
    service.from("provider_memberships").select("id, status, roles, permissions").eq("provider_account_id", body.providerAccountId).eq("principal_id", user.id).maybeSingle(),
  ]);

  if (!account || account.status !== "active" || !actorMembership || actorMembership.status !== "active") {
    await audit(`provider.${body.action}`, "denied", body.targetPrincipalId, "active provider membership required");
    return json({ error: "Provider access denied", requestId }, 403);
  }

  const actorRoles = Array.isArray(actorMembership.roles) ? actorMembership.roles.map(String) : [];
  const actorPermissions = Array.isArray(actorMembership.permissions) ? actorMembership.permissions.map(String) : [];
  const workspaceContext = { accountStatus: account.status, membershipStatus: actorMembership.status, permissions: actorPermissions, hasAal2, hasRecentAal2: recentAal2 };
  const reconcilePatientAccess = async () => service.rpc("reconcile_patient_access_expiration", {
    p_provider_account_id: body.providerAccountId,
    p_actor_principal_id: user.id,
    p_request_id: requestId,
  });

  if (body.action === "list-clinical-imports") {
    const decision = authorizeWorkspaceAccess(workspaceContext, "imports.read");
    if (!decision.allowed) return json({ error: decision.reason, requestId }, 403);
    const { data: packages, error } = await service.from("provider_clinical_packages")
      .select("id, provider_patient_identity_id, source_format, source_label, source_digest, source_batch_digest, status, validation_errors, created_at, validated_at, released_at")
      .eq("provider_account_id", body.providerAccountId).order("created_at", { ascending: false }).limit(500);
    if (error) return json({ error: "Unable to load clinical imports", requestId }, 500);
    const patientIds = [...new Set((packages ?? []).map((item) => item.provider_patient_identity_id))];
    const packageIds = (packages ?? []).map((item) => item.id);
    const [{ data: patients }, { data: resources }] = await Promise.all([
      patientIds.length ? service.from("provider_patient_identities").select("id, organization_patient_number").in("id", patientIds) : Promise.resolve({ data: [] }),
      packageIds.length ? service.from("provider_clinical_resources").select("package_id, resource_type").in("package_id", packageIds) : Promise.resolve({ data: [] }),
    ]);
    const items = (packages ?? []).map((item) => ({ ...item, organizationPatientNumber: (patients ?? []).find((patient) => patient.id === item.provider_patient_identity_id)?.organization_patient_number ?? null, counts: clinicalCounts((resources ?? []).filter((resource) => resource.package_id === item.id).map((resource) => ({ resourceType: resource.resource_type }))) }));
    await audit("provider.clinical_imports.list", "succeeded", undefined, `returned=${items.length}`, "provider_clinical_package");
    return json({ packages: items, requestId });
  }

  if (body.action === "stage-clinical-import") {
    const decision = authorizeWorkspaceAccess(workspaceContext, "imports.manage", { requireRecentAal2: true });
    if (!decision.allowed) return json({ error: decision.reason, requestId }, 403);
    const checksum = body.contentSha256?.trim().toLowerCase() ?? "";
    const displayName = body.sourceDisplayName?.trim().slice(0, 200) ?? "";
    if (!/^[0-9a-f]{64}$/.test(checksum) || !displayName) return json({ error: "sourceDisplayName and a valid SHA-256 checksum are required", requestId }, 400);
    const validation = validateClinicalImport(body.clinicalPackage);
    if (!validation.value) return json({ error: "Clinical package validation failed", validationErrors: validation.errors.slice(0, 100), requestId }, 422);
    const patientNumbers = validation.value.packages.map((item) => item.organizationPatientNumber);
    const { data: patients } = await service.from("provider_patient_identities").select("id, organization_patient_number")
      .eq("provider_account_id", body.providerAccountId).in("organization_patient_number", patientNumbers).eq("status", "active");
    const patientByNumber = new Map((patients ?? []).map((patient) => [patient.organization_patient_number, patient]));
    const missingPatients = patientNumbers.filter((number) => !patientByNumber.has(number));
    if (missingPatients.length) return json({ error: "Some active roster patients were not found", missingPatientNumbers: missingPatients.slice(0, 100), requestId }, 404);
    const { data: existing } = await service.from("provider_clinical_packages").select("id, status, created_at")
      .eq("provider_account_id", body.providerAccountId).eq("source_batch_digest", checksum).limit(1).maybeSingle();
    if (existing) return json({ clinicalPackage: existing, duplicate: true, requestId });
    const packageRows = await Promise.all(validation.value.packages.map(async (item) => ({
      provider_account_id: body.providerAccountId,
      provider_patient_identity_id: patientByNumber.get(item.organizationPatientNumber)!.id,
      source_format: validation.value!.schemaVersion,
      source_label: displayName,
      source_batch_digest: checksum,
      source_digest: await sha256(`${checksum}:${item.organizationPatientNumber}`),
      synthetic: true, status: "quarantined", created_by: user.id,
    })));
    const { data: clinicalPackages, error } = await service.from("provider_clinical_packages").insert(packageRows)
      .select("id, provider_patient_identity_id, status, source_label, created_at");
    if (error || !clinicalPackages?.length) return json({ error: "Unable to create clinical quarantine packages", requestId }, 409);
    const packageByPatient = new Map(clinicalPackages.map((item) => [item.provider_patient_identity_id, item]));
    const resourceRows = validation.value.packages.flatMap((patientPackage) => {
      const patient = patientByNumber.get(patientPackage.organizationPatientNumber)!;
      const clinicalPackage = packageByPatient.get(patient.id)!;
      return patientPackage.resources.map((item) => ({ package_id: clinicalPackage.id, provider_patient_identity_id: patient.id, resource_type: item.resourceType,
        external_resource_id: item.externalResourceId, occurred_at: item.occurredAt, title: item.title, provider_name: item.providerName, payload: item.payload }));
    });
    const { error: resourceError } = await service.from("provider_clinical_resources").insert(resourceRows);
    if (resourceError) { await service.from("provider_clinical_packages").delete().in("id", clinicalPackages.map((item) => item.id)); return json({ error: "Unable to quarantine clinical resources", requestId }, 500); }
    await audit("provider.clinical_imports.stage", "succeeded", clinicalPackages[0].id, `patients=${clinicalPackages.length};resources=${resourceRows.length}`, "provider_clinical_package");
    return json({ clinicalPackages, patientCount: clinicalPackages.length, resourceCount: resourceRows.length, duplicate: false, requestId }, 201);
  }

  if (body.action === "validate-clinical-import") {
    const decision = authorizeWorkspaceAccess(workspaceContext, "imports.manage", { requireRecentAal2: true });
    if (!decision.allowed) return json({ error: decision.reason, requestId }, 403);
    if (!body.clinicalPackageId || !/^[0-9a-f-]{36}$/i.test(body.clinicalPackageId)) return json({ error: "Valid clinicalPackageId is required", requestId }, 400);
    const { data: resources } = await service.from("provider_clinical_resources").select("id", { count: "exact" }).eq("package_id", body.clinicalPackageId).limit(1);
    if (!resources?.length) return json({ error: "Clinical package has no quarantined resources", requestId }, 409);
    const { data: validated, error } = await service.from("provider_clinical_packages").update({ status: "validated", validated_at: new Date().toISOString(), validation_errors: [] })
      .eq("id", body.clinicalPackageId).eq("provider_account_id", body.providerAccountId).eq("status", "quarantined").select("id, status, validated_at").maybeSingle();
    if (error || !validated) return json({ error: "Only an owned quarantined package can be validated", requestId }, 409);
    await audit("provider.clinical_imports.validate", "succeeded", validated.id, undefined, "provider_clinical_package");
    return json({ clinicalPackage: validated, requestId });
  }

  if (body.action === "validate-clinical-import-batch") {
    const decision = authorizeWorkspaceAccess(workspaceContext, "imports.manage", { requireRecentAal2: true });
    if (!decision.allowed) return json({ error: decision.reason, requestId }, 403);
    const batchDigest = body.contentSha256?.trim().toLowerCase() ?? "";
    if (!/^[0-9a-f]{64}$/.test(batchDigest)) return json({ error: "A valid batch SHA-256 checksum is required", requestId }, 400);
    const { data: batchPackages } = await service.from("provider_clinical_packages").select("id")
      .eq("provider_account_id", body.providerAccountId).eq("source_batch_digest", batchDigest).eq("status", "quarantined").limit(250);
    if (!batchPackages?.length) return json({ error: "No owned quarantined packages remain in this batch", requestId }, 409);
    const packageIds = batchPackages.map((item) => item.id);
    const { data: resources } = await service.from("provider_clinical_resources").select("package_id").in("package_id", packageIds);
    const packagesWithResources = new Set((resources ?? []).map((item) => item.package_id));
    if (packageIds.some((id) => !packagesWithResources.has(id))) return json({ error: "Every patient package must contain quarantined resources", requestId }, 409);
    const { data: validated, error } = await service.from("provider_clinical_packages")
      .update({ status: "validated", validated_at: new Date().toISOString(), validation_errors: [] })
      .eq("provider_account_id", body.providerAccountId).eq("source_batch_digest", batchDigest).eq("status", "quarantined").select("id");
    if (error || validated?.length !== packageIds.length) return json({ error: "Unable to validate the complete clinical batch", requestId }, 409);
    await audit("provider.clinical_imports.validate_batch", "succeeded", validated[0].id, `packages=${validated.length}`, "provider_clinical_package");
    return json({ validatedCount: validated.length, requestId });
  }

  if (body.action === "list-provider-audit-events") {
    const decision = authorizeWorkspaceAccess(workspaceContext, "provider_audit.read");
    if (!decision.allowed) return json({ error: decision.reason, requestId }, 403);
    const { data: events, error } = await service.from("admin_audit_events")
      .select("id, occurred_at, actor_principal_id, action, target_type, target_ref, outcome, reason, request_id")
      .eq("provider_account_id", body.providerAccountId).order("occurred_at", { ascending: false }).limit(100);
    if (error) return json({ error: "Unable to load provider security activity", requestId }, 500);
    return json({ events: (events ?? []).map((event) => sanitizeProviderAuditEvent(event)), requestId });
  }

  if (body.action === "list-my-practitioner-patients") {
    const decision = authorizeWorkspaceAccess(workspaceContext, "patients.read_assigned");
    if (!decision.allowed) return json({ error: decision.reason, requestId }, 403);
    const { data: practitioner } = await service.from("practitioner_profiles")
      .select("id, display_name, specialty, credential_status, status").eq("membership_id", actorMembership.id).maybeSingle();
    if (!practitioner || practitioner.status !== "active" || practitioner.credential_status !== "verified") return json({ error: "Active verified practitioner profile required", requestId }, 403);
    const { data: assignments, error: assignmentError } = await service.from("practitioner_patient_assignments")
      .select("provider_patient_identity_id, status, expires_at, relationship_type, effective_at")
      .eq("provider_account_id", body.providerAccountId).eq("practitioner_profile_id", practitioner.id).eq("status", "active");
    if (assignmentError) return json({ error: "Unable to load practitioner assignments", requestId }, 500);
    const assignedIds = (assignments ?? []).map((item) => item.provider_patient_identity_id);
    const [{ data: links }, { data: grants }] = assignedIds.length ? await Promise.all([
      service.from("patient_identity_links").select("provider_patient_identity_id, consumer_principal_id, status").in("provider_patient_identity_id", assignedIds).eq("status", "active"),
      service.from("provider_access_grants").select("provider_patient_identity_id, consumer_principal_id, status, expires_at").in("provider_patient_identity_id", assignedIds).eq("status", "active"),
    ]) : [{ data: [] }, { data: [] }];
    const accessibleIds = resolveAccessiblePractitionerPatientIds({
      assignments: (assignments ?? []).map((item) => ({ patientId: item.provider_patient_identity_id, status: item.status, expiresAt: item.expires_at })),
      identityLinks: (links ?? []).map((item) => ({ patientId: item.provider_patient_identity_id, consumerPrincipalId: item.consumer_principal_id, status: item.status })),
      grants: (grants ?? []).map((item) => ({ patientId: item.provider_patient_identity_id, consumerPrincipalId: item.consumer_principal_id, status: item.status, expiresAt: item.expires_at })),
    });
    const [{ data: patients }, { data: demographics }] = accessibleIds.length ? await Promise.all([
      service.from("provider_patient_identities").select("id, organization_patient_number, status").in("id", accessibleIds).eq("status", "active"),
      service.from("provider_import_rows").select("committed_patient_identity_id, given_name, family_name, birth_date, administrative_sex, city, state").in("committed_patient_identity_id", accessibleIds),
    ]) : [{ data: [] }, { data: [] }];
    const safePatients = (patients ?? []).map((patient) => {
      const demographic = (demographics ?? []).find((row) => row.committed_patient_identity_id === patient.id);
      const assignment = (assignments ?? []).find((item) => item.provider_patient_identity_id === patient.id);
      const grant = (grants ?? []).find((item) => item.provider_patient_identity_id === patient.id && item.status === "active");
      return { id: patient.id, organizationPatientNumber: patient.organization_patient_number, givenName: demographic?.given_name ?? "Roster", familyName: demographic?.family_name ?? "patient", birthDate: demographic?.birth_date ?? null, administrativeSex: demographic?.administrative_sex ?? null, city: demographic?.city ?? null, state: demographic?.state ?? null, relationshipType: assignment?.relationship_type ?? "care_team", accessExpiresAt: grant?.expires_at ?? null };
    });
    await audit("provider.practitioner_patients.list", "succeeded", practitioner.id, `returned=${safePatients.length}`, "practitioner_profile");
    return json({ practitioner, patients: safePatients, assignedCount: assignedIds.length, accessibleCount: safePatients.length, requestId });
  }

  if (body.action === "list-patient-access-invitations") {
    const decision = authorizeWorkspaceAccess(workspaceContext, "patient_panels.manage");
    if (!decision.allowed) return json({ error: decision.reason, requestId }, 403);
    const { error: reconciliationError } = await reconcilePatientAccess();
    if (reconciliationError) return json({ error: "Unable to reconcile patient access lifecycle", requestId }, 500);
    const { data: invitations, error } = await service.from("patient_access_invitations")
      .select("id, provider_patient_identity_id, email, requested_scope, purpose, consent_version, synthetic, status, expires_at, access_expires_at, created_at, responded_at")
      .eq("provider_account_id", body.providerAccountId).order("created_at", { ascending: false }).limit(100);
    if (error) return json({ error: "Unable to load patient access invitations", requestId }, 500);
    const patientIds = [...new Set((invitations ?? []).map((item) => item.provider_patient_identity_id))];
    const { data: demographics } = patientIds.length ? await service.from("provider_import_rows")
      .select("committed_patient_identity_id, given_name, family_name, organization_patient_number")
      .in("committed_patient_identity_id", patientIds) : { data: [] };
    const items = (invitations ?? []).map((item) => ({ ...item, patient: (demographics ?? []).find((row) => row.committed_patient_identity_id === item.provider_patient_identity_id) ?? null }));
    const { data: jobs } = await service.from("provider_import_jobs").select("id").eq("provider_account_id", body.providerAccountId).eq("status", "committed");
    const jobIds = (jobs ?? []).map((job) => job.id);
    const { data: candidateRows } = jobIds.length ? await service.from("provider_import_rows")
      .select("committed_patient_identity_id, given_name, family_name, organization_patient_number, email")
      .in("import_job_id", jobIds).not("committed_patient_identity_id", "is", null).order("family_name").limit(1000) : { data: [] };
    const { data: deliveryJobs } = await service.from("patient_access_delivery_jobs")
      .select("id, recipient_email, invitation_count, status, delivery_mode, attempt_count, last_error, created_at, updated_at, sent_at, cancelled_at")
      .eq("provider_account_id", body.providerAccountId).order("created_at", { ascending: false }).limit(100);
    await audit("provider.patient_access.invitations.list", "succeeded", undefined, undefined, "patient_access_invitation");
    return json({ invitations: items, deliveryJobs: deliveryJobs ?? [], patients: (candidateRows ?? []).map((row) => ({ id: row.committed_patient_identity_id, givenName: row.given_name, familyName: row.family_name, organizationPatientNumber: row.organization_patient_number, email: row.email })), requestId });
  }

  if (body.action === "cancel-patient-access-delivery" || body.action === "retry-patient-access-delivery") {
    const decision = authorizeWorkspaceAccess(workspaceContext, "patient_panels.manage", { requireRecentAal2: true });
    if (!decision.allowed) return json({ error: decision.reason, requestId }, 403);
    if (!body.deliveryJobId || !/^[0-9a-f-]{36}$/i.test(body.deliveryJobId)) return json({ error: "Valid deliveryJobId is required", requestId }, 400);
    const isCancel = body.action === "cancel-patient-access-delivery";
    const allowedStatuses = isCancel ? ["queued"] : ["failed", "cancelled"];
    const update = isCancel
      ? { status: "cancelled", cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      : { status: "queued", cancelled_at: null, last_error: null, updated_at: new Date().toISOString() };
    const { data: job, error } = await service.from("patient_access_delivery_jobs").update(update)
      .eq("id", body.deliveryJobId).eq("provider_account_id", body.providerAccountId).in("status", allowedStatuses)
      .select("id, recipient_email, invitation_count, status, attempt_count, updated_at").maybeSingle();
    if (error || !job) return json({ error: isCancel ? "Only queued delivery jobs can be cancelled" : "Only failed or cancelled delivery jobs can be retried", requestId }, 409);
    await audit(`provider.patient_access.delivery.${isCancel ? "cancel" : "retry"}`, "succeeded", job.id, undefined, "patient_access_delivery_job");
    return json({ deliveryJob: job, requestId });
  }

  if (body.action === "create-patient-access-invitation") {
    const decision = authorizeWorkspaceAccess(workspaceContext, "patient_panels.manage", { requireRecentAal2: true });
    if (!decision.allowed) return json({ error: decision.reason, requestId }, 403);
    const { error: reconciliationError } = await reconcilePatientAccess();
    if (reconciliationError) return json({ error: "Unable to reconcile patient access lifecycle", requestId }, 500);
    let input;
    try { input = buildSyntheticPatientAccessInvitation({ patientIdentityId: body.patientIdentityId, email: body.email }); }
    catch (error) { return json({ error: error instanceof Error ? error.message : "Invalid patient invitation", requestId }, 400); }
    const { data: patient } = await service.from("provider_patient_identities")
      .select("id, provider_account_id, status, source_import_job_id").eq("id", input.patientIdentityId).maybeSingle();
    if (!patient || patient.provider_account_id !== body.providerAccountId || patient.status !== "active" || !patient.source_import_job_id) return json({ error: "Active provider patient not found", requestId }, 404);
    const [{ data: row }, { data: job }] = await Promise.all([
      service.from("provider_import_rows").select("email").eq("committed_patient_identity_id", patient.id).maybeSingle(),
      service.from("provider_import_jobs").select("import_source_id").eq("id", patient.source_import_job_id).maybeSingle(),
    ]);
    const { data: source } = job?.import_source_id ? await service.from("provider_import_sources").select("synthetic").eq("id", job.import_source_id).maybeSingle() : { data: null };
    if (!source?.synthetic) return json({ error: "Patient access invitations are limited to synthetic pilot records", requestId }, 403);
    if (!row?.email || row.email.trim().toLowerCase() !== input.email) return json({ error: "Invitation email must match the approved imported roster email", requestId }, 409);
    const now = Date.now();
    const { error: supersedeError } = await service.from("patient_access_invitations")
      .update({ status: "revoked", responded_at: new Date(now).toISOString(), request_id: requestId })
      .eq("provider_account_id", body.providerAccountId).eq("provider_patient_identity_id", patient.id)
      .eq("status", "pending").neq("consent_version", PATIENT_ACCESS_CONSENT_VERSION);
    if (supersedeError) return json({ error: "An earlier roster-only invitation could not be superseded", requestId }, 409);
    const { data: invitation, error } = await service.from("patient_access_invitations").insert({
      provider_account_id: body.providerAccountId, provider_patient_identity_id: patient.id, email: input.email,
      requested_scope: input.scope, purpose: input.purpose, consent_version: input.consentVersion, synthetic: true,
      expires_at: new Date(now + 7 * 86400000).toISOString(), access_expires_at: new Date(now + 37 * 86400000).toISOString(),
      invited_by: user.id, request_id: requestId,
    }).select("id, email, status, expires_at, access_expires_at, consent_version, requested_scope, purpose, synthetic").single();
    if (error || !invitation) return json({ error: "A pending invitation already exists or could not be created", requestId }, 409);
    const appUrl = Deno.env.get("APP_URL");
    if (!appUrl) return json({ error: "APP_URL is not configured", requestId }, 500);
    const invitationUrl = new URL(`/patient-access/invitations/${invitation.id}`, appUrl).toString();
    await audit("provider.patient_access.invitations.create", "succeeded", invitation.id, "synthetic pilot only", "patient_access_invitation");
    return json({ invitation: { ...invitation, invitationUrl }, requestId }, 201);
  }

  if (body.action === "create-patient-access-invitations") {
    const decision = authorizeWorkspaceAccess(workspaceContext, "patient_panels.manage", { requireRecentAal2: true });
    if (!decision.allowed) return json({ error: decision.reason, requestId }, 403);
    const { error: reconciliationError } = await reconcilePatientAccess();
    if (reconciliationError) return json({ error: "Unable to reconcile patient access lifecycle", requestId }, 500);
    let selection;
    try { selection = normalizePatientInvitationSelection(body); }
    catch (error) { return json({ error: error instanceof Error ? error.message : "Invalid patient selection", requestId }, 400); }

    const { data: sources } = await service.from("provider_import_sources").select("id").eq("provider_account_id", body.providerAccountId).eq("synthetic", true);
    const sourceIds = (sources ?? []).map((source) => source.id);
    const { data: jobs } = sourceIds.length ? await service.from("provider_import_jobs").select("id").eq("provider_account_id", body.providerAccountId).eq("status", "committed").in("import_source_id", sourceIds) : { data: [] };
    const jobIds = (jobs ?? []).map((job) => job.id);
    const candidates: Array<{ committed_patient_identity_id: string; email: string }> = [];
    if (jobIds.length) {
      let offset = 0;
      while (true) {
        let query = service.from("provider_import_rows").select("committed_patient_identity_id, email")
          .in("import_job_id", jobIds).eq("validation_status", "valid").not("committed_patient_identity_id", "is", null).not("email", "is", null);
        if (!selection.inviteAllEligible) query = query.in("committed_patient_identity_id", selection.patientIdentityIds);
        const { data: page, error } = await query.range(offset, offset + 999);
        if (error) return json({ error: "Unable to resolve eligible roster patients", requestId }, 500);
        candidates.push(...((page ?? []) as typeof candidates));
        if (!page || page.length < 1000 || !selection.inviteAllEligible) break;
        offset += 1000;
      }
    }
    const candidateIds = [...new Set(candidates.map((candidate) => candidate.committed_patient_identity_id))];
    const { data: existing } = candidateIds.length ? await service.from("patient_access_invitations").select("id, provider_patient_identity_id, status, access_expires_at, consent_version")
      .eq("provider_account_id", body.providerAccountId).in("status", ["pending", "accepted"]).in("provider_patient_identity_id", candidateIds) : { data: [] };
    const now = Date.now();
    const supersededIds = (existing ?? []).filter((item) => item.status === "pending" && item.consent_version !== PATIENT_ACCESS_CONSENT_VERSION).map((item) => item.id);
    if (supersededIds.length) {
      const { error: supersedeError } = await service.from("patient_access_invitations")
        .update({ status: "revoked", responded_at: new Date(now).toISOString(), request_id: requestId }).in("id", supersededIds);
      if (supersedeError) return json({ error: "Earlier roster-only invitations could not be superseded", requestId }, 409);
      const { error: cancelDeliveryError } = await service.from("patient_access_delivery_jobs")
        .update({ status: "cancelled", cancelled_at: new Date(now).toISOString(), updated_at: new Date(now).toISOString() })
        .eq("provider_account_id", body.providerAccountId).eq("status", "queued").overlaps("invitation_ids", supersededIds);
      if (cancelDeliveryError) return json({ error: "Earlier invitation delivery could not be cancelled", requestId }, 409);
    }
    const blockedIds = new Set((existing ?? []).filter((item) =>
      (item.status === "pending" && item.consent_version === PATIENT_ACCESS_CONSENT_VERSION)
      || (item.status === "accepted" && new Date(item.access_expires_at).getTime() > now)
    ).map((item) => item.provider_patient_identity_id));
    const rows = candidates.filter((candidate, index) => candidate.email && !blockedIds.has(candidate.committed_patient_identity_id) && candidates.findIndex((item) => item.committed_patient_identity_id === candidate.committed_patient_identity_id) === index).map((candidate) => ({
      provider_account_id: body.providerAccountId, provider_patient_identity_id: candidate.committed_patient_identity_id, email: candidate.email.trim().toLowerCase(),
      requested_scope: [...PATIENT_ACCESS_SCOPE], purpose: "care_coordination", consent_version: PATIENT_ACCESS_CONSENT_VERSION, synthetic: true,
      expires_at: new Date(now + 7 * 86400000).toISOString(), access_expires_at: new Date(now + 37 * 86400000).toISOString(), invited_by: user.id, request_id: requestId,
    }));
    let created = 0;
    const createdInvitations: Array<{ id: string; email: string }> = [];
    for (let start = 0; start < rows.length; start += 500) {
      const { data, error } = await service.from("patient_access_invitations").insert(rows.slice(start, start + 500)).select("id, email");
      if (error) { await audit("provider.patient_access.invitations.bulk_create", "failed", undefined, error.message, "patient_access_invitation"); return json({ error: "Bulk invitation creation did not complete", created, requestId }, 409); }
      created += data?.length ?? 0;
      createdInvitations.push(...((data ?? []) as Array<{ id: string; email: string }>));
    }
    const deliveryPlans = buildDigestDeliveryJobs(createdInvitations);
    if (deliveryPlans.length) {
      const { error: deliveryError } = await service.from("patient_access_delivery_jobs").insert(deliveryPlans.map((plan) => ({
        provider_account_id: body.providerAccountId, recipient_email: plan.recipientEmail, invitation_ids: plan.invitationIds,
        invitation_count: plan.invitationCount, status: "queued", delivery_mode: "digest", created_by: user.id, request_id: requestId,
      })));
      if (deliveryError) { await audit("provider.patient_access.delivery.queue", "failed", undefined, deliveryError.message, "patient_access_delivery_job"); return json({ error: "Invitations were created but delivery queueing failed", created, requestId }, 500); }
    }
    await audit("provider.patient_access.invitations.bulk_create", "succeeded", undefined, `created=${created}; skipped=${candidates.length - created}`, "patient_access_invitation");
    return json({ created, skipped: candidates.length - created, eligible: candidates.length, delivery: "queued_digest", deliveryJobs: deliveryPlans.length, requestId }, 201);
  }

  if (body.action === "list-panel-management") {
    const decision = authorizeWorkspaceAccess(workspaceContext, "patient_panels.manage");
    if (!decision.allowed) {
      await audit("provider.patient_panels.list", "denied", undefined, decision.reason, "practitioner_patient_assignment");
      return json({ error: decision.reason, requestId }, 403);
    }
    const [{ data: practitioners, error: practitionerError }, { data: patients, error: patientError }, { data: assignments, error: assignmentError }] = await Promise.all([
      service.from("practitioner_profiles")
        .select("id, display_name, specialty, credential_status, status")
        .eq("provider_account_id", body.providerAccountId).order("display_name"),
      service.from("provider_patient_identities")
        .select("id, external_patient_id, organization_patient_number, status")
        .eq("provider_account_id", body.providerAccountId).neq("status", "merged").order("organization_patient_number").limit(500),
      service.from("practitioner_patient_assignments")
        .select("id, practitioner_profile_id, provider_patient_identity_id, relationship_type, status, effective_at, created_at")
        .eq("provider_account_id", body.providerAccountId).eq("status", "active").order("created_at", { ascending: false }),
    ]);
    if (practitionerError || patientError || assignmentError) {
      await audit("provider.patient_panels.list", "failed", undefined, "panel management query failed", "practitioner_patient_assignment");
      return json({ error: "Unable to load practitioner panels", requestId }, 500);
    }
    const patientIds = (patients ?? []).map((patient) => patient.id);
    const [{ data: demographics }, { data: grants }] = patientIds.length ? await Promise.all([
      service.from("provider_import_rows")
        .select("committed_patient_identity_id, given_name, family_name, birth_date")
        .in("committed_patient_identity_id", patientIds).eq("validation_status", "valid"),
      service.from("provider_access_grants")
        .select("provider_patient_identity_id, status, effective_at, expires_at")
        .in("provider_patient_identity_id", patientIds).eq("status", "active"),
    ]) : [{ data: [] }, { data: [] }];
    const demographicByPatient = new Map((demographics ?? []).map((row) => [row.committed_patient_identity_id, row]));
    const now = Date.now();
    const grantedPatients = new Set((grants ?? []).filter((grant) =>
      (!grant.effective_at || new Date(grant.effective_at).getTime() <= now) &&
      (!grant.expires_at || new Date(grant.expires_at).getTime() > now)
    ).map((grant) => grant.provider_patient_identity_id));
    const safePatients = (patients ?? []).map((patient) => {
      const demographic = demographicByPatient.get(patient.id);
      return {
        id: patient.id,
        organizationPatientNumber: patient.organization_patient_number,
        externalPatientId: patient.external_patient_id,
        status: patient.status,
        givenName: demographic?.given_name ?? "",
        familyName: demographic?.family_name ?? "",
        birthDate: demographic?.birth_date ?? null,
        hasActiveAccessGrant: grantedPatients.has(patient.id),
      };
    });
    await audit("provider.patient_panels.list", "succeeded", undefined, undefined, "practitioner_patient_assignment");
    return json({ practitioners: practitioners ?? [], patients: safePatients, assignments: assignments ?? [], requestId });
  }

  if (body.action === "assign-practitioner-patient") {
    const decision = authorizeWorkspaceAccess(workspaceContext, "patient_panels.manage", { requireRecentAal2: true });
    if (!decision.allowed) {
      await audit("provider.patient_panels.assign", "denied", body.practitionerProfileId, decision.reason, "practitioner_patient_assignment");
      return json({ error: decision.reason, requestId }, 403);
    }
    let input;
    try {
      input = validatePanelAssignmentInput(body);
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Invalid panel assignment", requestId }, 400);
    }
    const [{ data: practitioner }, { data: patient }] = await Promise.all([
      service.from("practitioner_profiles").select("id, provider_account_id, credential_status, status")
        .eq("id", input.practitionerProfileId).maybeSingle(),
      service.from("provider_patient_identities").select("id, provider_account_id, status")
        .eq("id", input.patientIdentityId).maybeSingle(),
    ]);
    const policy = canAssignToPanel({
      sameProvider: practitioner?.provider_account_id === body.providerAccountId && patient?.provider_account_id === body.providerAccountId,
      profileStatus: practitioner?.status ?? "missing",
      credentialStatus: practitioner?.credential_status ?? "missing",
      patientStatus: patient?.status ?? "missing",
    });
    if (!policy.allowed) {
      await audit("provider.patient_panels.assign", "denied", input.practitionerProfileId, policy.reason, "practitioner_patient_assignment");
      return json({ error: policy.reason, requestId }, 403);
    }
    const { data: existing } = await service.from("practitioner_patient_assignments").select("id")
      .eq("provider_account_id", body.providerAccountId).eq("practitioner_profile_id", input.practitionerProfileId)
      .eq("provider_patient_identity_id", input.patientIdentityId).eq("status", "active").maybeSingle();
    if (existing) return json({ error: "This patient is already active on the practitioner panel", requestId }, 409);
    const { data: assignment, error } = await service.from("practitioner_patient_assignments").insert({
      provider_account_id: body.providerAccountId,
      practitioner_profile_id: input.practitionerProfileId,
      provider_patient_identity_id: input.patientIdentityId,
      relationship_type: input.relationshipType,
      assignment_source: "provider_admin_manual",
      created_by: user.id,
      approved_by: user.id,
    }).select("id, practitioner_profile_id, provider_patient_identity_id, relationship_type, status, effective_at, created_at").single();
    if (error || !assignment) {
      await audit("provider.patient_panels.assign", "failed", input.practitionerProfileId, "assignment insert failed", "practitioner_patient_assignment");
      return json({ error: "Unable to assign patient", requestId }, 409);
    }
    await audit("provider.patient_panels.assign", "succeeded", assignment.id, undefined, "practitioner_patient_assignment");
    return json({ assignment, requestId }, 201);
  }

  if (body.action === "bulk-assign-practitioner-patients") {
    const decision = authorizeWorkspaceAccess(workspaceContext, "patient_panels.manage", { requireRecentAal2: true });
    if (!decision.allowed) {
      await audit("provider.patient_panels.bulk_assign", "denied", undefined, decision.reason, "practitioner_patient_assignment");
      return json({ error: decision.reason, requestId }, 403);
    }
    let rows;
    try { rows = validateBulkPanelAssignments(body.assignments); }
    catch (error) { return json({ error: error instanceof Error ? error.message : "Invalid panel assignment batch", requestId }, 400); }
    const [{ data: practitioners, error: practitionerError }, { data: patients, error: patientError }, { data: existing, error: existingError }, { data: memberships, error: membershipError }, { data: acceptedInvitations, error: invitationError }] = await Promise.all([
      service.from("practitioner_profiles").select("id, membership_id, provider_account_id, credential_status, status").eq("provider_account_id", body.providerAccountId).limit(5000),
      service.from("provider_patient_identities").select("id, organization_patient_number, provider_account_id, status").eq("provider_account_id", body.providerAccountId).limit(10000),
      service.from("practitioner_patient_assignments").select("practitioner_profile_id, provider_patient_identity_id").eq("provider_account_id", body.providerAccountId).eq("status", "active").limit(10000),
      service.from("provider_memberships").select("id, principal_id").eq("provider_account_id", body.providerAccountId).contains("roles", ["practitioner"]).limit(5000),
      service.from("provider_membership_invitations").select("email, accepted_by").eq("provider_account_id", body.providerAccountId).eq("status", "accepted").contains("roles", ["practitioner"]).limit(5000),
    ]);
    if (practitionerError || patientError || existingError || membershipError || invitationError) return json({ error: "Unable to resolve panel assignment batch", requestId }, 500);
    const principalByMembership = new Map((memberships ?? []).map((item) => [item.id, item.principal_id]));
    const emailByPrincipal = new Map((acceptedInvitations ?? []).map((item) => [item.accepted_by, String(item.email).toLowerCase()]));
    const practitionerByEmail = new Map((practitioners ?? []).map((item) => [emailByPrincipal.get(principalByMembership.get(item.membership_id)) ?? "", item]));
    const patientByNumber = new Map((patients ?? []).map((item) => [item.organization_patient_number, item]));
    const existingKeys = new Set((existing ?? []).map((item) => `${item.practitioner_profile_id}:${item.provider_patient_identity_id}`));
    const inserts = [];
    for (const [index, row] of rows.entries()) {
      const practitioner = practitionerByEmail.get(row.practitionerEmail);
      const patient = patientByNumber.get(row.patientNumber);
      const policy = canAssignToPanel({
        sameProvider: practitioner?.provider_account_id === body.providerAccountId && patient?.provider_account_id === body.providerAccountId,
        profileStatus: practitioner?.status ?? "missing", credentialStatus: practitioner?.credential_status ?? "missing", patientStatus: patient?.status ?? "missing",
      });
      if (!policy.allowed) return json({ error: `row ${index + 1}: ${policy.reason}`, requestId }, 422);
      const key = `${practitioner!.id}:${patient!.id}`;
      if (existingKeys.has(key)) continue;
      existingKeys.add(key);
      inserts.push({ provider_account_id: body.providerAccountId, practitioner_profile_id: practitioner!.id, provider_patient_identity_id: patient!.id, relationship_type: row.relationshipType, assignment_source: "provider_admin_csv", created_by: user.id, approved_by: user.id });
    }
    if (inserts.length) {
      const { error } = await service.from("practitioner_patient_assignments").insert(inserts);
      if (error) { await audit("provider.patient_panels.bulk_assign", "failed", undefined, "assignment insert failed", "practitioner_patient_assignment"); return json({ error: "Unable to create panel assignments", requestId }, 409); }
    }
    await audit("provider.patient_panels.bulk_assign", "succeeded", undefined, `created=${inserts.length}; skipped=${rows.length - inserts.length}`, "practitioner_patient_assignment");
    return json({ createdCount: inserts.length, skippedCount: rows.length - inserts.length, requestId }, 201);
  }

  if (body.action === "revoke-practitioner-assignment") {
    const decision = authorizeWorkspaceAccess(workspaceContext, "patient_panels.manage", { requireRecentAal2: true });
    if (!decision.allowed || !body.assignmentId || !/^[0-9a-f-]{36}$/i.test(body.assignmentId)) {
      const reason = !decision.allowed ? decision.reason : "A valid assignmentId is required";
      await audit("provider.patient_panels.revoke", "denied", body.assignmentId, reason, "practitioner_patient_assignment");
      return json({ error: reason, requestId }, !decision.allowed ? 403 : 400);
    }
    const { data: assignment, error } = await service.from("practitioner_patient_assignments")
      .update({ status: "revoked", ended_at: new Date().toISOString() })
      .eq("id", body.assignmentId).eq("provider_account_id", body.providerAccountId).eq("status", "active")
      .select("id, status, ended_at").maybeSingle();
    if (error || !assignment) return json({ error: "Active assignment not found", requestId }, 404);
    await audit("provider.patient_panels.revoke", "succeeded", assignment.id, undefined, "practitioner_patient_assignment");
    return json({ assignment, requestId });
  }

  if (body.action === "list-roster") {
    const decision = authorizeWorkspaceAccess(workspaceContext, "imports.read");
    if (!decision.allowed) {
      await audit("provider.roster.list", "denied", undefined, decision.reason);
      return json({ error: decision.reason, requestId }, 403);
    }
    const { data: jobs, error: jobError } = await service.from("provider_import_jobs")
      .select("id").eq("provider_account_id", body.providerAccountId).eq("status", "committed");
    if (jobError) return json({ error: "Unable to load provider roster", requestId }, 500);
    const jobIds = (jobs ?? []).map((job) => job.id);
    if (!jobIds.length) return json({ roster: [], total: 0, requestId });
    const { data: rows, error: rosterError, count } = await service.from("provider_import_rows")
      .select("id, external_patient_id, organization_patient_number, given_name, family_name, birth_date, administrative_sex, city, state", { count: "exact" })
      .in("import_job_id", jobIds).eq("validation_status", "valid").order("family_name").limit(250);
    if (rosterError) {
      await audit("provider.roster.list", "failed", undefined, "roster query failed");
      return json({ error: "Unable to load provider roster", requestId }, 500);
    }
    await audit("provider.roster.list", "succeeded");
    return json({ roster: rows ?? [], total: count ?? 0, requestId });
  }

  if (body.action === "list-imports") {
    const decision = authorizeWorkspaceAccess(workspaceContext, "imports.read");
    if (!decision.allowed) {
      await audit("provider.imports.list", "denied", undefined, decision.reason);
      return json({ error: decision.reason, requestId }, 403);
    }
    const { data, error } = await service.from("provider_import_jobs")
      .select("id, schema_version, status, row_count, valid_row_count, invalid_row_count, created_at, committed_at, rolled_back_at, provider_import_sources(display_name, source_system, synthetic), provider_import_reconciliations(inserted_count, updated_count, unchanged_count, exception_count)")
      .eq("provider_account_id", body.providerAccountId).order("created_at", { ascending: false }).limit(25);
    if (error) {
      await audit("provider.imports.list", "failed", undefined, "import history query failed");
      return json({ error: "Unable to load import history", requestId }, 500);
    }
    await audit("provider.imports.list", "succeeded");
    return json({ imports: data ?? [], requestId });
  }

  if (body.action === "stage-roster-import") {
    const decision = authorizeWorkspaceAccess(workspaceContext, "imports.manage", { requireRecentAal2: true });
    if (!decision.allowed) {
      await audit("provider.imports.stage", "denied", undefined, decision.reason);
      return json({ error: decision.reason, requestId }, 403);
    }
    const checksum = body.contentSha256?.trim().toLowerCase() ?? "";
    const displayName = body.sourceDisplayName?.trim().slice(0, 200) ?? "";
    if (!/^[0-9a-f]{64}$/.test(checksum) || !displayName) {
      return json({ error: "sourceDisplayName and a valid SHA-256 checksum are required", requestId }, 400);
    }
    const validation = validateRosterImportPayload(body.rows);
    if (validation.errors.length) {
      await audit("provider.imports.stage", "denied", undefined, "server roster validation failed");
      return json({ error: "Roster validation failed", validationErrors: validation.errors.slice(0, 100), requestId }, 422);
    }
    const sourceSystem = "manual_roster_csv_v1";
    const { data: source, error: sourceError } = await service.from("provider_import_sources").upsert({
      provider_account_id: body.providerAccountId, source_system: sourceSystem,
      display_name: displayName, import_type: "roster_csv_v1", synthetic: body.synthetic === true,
    }, { onConflict: "provider_account_id,source_system" }).select("id").single();
    if (sourceError || !source) return json({ error: "Unable to prepare import source", requestId }, 500);

    const { data: existing } = await service.from("provider_import_jobs")
      .select("id, status, row_count, valid_row_count, invalid_row_count, created_at")
      .eq("provider_account_id", body.providerAccountId).eq("import_source_id", source.id).eq("content_sha256", checksum).maybeSingle();
    if (existing) return json({ importJob: existing, duplicate: true, requestId });

    const { data: job, error: jobError } = await service.from("provider_import_jobs").insert({
      provider_account_id: body.providerAccountId, import_source_id: source.id,
      schema_version: "health_vault_roster_csv_v1", content_sha256: checksum, status: "validated",
      row_count: validation.rows.length, valid_row_count: validation.rows.length, invalid_row_count: 0, created_by: user.id,
    }).select("id, status, row_count, valid_row_count, invalid_row_count, created_at").single();
    if (jobError || !job) return json({ error: "Unable to create import job", requestId }, 409);
    const stagedRows = validation.rows.map((row) => ({ ...row, import_job_id: job.id, validation_status: "valid" }));
    const { error: rowError } = await service.from("provider_import_rows").insert(stagedRows);
    if (rowError) {
      await service.from("provider_import_jobs").delete().eq("id", job.id);
      await audit("provider.imports.stage", "failed", job.id, "validated row staging failed");
      return json({ error: "Unable to stage validated roster rows", requestId }, 500);
    }
    await audit("provider.imports.stage", "succeeded", job.id);
    return json({ importJob: job, duplicate: false, requestId }, 201);
  }

  if (body.action === "commit-roster-import" || body.action === "rollback-roster-import") {
    const decision = authorizeWorkspaceAccess(workspaceContext, "imports.manage", { requireRecentAal2: true });
    if (!decision.allowed || !body.importJobId) {
      const reason = !body.importJobId ? "importJobId is required" : decision.reason;
      await audit(`provider.imports.${body.action.startsWith("commit") ? "commit" : "rollback"}`, "denied", body.importJobId, reason);
      return json({ error: reason, requestId }, body.importJobId ? 403 : 400);
    }
    const { data: ownedJob } = await service.from("provider_import_jobs").select("id")
      .eq("id", body.importJobId).eq("provider_account_id", body.providerAccountId).maybeSingle();
    if (!ownedJob) return json({ error: "Import job not found", requestId }, 404);
    const committing = body.action === "commit-roster-import";
    const rpcName = committing ? "commit_provider_roster_import" : "rollback_provider_roster_import";
    const { data, error } = await userClient.rpc(rpcName, { requested_import_job_id: body.importJobId });
    if (error) {
      await audit(`provider.imports.${committing ? "commit" : "rollback"}`, "failed", body.importJobId, error.message.slice(0, 300));
      return json({ error: committing ? "Unable to commit import" : "Unable to roll back import", requestId }, 409);
    }
    await audit(`provider.imports.${committing ? "commit" : "rollback"}`, "succeeded", body.importJobId);
    return json({ result: data, requestId });
  }
  const deliverInvitation = async (invitation: { id: string; email: string; delivery_attempts?: number }) => {
    const attemptedAt = new Date().toISOString();
    const attempts = Number(invitation.delivery_attempts ?? 0) + 1;
    try {
      const appUrl = Deno.env.get("APP_URL");
      if (!appUrl) throw new Error("APP_URL is not configured");
      const plan = createInvitationDeliveryPlan({ email: invitation.email, invitationId: invitation.id, appUrl });
      const deliveryClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
      const { error } = await deliveryClient.auth.signInWithOtp({
        email: plan.email,
        options: {
          emailRedirectTo: plan.emailRedirectTo,
          shouldCreateUser: plan.shouldCreateUser,
          data: { provider_invitation_id: invitation.id, account_kind: "provider" },
        },
      });
      if (error) throw error;
      await service.from("provider_membership_invitations").update({
        delivery_status: "sent", delivery_attempts: attempts,
        last_delivery_at: attemptedAt, last_delivery_error: null,
      }).eq("id", invitation.id);
      return { status: "sent" as const };
    } catch (error) {
      await service.from("provider_membership_invitations").update({
        delivery_status: "failed", delivery_attempts: attempts,
        last_delivery_at: attemptedAt,
        last_delivery_error: error instanceof Error ? error.message.slice(0, 500) : "delivery failed",
      }).eq("id", invitation.id);
      return { status: "failed" as const };
    }
  };

  if (body.action === "list-members") {
    if (!actorPermissions.includes("members.read")) {
      await audit("provider.members.list", "denied", undefined, "members.read required");
      return json({ error: "Membership read access denied", requestId }, 403);
    }
    const [{ data, error }, { data: invitations }] = await Promise.all([
      service.from("provider_memberships")
        .select("id, principal_id, status, roles, invited_at, activated_at, suspended_at")
        .eq("provider_account_id", body.providerAccountId).neq("status", "removed").order("invited_at"),
      service.from("provider_membership_invitations")
        .select("id, email, roles, status, invited_at, expires_at, delivery_status, delivery_attempts, last_delivery_at, practitioner_display_name, practitioner_specialty, professional_identifier_type, professional_identifier_value, source_import_name, source_import_batch_id")
        .eq("provider_account_id", body.providerAccountId).eq("status", "pending").order("invited_at", { ascending: false }),
    ]);
    if (error) {
      await audit("provider.members.list", "failed", undefined, "membership query failed");
      return json({ error: "Unable to list memberships", requestId }, 500);
    }
    const memberships = await Promise.all((data ?? []).map(async (membership) => {
      const { data: authUser } = await service.auth.admin.getUserById(membership.principal_id);
      return { ...membership, email: authUser.user?.email ?? null };
    }));
    await audit("provider.members.list", "succeeded");
    return json({ memberships, invitations: invitations ?? [], requestId });
  }

  if (body.action === "set-member-roles") {
    if (!body.targetPrincipalId || !Array.isArray(body.roles)) return json({ error: "targetPrincipalId and roles are required", requestId }, 400);
    const decision = authorizeMemberRoleChange({ actorId: user.id, targetId: body.targetPrincipalId, actorRoles, requestedRoles: body.roles });
    if (!recentAal2 || !decision.allowed || !body.roles.every(isProviderRole)) {
      const reason = !recentAal2 ? "recent AAL2 authentication required" : decision.reason ?? "invalid roles";
      await audit("provider.members.roles.update", "denied", body.targetPrincipalId, reason);
      return json({ error: reason, requestId }, 403);
    }
    const roles = body.roles;
    const permissions = permissionsForRoles(roles);
    const { data, error } = await service.from("provider_memberships")
      .update({ roles, permissions }).eq("provider_account_id", body.providerAccountId)
      .eq("principal_id", body.targetPrincipalId).neq("status", "removed")
      .select("id, principal_id, status, roles").maybeSingle();
    if (error || !data) {
      await audit("provider.members.roles.update", "failed", body.targetPrincipalId, "target membership not found or update failed");
      return json({ error: "Unable to update membership", requestId }, 404);
    }
    await audit("provider.members.roles.update", "succeeded", body.targetPrincipalId);
    return json({ membership: data, requestId });
  }

  if (body.action === "create-invitation") {
    const email = body.email?.trim().toLowerCase();
    if (!email || !/^\S+@\S+\.\S+$/.test(email) || !Array.isArray(body.roles)) {
      return json({ error: "a valid email and roles are required", requestId }, 400);
    }
    const decision = authorizeMemberRoleChange({ actorId: user.id, targetId: `invite:${email}`, actorRoles, requestedRoles: body.roles });
    if (!recentAal2 || !decision.allowed || !body.roles.every(isProviderRole)) {
      const reason = !recentAal2 ? "recent AAL2 authentication required" : decision.reason ?? "invalid roles";
      await audit("provider.members.invite", "denied", email, reason);
      return json({ error: reason, requestId }, 403);
    }
    const roles = body.roles;
    const { data, error } = await service.from("provider_membership_invitations").insert({
      provider_account_id: body.providerAccountId,
      email,
      roles,
      permissions: permissionsForRoles(roles),
      invited_by: user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }).select("id, email, roles, status, invited_at, expires_at, delivery_attempts").single();
    if (error) {
      await audit("provider.members.invite", "failed", email, "invitation could not be recorded");
      return json({ error: "Unable to create invitation", requestId }, 409);
    }
    const delivery = await deliverInvitation(data);
    if (delivery.status === "failed") {
      await audit("provider.members.invitation.deliver", "failed", data.id, "passwordless invitation email failed");
    } else {
      await audit("provider.members.invitation.deliver", "succeeded", data.id);
    }
    await audit("provider.members.invite", "succeeded", data.id);
    return json({ invitation: data, deliveryStatus: delivery.status, requestId }, 201);
  }

  if (body.action === "bulk-create-practitioner-invitations") {
    let practitioners;
    try { practitioners = validatePractitionerImport(body.practitioners); }
    catch (error) { return json({ error: error instanceof Error ? error.message : "Invalid practitioner import", requestId }, 400); }
    const decision = authorizeMemberRoleChange({ actorId: user.id, targetId: "bulk-practitioner-import", actorRoles, requestedRoles: ["practitioner"] });
    if (!recentAal2 || !decision.allowed) {
      const reason = !recentAal2 ? "recent AAL2 authentication required" : decision.reason ?? "practitioner invitations are not allowed";
      await audit("provider.practitioners.import", "denied", undefined, reason, "provider_membership_invitation");
      return json({ error: reason, requestId }, 403);
    }
    const { data: pending, error: pendingError } = await service.from("provider_membership_invitations")
      .select("email").eq("provider_account_id", body.providerAccountId).eq("status", "pending");
    if (pendingError) return json({ error: "Unable to reconcile existing invitations", requestId }, 500);
    const existingEmails = new Set((pending ?? []).map((item) => String(item.email).toLowerCase()));
    const importable = practitioners.filter((item) => !existingEmails.has(item.email));
    const importBatchId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const rows = importable.map((item) => ({
      provider_account_id: body.providerAccountId, email: item.email,
      roles: ["practitioner"], permissions: permissionsForRoles(["practitioner"]),
      invited_by: user.id, expires_at: expiresAt, delivery_status: "pending",
      practitioner_display_name: item.display_name, practitioner_specialty: item.specialty || null,
      professional_identifier_type: item.professional_identifier_type || null,
      professional_identifier_value: item.professional_identifier_value || null,
      source_import_name: String(body.sourceDisplayName ?? "practitioner-csv").slice(0, 250),
      source_import_batch_id: importBatchId,
    }));
    const { data, error } = rows.length ? await service.from("provider_membership_invitations").insert(rows).select("id, email") : { data: [], error: null };
    if (error) {
      await audit("provider.practitioners.import", "failed", undefined, "bulk invitation insert failed", "provider_membership_invitation");
      return json({ error: "Unable to import practitioner invitations", requestId }, 409);
    }
    await audit("provider.practitioners.import", "succeeded", undefined, `created=${data?.length ?? 0}; skipped=${practitioners.length - importable.length}`, "provider_membership_invitation");
    return json({ createdCount: data?.length ?? 0, skippedCount: practitioners.length - importable.length, importBatchId, deliveryStatus: "pending", requestId }, 201);
  }

  if (body.action === "cancel-practitioner-invitations") {
    let selection;
    try { selection = validatePractitionerInvitationCancellation({ invitationIds: body.invitationIds, sourceImportBatchId: body.sourceImportBatchId }); }
    catch (error) { return json({ error: error instanceof Error ? error.message : "Invalid invitation selection", requestId }, 400); }
    if (!actorPermissions.includes("members.manage") || !recentAal2) {
      const reason = !recentAal2 ? "recent AAL2 authentication required" : "members.manage permission required";
      await audit("provider.practitioners.invitation.cancel", "denied", undefined, reason, "provider_membership_invitation");
      return json({ error: reason, requestId }, 403);
    }
    let update = service.from("provider_membership_invitations").update({ status: "revoked" })
      .eq("provider_account_id", body.providerAccountId).eq("status", "pending");
    update = selection.sourceImportBatchId ? update.eq("source_import_batch_id", selection.sourceImportBatchId) : update.in("id", selection.invitationIds ?? []);
    const { data, error } = await update.select("id");
    if (error) {
      await audit("provider.practitioners.invitation.cancel", "failed", undefined, "pending invitation update failed", "provider_membership_invitation");
      return json({ error: "Unable to cancel practitioner invitations", requestId }, 409);
    }
    await audit("provider.practitioners.invitation.cancel", "succeeded", selection.sourceImportBatchId ?? data?.[0]?.id, `cancelled=${data?.length ?? 0}`, "provider_membership_invitation");
    return json({ cancelledCount: data?.length ?? 0, requestId });
  }

  if (body.action === "resend-invitation") {
    if (!body.invitationId || !actorPermissions.includes("members.manage") || !recentAal2) {
      const reason = !recentAal2 ? "recent AAL2 authentication required" : "members.manage and invitationId are required";
      await audit("provider.members.invitation.resend", "denied", body.invitationId, reason);
      return json({ error: reason, requestId }, 403);
    }
    const { data: invitation } = await service.from("provider_membership_invitations")
      .select("id, email, status, expires_at, delivery_attempts, last_delivery_at")
      .eq("id", body.invitationId).eq("provider_account_id", body.providerAccountId).maybeSingle();
    if (!invitation || invitation.status !== "pending" || new Date(invitation.expires_at) <= new Date()) {
      await audit("provider.members.invitation.resend", "denied", body.invitationId, "pending unexpired invitation required");
      return json({ error: "Invitation unavailable", requestId }, 409);
    }
    if (invitation.last_delivery_at && Date.now() - new Date(invitation.last_delivery_at).getTime() < 60_000) {
      await audit("provider.members.invitation.resend", "denied", invitation.id, "delivery retry rate limit");
      return json({ error: "Wait before resending this invitation", requestId }, 429);
    }
    const delivery = await deliverInvitation(invitation);
    await audit("provider.members.invitation.resend", delivery.status === "sent" ? "succeeded" : "failed", invitation.id);
    return json({ invitationId: invitation.id, deliveryStatus: delivery.status, requestId }, delivery.status === "sent" ? 200 : 502);
  }

  if (body.action === "set-member-status") {
    if (!body.targetPrincipalId || !body.status) return json({ error: "targetPrincipalId and status are required", requestId }, 400);
    const [{ data: target }, { count: activeOwnerCount }] = await Promise.all([
      service.from("provider_memberships").select("id, status, roles").eq("provider_account_id", body.providerAccountId).eq("principal_id", body.targetPrincipalId).maybeSingle(),
      service.from("provider_memberships").select("id", { count: "exact", head: true }).eq("provider_account_id", body.providerAccountId).eq("status", "active").contains("roles", ["organization_owner"]),
    ]);
    if (!target) return json({ error: "Membership not found", requestId }, 404);
    const decision = authorizeMembershipStatusChange({
      actorId: user.id, targetId: body.targetPrincipalId, actorRoles,
      targetRoles: Array.isArray(target.roles) ? target.roles.map(String) : [],
      requestedStatus: body.status, activeOwnerCount: activeOwnerCount ?? 0,
      hasRecentAal2: recentAal2,
    });
    if (!decision.allowed) {
      await audit("provider.members.status.update", "denied", body.targetPrincipalId, decision.reason);
      return json({ error: decision.reason, requestId }, 403);
    }
    const timestamp = new Date().toISOString();
    const statusTimes = body.status === "active" ? { activated_at: timestamp, suspended_at: null, removed_at: null }
      : body.status === "suspended" ? { suspended_at: timestamp }
      : { removed_at: timestamp };
    const { data, error } = await service.from("provider_memberships").update({ status: body.status, ...statusTimes })
      .eq("id", target.id).select("id, principal_id, status, roles").single();
    if (error) {
      await audit("provider.members.status.update", "failed", body.targetPrincipalId, "membership status update failed");
      return json({ error: "Unable to update membership status", requestId }, 500);
    }
    await audit("provider.members.status.update", "succeeded", body.targetPrincipalId);
    return json({ membership: data, requestId });
  }

  await audit(`provider.${body.action}`, "denied", body.targetPrincipalId, "unsupported action");
  return json({ error: "Unsupported action", requestId }, 400);
});
