import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { McpServer } from "npm:@modelcontextprotocol/sdk@1.25.3/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "npm:@modelcontextprotocol/sdk@1.25.3/server/webStandardStreamableHttp.js";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.112.3";
import { z } from "npm:zod@4.1.13";
import {
  DASHBOARD_WIDGET_HTML,
  DASHBOARD_WIDGET_URI,
} from "../../../packages/health-vault-mcp/src/dashboard-widget.ts";
import {
  SHARE_WIDGET_HTML,
  SHARE_WIDGET_URI,
} from "../../../packages/health-vault-mcp/src/share-widget.ts";
import {
  getAllergies,
  getConditions,
  getHealthRecords,
  getMedications,
} from "../../../packages/health-vault-mcp/src/health-details.ts";
import {
  createAppointment,
  previewAppointment,
} from "../../../packages/health-vault-mcp/src/appointments.ts";
import { getHealthSummary as getSharedHealthSummary } from "../../../packages/health-vault-mcp/src/health-summary.ts";
import {
  cancelAppointment,
  createAllergy,
  createCondition,
  createHealthRecord,
  createMedication,
  previewAllergy,
  previewAppointmentCancellation,
  previewCondition,
  previewHealthRecord,
  previewMedication,
} from "../../../packages/health-vault-mcp/src/health-writes.ts";
import {
  createHealthShare,
  HEALTH_SHARE_CATEGORIES,
  previewHealthShare,
  revokeHealthShare,
} from "../../../packages/health-vault-mcp/src/health-sharing.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/health-vault-mcp`;
const PROFILE_PHOTO_PATH = "/storage/v1/object/public/profile-images/";
const profilePhotoCache = new Map<string, string>();

async function getProfilePhotoDataUrl(photoUrl: unknown): Promise<string | null> {
  if (typeof photoUrl !== "string" || !photoUrl) return null;

  let source: URL;
  try {
    source = new URL(photoUrl);
  } catch {
    return null;
  }

  const allowedOrigin = new URL(SUPABASE_URL).origin;
  if (source.origin !== allowedOrigin || !source.pathname.startsWith(PROFILE_PHOTO_PATH)) return null;

  const cached = profilePhotoCache.get(photoUrl);
  if (cached) return cached;

  try {
    const response = await fetch(source, { signal: AbortSignal.timeout(4_000) });
    const contentType = response.headers.get("content-type")?.split(";", 1)[0] ?? "";
    if (!response.ok || !contentType.startsWith("image/")) return null;

    const bytes = new Uint8Array(await response.arrayBuffer());
    if (!bytes.length || bytes.length > 100_000) return null;

    let binary = "";
    for (let index = 0; index < bytes.length; index += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
    }
    const dataUrl = `data:${contentType};base64,${btoa(binary)}`;
    profilePhotoCache.set(photoUrl, dataUrl);
    return dataUrl;
  } catch {
    return null;
  }
}

async function dashboardMetadata(summary: { profile?: { photoUrl?: unknown } | null }) {
  const profilePhotoDataUrl = await getProfilePhotoDataUrl(summary.profile?.photoUrl);
  return profilePhotoDataUrl ? { profilePhotoDataUrl } : {};
}

function jsonResponse(body: unknown, status = 200, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...headers,
    },
  });
}

function unauthorizedResponse(): Response {
  return jsonResponse(
    { error: "A valid Health Vault access token is required" },
    401,
    { "www-authenticate": `Bearer resource_metadata="${FUNCTION_URL}"` },
  );
}

function readBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

type QueryResult = {
  count: number | null;
  data: unknown;
  error: { message: string } | null;
};

function assertSuccessful(label: string, result: QueryResult): void {
  if (result.error) throw new Error(`Unable to read ${label}: ${result.error.message}`);
}

