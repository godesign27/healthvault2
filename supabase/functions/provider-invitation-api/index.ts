import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { authorizeInvitationAcceptance, authorizeInvitationPreview } from "./invitation-authorization.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-request-id",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function aalFromToken(authHeader: string): string | null {
  try {
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const encodedPayload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(encodedPayload.padEnd(Math.ceil(encodedPayload.length / 4) * 4, "=")));
    return typeof payload.aal === "string" ? payload.aal : null;
  } catch {
    return null;
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
  const body = await req.json().catch(() => null) as null | { action?: "preview" | "accept"; invitationId?: string };
  if (!body?.invitationId || !body.action) return json({ error: "action and invitationId are required", requestId }, 400);

  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const service = createClient(supabaseUrl, serviceKey);
  const [{ data: { user }, error: authError }, { data: factorsData }] = await Promise.all([
    userClient.auth.getUser(),
    userClient.auth.mfa.listFactors(),
  ]);
  if (authError || !user) return json({ error: "Unauthorized", requestId }, 401);

  const { data: invitation } = await service.from("provider_membership_invitations")
    .select("id, provider_account_id, email, roles, status, expires_at, accepted_by")
    .eq("id", body.invitationId).maybeSingle();
  if (!invitation) return json({ error: "Invitation unavailable", code: "invitation_unavailable", requestId }, 404);

  if (body.action === "preview") {
    if (invitation.status === "accepted" && invitation.accepted_by === user.id) {
      return json({ accepted: true, requestId });
    }
    const previewDecision = authorizeInvitationPreview({
      invitation: { status: invitation.status, email: invitation.email, expiresAt: invitation.expires_at, roles: invitation.roles ?? [] },
      userEmail: user.email ?? null,
      emailVerified: Boolean(user.email_confirmed_at),
    });
    if (!previewDecision.allowed) {
      const status = previewDecision.code === "invitation_expired" ? 410 : 403;
      return json({ error: "Invitation preview denied", code: previewDecision.code, requestId }, status);
    }
    const { data: provider } = await service.from("provider_accounts").select("display_name").eq("id", invitation.provider_account_id).maybeSingle();
    if (!provider) return json({ error: "Provider unavailable", code: "provider_unavailable", requestId }, 404);
    return json({ invitation: { providerDisplayName: provider.display_name, roles: invitation.roles, expiresAt: invitation.expires_at }, requestId });
  }

  const audit = async (outcome: "denied" | "succeeded" | "failed", reason?: string, membershipId?: string) => {
    await service.from("admin_audit_events").insert({
      actor_principal_id: user.id,
      provider_account_id: invitation.provider_account_id,
      action: "provider.members.invitation.accept",
      target_type: "provider_membership_invitation",
      target_ref: invitation.id,
      authorization_context: { source: "provider-invitation-api", assuranceLevel: aalFromToken(authHeader) },
      metadata: membershipId ? { membershipId } : {},
      reason: reason ?? null,
      outcome,
      request_id: requestId,
    });
  };

  const hasVerifiedTotp = factorsData?.totp.some((factor) => factor.status === "verified") ?? false;
  const decision = authorizeInvitationAcceptance({
    invitation: { status: invitation.status, email: invitation.email, expiresAt: invitation.expires_at, roles: invitation.roles ?? [] },
    userEmail: user.email ?? null,
    emailVerified: Boolean(user.email_confirmed_at),
    hasVerifiedTotp,
    aal: aalFromToken(authHeader),
  });
  if (!decision.allowed) {
    await audit("denied", decision.code);
    const status = decision.code === "invitation_expired" ? 410 : decision.code === "invitation_unavailable" ? 409 : 403;
    return json({ error: "Invitation acceptance denied", code: decision.code, requestId }, status);
  }

  const { data, error } = await userClient.rpc("accept_provider_membership_invitation", {
    p_invitation_id: invitation.id,
    p_request_id: requestId,
  });
  if (error || !data) {
    await audit("failed", "atomic acceptance failed");
    return json({ error: "Unable to accept invitation", code: "acceptance_failed", requestId }, 409);
  }

  return json({ membership: data, requestId });
});
