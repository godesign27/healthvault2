import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const URL = Deno.env.get("SUPABASE_URL")!;
const KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PARTNER = "nourished_rebel";

function authAgeSeconds(token: string) {
  try { return Math.floor(Date.now() / 1000) - Number(JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).auth_time ?? 0); } catch { return Number.POSITIVE_INFINITY; }
}

function publicConfig(row: any) {
  const { prompt_template: _prompt, ...safe } = row;
  return safe;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const db = createClient(URL, KEY);
    const { data: { user } } = await db.auth.getUser(token);
    if (!user) return json({ error: "User not authenticated" }, 401);
    const roles = await db.from("admin_role_assignments").select("role_key,permissions").eq("principal_id", user.id).is("revoked_at", null);
    const assignments = roles.data ?? [];
    const canRead = assignments.some((row: any) => row.role_key === "platform_owner" || row.permissions?.includes("wellness_partners.read") || row.permissions?.includes("wellness_partners.manage"));
    const canManage = assignments.some((row: any) => row.role_key === "platform_owner" || row.permissions?.includes("wellness_partners.manage"));
    if (!canRead) return json({ error: "Wellness partner admin access required" }, 403);
    const body = await req.json();
    const sensitive = ["update", "publish", "rollback", "kill_switch", "replay"].includes(body.action);
    if (sensitive && (!canManage || authAgeSeconds(token) > 900)) return json({ error: canManage ? "Recent authentication is required. Sign out and back in." : "Manage permission required." }, 403);

    if (body.action === "overview") {
      const [partner, generation, events] = await Promise.all([
        db.from("wellness_partners").select("partner_key,display_name,status,launch_stage,framework_version,prompt_version,branding,disclaimer,consent_copy,website_url,gpt_enabled,cloud_enabled,generation_enabled,updated_at").eq("partner_key", PARTNER).single(),
        db.from("wellness_insights").select("status,duration_ms,error_code,created_at").eq("partner_key", PARTNER).gte("created_at", new Date(Date.now() - 30 * 86_400_000).toISOString()),
        db.from("wellness_funnel_events").select("product_key,event_name,occurred_at").eq("partner_key", PARTNER).gte("occurred_at", new Date(Date.now() - 30 * 86_400_000).toISOString()),
      ]);
      if (partner.error) throw partner.error;
      const runs = generation.data ?? []; const funnel = events.data ?? [];
      const durations = runs.map((row: any) => row.duration_ms).filter((value: unknown) => typeof value === "number") as number[];
      return json({ partner: partner.data, operations: { total: runs.length, succeeded: runs.filter((r: any) => r.status === "succeeded").length, failed: runs.filter((r: any) => r.status === "failed").length, rejected: runs.filter((r: any) => r.status === "rejected").length, pending: runs.filter((r: any) => ["pending","generating"].includes(r.status)).length, averageDurationMs: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0 }, metrics: Object.entries(funnel.reduce((acc: Record<string, number>, event: any) => { const key = `${event.product_key}:${event.event_name}`; acc[key] = (acc[key] ?? 0) + 1; return acc; }, {})).map(([key, count]) => ({ key, count })) });
    }
    if (body.action === "update") {
      const allowed = ["status","launch_stage","branding","disclaimer","consent_copy","website_url","gpt_enabled","cloud_enabled","generation_enabled"];
      const changes = Object.fromEntries(Object.entries(body.changes ?? {}).filter(([key]) => allowed.includes(key)));
      if (!Object.keys(changes).length || !String(body.reason ?? "").trim()) return json({ error: "Changes and an audit reason are required." }, 400);
      const before = await db.from("wellness_partners").select("*").eq("partner_key", PARTNER).single();
      const after = await db.from("wellness_partners").update({ ...changes, updated_by: user.id, updated_at: new Date().toISOString() }).eq("partner_key", PARTNER).select("*").single();
      if (after.error) throw after.error;
      await db.from("wellness_admin_audit").insert({ actor_id: user.id, partner_key: PARTNER, action: "configuration_updated", before_version: publicConfig(before.data), after_version: publicConfig(after.data), reason: body.reason });
      return json({ partner: publicConfig(after.data) });
    }
    if (body.action === "publish") {
      if (!String(body.promptTemplate ?? "").trim() || !String(body.reason ?? "").trim()) return json({ error: "Prompt and reason are required." }, 400);
      const before = await db.from("wellness_partners").select("*").eq("partner_key", PARTNER).single();
      const promptVersion = before.data.prompt_version + 1;
      const config = { ...publicConfig(before.data), prompt_template: body.promptTemplate };
      await db.from("wellness_partner_versions").insert({ partner_key: PARTNER, framework_version: before.data.framework_version, prompt_version: promptVersion, configuration: config, change_reason: body.reason, published_by: user.id });
      const after = await db.from("wellness_partners").update({ prompt_template: body.promptTemplate, prompt_version: promptVersion, updated_by: user.id, updated_at: new Date().toISOString() }).eq("partner_key", PARTNER).select("*").single();
      await db.from("wellness_admin_audit").insert({ actor_id: user.id, partner_key: PARTNER, action: "prompt_published", before_version: { prompt_version: before.data.prompt_version }, after_version: { prompt_version: promptVersion }, reason: body.reason });
      return json({ partner: publicConfig(after.data) });
    }
    if (body.action === "rollback") {
      const version = await db.from("wellness_partner_versions").select("configuration,framework_version,prompt_version").eq("id", body.versionId).eq("partner_key", PARTNER).single();
      if (version.error || !String(body.reason ?? "").trim()) return json({ error: "Valid version and reason are required." }, 400);
      const cfg = version.data.configuration;
      const after = await db.from("wellness_partners").update({ prompt_template: cfg.prompt_template, framework_version: version.data.framework_version, prompt_version: version.data.prompt_version, updated_by: user.id, updated_at: new Date().toISOString() }).eq("partner_key", PARTNER).select("*").single();
      await db.from("wellness_admin_audit").insert({ actor_id: user.id, partner_key: PARTNER, action: "version_rolled_back", after_version: { version_id: body.versionId }, reason: body.reason });
      return json({ partner: publicConfig(after.data) });
    }
    if (body.action === "kill_switch") {
      const before = await db.from("wellness_partners").select("generation_enabled,gpt_enabled,cloud_enabled,status").eq("partner_key", PARTNER).single();
      const after = await db.from("wellness_partners").update({ generation_enabled: false, gpt_enabled: false, cloud_enabled: false, status: "paused", updated_by: user.id, updated_at: new Date().toISOString() }).eq("partner_key", PARTNER).select("*").single();
      await db.from("wellness_admin_audit").insert({ actor_id: user.id, partner_key: PARTNER, action: "emergency_disabled", before_version: before.data, after_version: { status: "paused" }, reason: String(body.reason || "Emergency disable") });
      return json({ partner: publicConfig(after.data) });
    }
    if (body.action === "versions") {
      const versions = await db.from("wellness_partner_versions").select("id,framework_version,prompt_version,change_reason,created_at").eq("partner_key", PARTNER).order("created_at", { ascending: false }).limit(20);
      return json({ items: versions.data ?? [] });
    }
    return json({ error: "Unknown action" }, 400);
  } catch (error) { return json({ error: error instanceof Error ? error.message : "Admin request failed" }, 500); }
});