async function getHealthSummary(supabase: SupabaseClient) {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();
  const [profile, conditions, medications, allergies, records, appointments, coverages, preferences] =
    await Promise.all([
      supabase
        .from("user_profiles")
        .select("first_name, last_name, email_verified, identity_verified, onboarding_complete")
        .maybeSingle(),
      supabase.from("conditions").select("id", { count: "exact", head: true }).eq("status", "Active"),
      supabase.from("medications").select("id, end_date"),
      supabase.from("allergies").select("id", { count: "exact", head: true }),
      supabase.from("health_records").select("id", { count: "exact", head: true }),
      supabase
        .from("appointments")
        .select("provider_name, appointment_type, scheduled_at, location")
        .eq("status", "scheduled")
        .gte("scheduled_at", now)
        .order("scheduled_at", { ascending: true })
        .limit(1),
      supabase.from("insurance_coverages").select("id", { count: "exact", head: true }),
      supabase.from("user_preferences").select("id").maybeSingle(),
    ]);

  assertSuccessful("profile", profile);
  assertSuccessful("conditions", conditions);
  assertSuccessful("medications", medications);
  assertSuccessful("allergies", allergies);
  assertSuccessful("health records", records);
  assertSuccessful("appointments", appointments);
  assertSuccessful("insurance coverages", coverages);
  assertSuccessful("preferences", preferences);

  const medicationRows = (medications.data ?? []) as Array<{ end_date: string | null }>;
  const profileRow = profile.data as {
    first_name?: string;
    last_name?: string;
    email_verified?: boolean;
    identity_verified?: boolean;
    onboarding_complete?: boolean;
  } | null;
  const appointmentRows = (appointments.data ?? []) as Array<{
    provider_name: string | null;
    appointment_type: string | null;
    scheduled_at: string;
    location: string | null;
  }>;
  const nextAppointment = appointmentRows[0];

  return {
    patientName: [profileRow?.first_name, profileRow?.last_name].filter(Boolean).join(" ") || null,
    activeConditions: conditions.count ?? 0,
    activeMedications: medicationRows.filter(({ end_date }) => !end_date || end_date >= today).length,
    allergies: allergies.count ?? 0,
    healthRecords: records.count ?? 0,
    nextAppointment: nextAppointment
      ? {
          providerName: nextAppointment.provider_name,
          appointmentType: nextAppointment.appointment_type,
          scheduledAt: nextAppointment.scheduled_at,
          location: nextAppointment.location,
        }
      : null,
    onboarding: {
      complete: Boolean(profileRow?.onboarding_complete),
      checklist: [
        { key: "email", label: "Verify email", complete: Boolean(profileRow?.email_verified || profileRow?.onboarding_complete), optional: false },
        { key: "identity", label: "Complete identity profile", complete: Boolean(profileRow?.identity_verified || profileRow?.onboarding_complete), optional: false },
        { key: "insurance", label: "Add insurance", complete: (coverages.count ?? 0) > 0, optional: true },
        { key: "preferences", label: "Choose assistant preferences", complete: Boolean(preferences.data), optional: true },
      ],
    },
  };
}

function createHealthVaultMcpServer(supabase: SupabaseClient, userId: string): McpServer {
  const server = new McpServer(
    { name: "health-vault", version: "0.3.0" },
    {
      instructions:
        "Use Health Vault tools only for the authenticated user's records. The server supports reading the dashboard, previewing and confirming health-data writes, and previewing, creating, and revoking secure shares. Always use the preview tool before its matching write tool and require explicit user confirmation. Treat results as informational health data, not diagnosis or emergency medical advice.",
    },
  );

  const dashboardResult = async (
    summary: Awaited<ReturnType<typeof getSharedHealthSummary>>,
    recentChange: { title: string; message: string },
    extra: Record<string, unknown> = {},
  ) => ({
    structuredContent: { ...extra, summary, recentChange },
    content: [{ type: "text" as const, text: `${recentChange.title}. The refreshed Health Vault dashboard is displayed in the widget.` }],
    _meta: await dashboardMetadata(summary),
  });

  server.registerResource(
    "health-vault-dashboard",
    DASHBOARD_WIDGET_URI,
    { mimeType: "text/html+skybridge", description: "Interactive Health Vault dashboard" },
    async () => ({
      contents: [{
        uri: DASHBOARD_WIDGET_URI,
        mimeType: "text/html+skybridge",
        text: DASHBOARD_WIDGET_HTML,
        _meta: {
          "openai/widgetDescription": "A private dashboard of the authenticated user's Health Vault data and setup progress.",
          "openai/widgetPrefersBorder": true,
          "openai/widgetDomain": "https://widgets.healthvault27.com",
          "openai/widgetCSP": {
            connect_domains: [],
            resource_domains: ["https://sgwekxjlvadvdosyudgj.supabase.co"],
          },
        },
      }],
    }),
  );

  server.registerResource(
    "health-vault-share-confirmation",
    SHARE_WIDGET_URI,
    { mimeType: "text/html+skybridge", description: "Secure Health Vault share confirmation" },
    async () => ({
      contents: [{
        uri: SHARE_WIDGET_URI,
        mimeType: "text/html+skybridge",
        text: SHARE_WIDGET_HTML,
        _meta: {
          "openai/widgetDescription": "A compact confirmation card for a scoped, expiring Health Vault share.",
          "openai/widgetPrefersBorder": true,
          "openai/widgetDomain": "https://widgets.healthvault27.com",
          "openai/widgetCSP": {
            connect_domains: [],
            resource_domains: [],
          },
        },
      }],
    }),
  );

  server.registerTool(
    "get_health_summary",
    {
      title: "Get health summary",
      description:
        "Get a concise overview of the authenticated user's Health Vault, including active conditions, medications, allergies, record count, and next appointment.",
      inputSchema: z.object({}),
      outputSchema: z.object({ summary: z.unknown() }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: {
        "openai/outputTemplate": DASHBOARD_WIDGET_URI,
        "openai/toolInvocation/invoking": "Loading your Health Vault",
        "openai/toolInvocation/invoked": "Health Vault dashboard ready",
      },
    },
    async () => {
      try {
        const summary = await getSharedHealthSummary(supabase);
        return {
          structuredContent: { summary },
          content: [{ type: "text", text: "The current Health Vault dashboard is displayed in the widget." }],
          _meta: await dashboardMetadata(summary),
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to read health summary";
        return { isError: true, content: [{ type: "text", text: message }] };
      }
    },
  );

  const registerReadTool = <T>(
    name: string,
    title: string,
    description: string,
    inputSchema: z.ZodType<T>,
    read: (input: T) => Promise<unknown>,
  ) => server.registerTool(
    name,
    {
      title,
      description,
      inputSchema,
      outputSchema: z.object({ result: z.unknown() }),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async (input) => {
      try {
        const result = await read(input as T);
        return { structuredContent: { result }, content: [{ type: "text", text: JSON.stringify(result) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : `Unable to run ${title}`;
        return { isError: true, content: [{ type: "text", text: message }] };
      }
    },
  );

  registerReadTool(
    "list_conditions",
    "List conditions",
    "List the authenticated user's recorded health conditions. Use activeOnly unless the user asks for history.",
    z.object({ activeOnly: z.boolean().default(true) }),
    ({ activeOnly }) => getConditions(supabase, activeOnly),
  );
  registerReadTool(
    "list_medications",
    "List medications",
    "List the authenticated user's medications, including dosage and frequency when recorded.",
    z.object({ activeOnly: z.boolean().default(true) }),
    ({ activeOnly }) => getMedications(supabase, activeOnly),
  );
  registerReadTool(
    "list_allergies",
    "List allergies",
    "List the authenticated user's recorded allergies and reactions.",
    z.object({}),
    () => getAllergies(supabase),
  );
  registerReadTool(
    "list_health_records",
    "List health records",
    "List the authenticated user's most recent Health Vault records with dates, type, and provider.",
    z.object({ limit: z.number().int().min(1).max(25).default(10) }),
    ({ limit }) => getHealthRecords(supabase, limit),
  );

  const appointmentSchema = {
    providerName: z.string().trim().min(1).max(160),
    appointmentType: z.string().trim().min(1).max(120),
    scheduledAt: z.string().datetime({ offset: true }),
    location: z.string().trim().max(240).optional(),
    notes: z.string().trim().max(2000).optional(),
  };

  server.registerTool(
    "preview_appointment",
    {
      title: "Preview appointment",
      description: "Prepare an appointment for review. This never saves data. Show the complete preview and ask the user to explicitly confirm before calling create_appointment.",
      inputSchema: z.object(appointmentSchema),
      outputSchema: z.object({ preview: z.unknown() }),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async (input) => {
      try {
        const preview = previewAppointment(input);
        return { structuredContent: { preview }, content: [{ type: "text", text: JSON.stringify(preview) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to preview appointment";
        return { isError: true, content: [{ type: "text", text: message }] };
      }
    },
  );

  server.registerTool(
    "create_appointment",
    {
      title: "Add confirmed appointment",
      description: "Save an appointment only after preview_appointment has been shown and the user explicitly confirms the exact details. Never call this from an initial request or implied consent.",
      inputSchema: z.object({ ...appointmentSchema, confirmed: z.literal(true) }),
      outputSchema: z.object({ summary: z.unknown(), recentChange: z.unknown() }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      _meta: {
        "openai/outputTemplate": DASHBOARD_WIDGET_URI,
        "openai/toolInvocation/invoking": "Saving your appointment",
        "openai/toolInvocation/invoked": "Appointment saved and dashboard updated",
      },
    },
    async ({ confirmed: _confirmed, ...input }) => {
      try {
        const appointment = await createAppointment(supabase, userId, input);
        const summary = await getSharedHealthSummary(supabase);
        return dashboardResult(summary, {
          title: "Appointment added",
          message: `${appointment.appointment_type} with ${appointment.provider_name} is now in Health Vault.`,
        }, { appointment });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to add appointment";
        return { isError: true, content: [{ type: "text", text: message }] };
      }
    },
  );

  const dateValue = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").optional();
  const conditionSchema = z.object({
    name: z.string().trim().min(1).max(160),
    status: z.enum(["Active", "In remission", "Resolved"]).default("Active"),
    diagnosedOn: dateValue,
    managingPhysician: z.string().trim().max(160).optional(),
    notes: z.string().trim().max(2000).optional(),
  });
  const medicationSchema = z.object({
    name: z.string().trim().min(1).max(160),
    dosage: z.string().trim().max(120).optional(),
    frequency: z.string().trim().max(160).optional(),
    prescribedBy: z.string().trim().max(160).optional(),
    startDate: dateValue,
    endDate: dateValue,
    notes: z.string().trim().max(2000).optional(),
  });
  const allergySchema = z.object({
    allergen: z.string().trim().min(1).max(160),
    reaction: z.string().trim().max(500).optional(),
    severity: z.enum(["Mild", "Moderate", "Severe"]).optional(),
    diagnosedOn: dateValue,
    notes: z.string().trim().max(2000).optional(),
  });
  const recordSchema = z.object({
    title: z.string().trim().min(1).max(200),
    kind: z.enum(["lab", "imaging", "pathology", "specialist_report", "other"]),
    providerName: z.string().trim().max(160).optional(),
    serviceDate: dateValue,
    summary: z.string().trim().max(4000).optional(),
    tags: z.array(z.string().trim().min(1).max(50)).max(12).optional(),
  });

  const previewTool = <T>(name: string, title: string, description: string, schema: z.ZodType<T>, preview: (input: T) => unknown) =>
    server.registerTool(name, {
      title,
      description,
      inputSchema: schema,
      outputSchema: z.object({ preview: z.unknown() }),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    }, async (input) => {
      try {
        const result = preview(input as T);
        return { structuredContent: { preview: result }, content: [{ type: "text", text: JSON.stringify(result) }] };
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : `Unable to ${title}` }] };
      }
    });

  const confirmedTool = <T>(
    name: string,
    title: string,
    description: string,
    schema: z.ZodType<T>,
    save: (input: T) => Promise<unknown>,
    change: (saved: any) => { title: string; message: string },
  ) => server.registerTool(name, {
    title,
    description,
    inputSchema: schema,
    outputSchema: z.object({ summary: z.unknown(), recentChange: z.unknown() }),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    _meta: { "openai/outputTemplate": DASHBOARD_WIDGET_URI },
  }, async (input) => {
    try {
      const saved = await save(input as T);
      const summary = await getSharedHealthSummary(supabase);
      return dashboardResult(summary, change(saved), { saved });
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : `Unable to ${title}` }] };
    }
  });

  previewTool("preview_condition", "Preview condition", "Prepare a condition for review without saving it. Show the exact details and request explicit confirmation before add_condition.", conditionSchema, previewCondition);
  confirmedTool("add_condition", "Add confirmed condition", "Save only after preview_condition and explicit user confirmation.", conditionSchema.extend({ confirmed: z.literal(true) }), ({ confirmed: _confirmed, ...input }) => createCondition(supabase, userId, input), (saved) => ({ title: "Condition added", message: `${saved.name} is now in Health Vault.` }));
  previewTool("preview_medication", "Preview medication", "Prepare a medication for review without saving it. Show the exact details and request explicit confirmation before add_medication.", medicationSchema, previewMedication);
  confirmedTool("add_medication", "Add confirmed medication", "Save only after preview_medication and explicit user confirmation.", medicationSchema.extend({ confirmed: z.literal(true) }), ({ confirmed: _confirmed, ...input }) => createMedication(supabase, userId, input), (saved) => ({ title: "Medication added", message: `${saved.name} is now in Health Vault.` }));
  previewTool("preview_allergy", "Preview allergy", "Prepare an allergy for review without saving it. Show the exact details and request explicit confirmation before add_allergy.", allergySchema, previewAllergy);
  confirmedTool("add_allergy", "Add confirmed allergy", "Save only after preview_allergy and explicit user confirmation.", allergySchema.extend({ confirmed: z.literal(true) }), ({ confirmed: _confirmed, ...input }) => createAllergy(supabase, userId, input), (saved) => ({ title: "Allergy added", message: `${saved.allergen} is now in Health Vault.` }));
  previewTool("preview_health_record", "Preview health record", "Prepare a record summary for review without saving it. Show the exact details and request explicit confirmation before add_health_record.", recordSchema, previewHealthRecord);
  confirmedTool("add_health_record", "Add confirmed health record", "Save only after preview_health_record and explicit user confirmation. This stores structured record information, not an uploaded file.", recordSchema.extend({ confirmed: z.literal(true) }), ({ confirmed: _confirmed, ...input }) => createHealthRecord(supabase, userId, input), (saved) => ({ title: "Health record added", message: `${saved.title} is now in Health Vault.` }));

  server.registerTool("preview_appointment_cancellation", {
    title: "Preview appointment cancellation",
    description: "Load the exact scheduled appointment and ask the user to explicitly confirm before cancel_appointment.",
    inputSchema: z.object({ appointmentId: z.string().uuid() }),
    outputSchema: z.object({ preview: z.unknown() }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ appointmentId }) => {
    try {
      const preview = await previewAppointmentCancellation(supabase, appointmentId);
      return { structuredContent: { preview }, content: [{ type: "text", text: JSON.stringify(preview) }] };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : "Unable to preview cancellation" }] };
    }
  });
  confirmedTool("cancel_appointment", "Cancel confirmed appointment", "Cancel only after preview_appointment_cancellation and explicit user confirmation.", z.object({ appointmentId: z.string().uuid(), confirmed: z.literal(true) }), ({ appointmentId }) => cancelAppointment(supabase, appointmentId), (saved) => ({ title: "Appointment cancelled", message: `${saved.appointment_type} with ${saved.provider_name} was cancelled.` }));

  const shareSchema = z.object({
    recipientName: z.string().trim().min(1).max(160),
    recipientOrganization: z.string().trim().max(200).optional(),
    categories: z.array(z.enum(HEALTH_SHARE_CATEGORIES)).min(1),
    expiresInDays: z.number().int().min(1).max(30).default(7),
    note: z.string().trim().max(1000).optional(),
  });
  server.registerTool("preview_health_share", {
    title: "Preview secure health share",
    description: "Preview the recipient, selected categories, and expiration in a compact confirmation card without creating a link. The user confirms from the card before create_health_share.",
    inputSchema: shareSchema,
    outputSchema: z.object({ preview: z.unknown() }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _meta: {
      "openai/outputTemplate": SHARE_WIDGET_URI,
      "openai/toolInvocation/invoking": "Preparing secure share",
      "openai/toolInvocation/invoked": "Secure share ready to confirm",
    },
  }, async (input) => {
    try {
      const preview = previewHealthShare(input);
      return {
        structuredContent: { preview },
        content: [{ type: "text", text: "Review the secure-share card and use Confirm Secure Share to create the link." }],
      };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : "Unable to preview secure share" }] };
    }
  });
  server.registerTool("create_health_share", {
    title: "Create confirmed secure health share",
    description: "Create a revocable, expiring link only after preview_health_share and explicit user confirmation. Return the link to the user; do not send it automatically.",
    inputSchema: shareSchema.extend({ confirmed: z.literal(true) }),
    outputSchema: z.object({ share: z.unknown() }),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    _meta: { "openai/widgetAccessible": true },
  }, async ({ confirmed: _confirmed, ...input }) => {
    try {
      const share = await createHealthShare(supabase, userId, "https://healthvault27.com", input);
      return { structuredContent: { share }, content: [{ type: "text", text: `Secure share created for ${share.recipientName}. It expires at ${share.expiresAt}.` }] };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : "Unable to create secure share" }] };
    }
  });
  server.registerTool("revoke_health_share", {
    title: "Revoke secure health share",
    description: "Revoke an existing secure share only after the user explicitly asks to revoke that exact share ID.",
    inputSchema: z.object({ shareId: z.string().uuid(), confirmed: z.literal(true) }),
    outputSchema: z.object({ revoked: z.unknown() }),
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  }, async ({ shareId }) => {
    try {
      const revoked = await revokeHealthShare(supabase, shareId);
      return { structuredContent: { revoked }, content: [{ type: "text", text: "The secure share was revoked." }] };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : "Unable to revoke secure share" }] };
    }
  });

  return server;
}

Deno.serve(async (request: Request) => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return jsonResponse({ error: "Server configuration is unavailable" }, 500);
  }

  if (request.method === "GET") {
    return jsonResponse({
      resource: FUNCTION_URL,
      authorization_servers: [`${SUPABASE_URL}/auth/v1`],
      bearer_methods_supported: ["header"],
      scopes_supported: ["openid", "email", "profile"],
    });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "This stateless MCP endpoint accepts POST requests" }, 405, {
      allow: "GET, POST",
    });
  }

  const accessToken = readBearerToken(request);
  if (!accessToken) return unauthorizedResponse();

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) return unauthorizedResponse();

  const server = createHealthVaultMcpServer(supabase, data.user.id);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  try {
    await server.connect(transport);
    return await transport.handleRequest(request, {
      authInfo: {
        token: accessToken,
        clientId: data.user.app_metadata.provider || "health-vault-user",
        scopes: [],
      },
    });
  } catch (error) {
    console.error("MCP request failed", error instanceof Error ? error.message : "Unknown error");
    return jsonResponse({ error: "MCP request failed" }, 500);
  } finally {
    await transport.close();
    await server.close();
  }
});
