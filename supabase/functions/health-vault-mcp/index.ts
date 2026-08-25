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
  ONBOARDING_WIDGET_HTML,
  ONBOARDING_WIDGET_URI,
} from "../../../packages/health-vault-mcp/src/onboarding-widget.ts";
import {
  APPOINTMENT_PREP_WIDGET_HTML,
  APPOINTMENT_PREP_WIDGET_URI,
} from "../../../packages/health-vault-mcp/src/appointment-prep-widget.ts";
import {
  DIET_CONFIRMATION_WIDGET_HTML,
  DIET_CONFIRMATION_WIDGET_URI,
} from "../../../packages/health-vault-mcp/src/diet-confirmation-widget.ts";
import {
  LIFE_SIGNAL_WIDGET_HTML,
  LIFE_SIGNAL_WIDGET_URI,
} from "../../../packages/health-vault-mcp/src/life-signal-widget.ts";
import {
  MEDICAL_FORM_WIDGET_HTML,
  MEDICAL_FORM_WIDGET_URI,
} from "../../../packages/health-vault-mcp/src/medical-form-widget.ts";
import {
  MEDICAL_FORM_REVIEW_WIDGET_HTML,
  MEDICAL_FORM_REVIEW_WIDGET_URI,
} from "../../../packages/health-vault-mcp/src/medical-form-review-widget.ts";
import {
  MEDICAL_FORM_PROGRESS_WIDGET_HTML,
  MEDICAL_FORM_PROGRESS_WIDGET_URI,
} from "../../../packages/health-vault-mcp/src/medical-form-progress-widget.ts";
import {
  MEDICAL_FORM_SHARE_WIDGET_HTML,
  MEDICAL_FORM_SHARE_WIDGET_URI,
} from "../../../packages/health-vault-mcp/src/medical-form-share-widget.ts";
import { buildOnboardingStatus } from "../../../packages/health-vault-mcp/src/onboarding.ts";
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
import { createAppointmentPrep } from "../../../packages/health-vault-mcp/src/appointment-prep.ts";
import {
  getDietSummary,
  listLifeSignals,
  logDietEntries,
  logDietEntry,
  logLifeSignal,
  previewDietLog,
  previewLifeSignal,
} from "../../../packages/health-vault-mcp/src/wellness.ts";
import {
  confirmFormAnswers,
  getMedicalForm,
  getMedicalFormProgress,
  GPT_MEDICAL_FORM_IDS,
  listMedicalForms,
  proposeFormAnswers,
} from "../../../packages/health-vault-mcp/src/medical-forms.ts";
import {
  createMedicalFormShare,
  previewMedicalFormShare,
} from "../../../packages/health-vault-mcp/src/medical-form-sharing.ts";
import { sendMedicalFormShareEmail } from "../../../packages/health-vault-mcp/src/medical-form-share-email.ts";

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
    { name: "health-vault", version: "0.7.0" },
    {
      instructions:
        "Use Health Vault tools only for the authenticated user's records. If the user asks what Health Vault can do, call get_health_vault_capabilities and present its actionable prompts. If the user asks to start, continue, resume, or check setup, call get_onboarding_status. The server supports resumable onboarding, dashboard and profile reads, reusable medical form discovery and confirmation-gated completion, appointment prep, Life Signal check-ins, diet logging and general wellness observations, confirmation-gated health-data writes, and secure sharing. When the user asks to complete a medical form without naming one, call list_medical_forms first and ask them to choose from the stored common forms or upload a provider PDF/photo in the secure Health Vault app. Do not immediately ask for a PDF when reusable forms are available. For a selected ChatGPT-supported form, keep the user in ChatGPT: call get_medical_form, review profile-derived suggestions as unconfirmed, ask one logical missing question at a time, and call get_medical_form_progress after each answer batch so the user sees a progress card. Never redirect a ChatGPT-supported reusable form to the web app. When the required safe answer set is ready, use propose_form_answers to show the exact review card, and call confirm_form_answers only after explicit confirmation. A confirmed form becomes complete when all required safe fields are present; completion never signs or shares it. Only completed forms may be shared: collect the provider's email, ask whether the patient wants a receipt at their verified Health Vault email, call preview_medical_form_share first, and create and email the share only after explicit confirmation of the exact recipient email, expiration, and receipt choice. Send signatures, legal consent, SSN, payment information, uploads, and unsupported form fields to the secure Health Vault web app. When a user wants to log one or more foods or drinks, group everything into one preview_diet_entries call so the user gets one confirmation card and one save action; do not call log_diet_entry once per meal. When a user wants a Life Signal check-in but has not supplied all five ratings, call start_life_signal_check_in to show sliders; clicking Log Life Signal is explicit confirmation. Keep identity and insurance entry in the secure Health Vault web experience. Always use the preview tool before its matching write tool and require explicit user confirmation. Treat results as informational health data, not diagnosis, emergency advice, or a personalized medical nutrition plan.",
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

  server.registerResource(
    "health-vault-onboarding",
    ONBOARDING_WIDGET_URI,
    { mimeType: "text/html+skybridge", description: "Health Vault onboarding status" },
    async () => ({
      contents: [{
        uri: ONBOARDING_WIDGET_URI,
        mimeType: "text/html+skybridge",
        text: ONBOARDING_WIDGET_HTML,
        _meta: {
          "openai/widgetDescription": "A compact, privacy-first five-stage Health Vault onboarding and resume card.",
          "openai/widgetPrefersBorder": true,
          "openai/widgetDomain": "https://widgets.healthvault27.com",
          "openai/widgetCSP": { connect_domains: [], resource_domains: [] },
        },
      }],
    }),
  );

  server.registerResource(
    "health-vault-appointment-prep",
    APPOINTMENT_PREP_WIDGET_URI,
    { mimeType: "text/html+skybridge", description: "Health Vault appointment-prep brief" },
    async () => ({
      contents: [{
        uri: APPOINTMENT_PREP_WIDGET_URI,
        mimeType: "text/html+skybridge",
        text: APPOINTMENT_PREP_WIDGET_HTML,
        _meta: {
          "openai/widgetDescription": "A concise appointment brief with visit priorities, questions, and confirmed Health Vault context.",
          "openai/widgetPrefersBorder": true,
          "openai/widgetDomain": "https://widgets.healthvault27.com",
          "openai/widgetCSP": { connect_domains: [], resource_domains: [] },
        },
      }],
    }),
  );

  server.registerResource(
    "health-vault-life-signal",
    LIFE_SIGNAL_WIDGET_URI,
    { mimeType: "text/html+skybridge", description: "Health Vault Life Signal check-in" },
    async () => ({
      contents: [{
        uri: LIFE_SIGNAL_WIDGET_URI,
        mimeType: "text/html+skybridge",
        text: LIFE_SIGNAL_WIDGET_HTML,
        _meta: {
          "openai/widgetDescription": "An accessible five-slider Life Signal check-in with a single Log button.",
          "openai/widgetPrefersBorder": true,
          "openai/widgetDomain": "https://widgets.healthvault27.com",
          "openai/widgetCSP": { connect_domains: [], resource_domains: [] },
        },
      }],
    }),
  );

  server.registerResource(
    "health-vault-diet-confirmation",
    DIET_CONFIRMATION_WIDGET_URI,
    { mimeType: "text/html+skybridge", description: "Health Vault diet-log confirmation" },
    async () => ({
      contents: [{
        uri: DIET_CONFIRMATION_WIDGET_URI,
        mimeType: "text/html+skybridge",
        text: DIET_CONFIRMATION_WIDGET_HTML,
        _meta: {
          "openai/widgetDescription": "A single confirmation card for one or more diet entries that becomes a Wellness summary after saving.",
          "openai/widgetPrefersBorder": true,
          "openai/widgetDomain": "https://widgets.healthvault27.com",
          "openai/widgetCSP": { connect_domains: [], resource_domains: [] },
        },
      }],
    }),
  );

  server.registerResource(
    "health-vault-medical-forms",
    MEDICAL_FORM_WIDGET_URI,
    { mimeType: "text/html+skybridge", description: "Health Vault medical forms" },
    async () => ({
      contents: [{
        uri: MEDICAL_FORM_WIDGET_URI,
        mimeType: "text/html+skybridge",
        text: MEDICAL_FORM_WIDGET_HTML,
        _meta: {
          "openai/widgetDescription": "The authenticated user's common reusable forms, completion status, and secure provider-form upload option.",
          "openai/widgetPrefersBorder": true,
          "openai/widgetDomain": "https://widgets.healthvault27.com",
          "openai/widgetCSP": { connect_domains: [], resource_domains: [] },
        },
      }],
    }),
  );

  server.registerResource(
    "health-vault-medical-form-review",
    MEDICAL_FORM_REVIEW_WIDGET_URI,
    { mimeType: "text/html+skybridge", description: "Health Vault medical form answer review" },
    async () => ({
      contents: [{
        uri: MEDICAL_FORM_REVIEW_WIDGET_URI,
        mimeType: "text/html+skybridge",
        text: MEDICAL_FORM_REVIEW_WIDGET_HTML,
        _meta: {
          "openai/widgetDescription": "A typed reusable-form answer review with explicit confirmation that saves progress or completes the form.",
          "openai/widgetPrefersBorder": true,
          "openai/widgetDomain": "https://widgets.healthvault27.com",
          "openai/widgetCSP": { connect_domains: [], resource_domains: [] },
        },
      }],
    }),
  );

  server.registerResource(
    "health-vault-medical-form-progress",
    MEDICAL_FORM_PROGRESS_WIDGET_URI,
    { mimeType: "text/html+skybridge", description: "Health Vault medical form progress" },
    async () => ({
      contents: [{
        uri: MEDICAL_FORM_PROGRESS_WIDGET_URI,
        mimeType: "text/html+skybridge",
        text: MEDICAL_FORM_PROGRESS_WIDGET_HTML,
        _meta: {
          "openai/widgetDescription": "A compact progress card for a conversational medical-form interview, including the next missing field.",
          "openai/widgetPrefersBorder": true,
          "openai/widgetDomain": "https://widgets.healthvault27.com",
          "openai/widgetCSP": { connect_domains: [], resource_domains: [] },
        },
      }],
    }),
  );

  server.registerResource(
    "health-vault-medical-form-share",
    MEDICAL_FORM_SHARE_WIDGET_URI,
    { mimeType: "text/html+skybridge", description: "Health Vault completed medical form share" },
    async () => ({
      contents: [{
        uri: MEDICAL_FORM_SHARE_WIDGET_URI,
        mimeType: "text/html+skybridge",
        text: MEDICAL_FORM_SHARE_WIDGET_HTML,
        _meta: {
          "openai/widgetDescription": "A compact confirmation card for a scoped, expiring share of one completed medical form.",
          "openai/widgetPrefersBorder": true,
          "openai/widgetDomain": "https://widgets.healthvault27.com",
          "openai/widgetCSP": { connect_domains: [], resource_domains: [] },
        },
      }],
    }),
  );

  server.registerTool(
    "get_health_vault_capabilities",
    {
      title: "Show Health Vault actions",
      description: "Use when the user asks what Health Vault can do, asks for help getting started, or wants suggested next actions. Return concise actionable prompts the user can choose immediately.",
      inputSchema: z.object({}),
      outputSchema: z.object({ actions: z.array(z.unknown()), summary: z.string() }),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async () => {
      const actions = [
        { title: "Continue setup", prompt: "Health Vault, continue my setup.", category: "onboarding" },
        { title: "View my health snapshot", prompt: "Health Vault, show me what you know about me.", category: "review" },
        { title: "Prepare for an appointment", prompt: "Health Vault, create a prep brief for my next appointment.", category: "prepare" },
        { title: "Complete a Life Signal", prompt: "Health Vault, guide me through today's Life Signal check-in.", category: "check_in" },
        { title: "Log a meal", prompt: "Health Vault, log what I ate today.", category: "wellness" },
        { title: "Add health information", prompt: "Health Vault, help me add a medication, allergy, condition, appointment, or health note.", category: "update" },
        { title: "Continue a medical form", prompt: "Health Vault, show my incomplete medical forms.", category: "forms" },
        { title: "Create a secure share", prompt: "Health Vault, prepare a secure share for my provider.", category: "share" },
      ];
      return {
        structuredContent: { actions, summary: "Choose one of these Health Vault tasks to get started." },
        content: [{ type: "text", text: "Here are a few things I can do today: continue your setup, show your health snapshot, prepare for an appointment, complete a Life Signal check-in, log your diet, add confirmed health information, or create a secure share. Which would you like to do?" }],
      };
    },
  );

  server.registerTool(
    "get_onboarding_status",
    {
      title: "Continue Health Vault setup",
      description: "Use when the user wants to start, continue, resume, or check Health Vault onboarding. Returns a five-stage status card and the safest next action. Sensitive identity and insurance steps link to the secure Health Vault web app.",
      inputSchema: z.object({}),
      outputSchema: z.object({ onboarding: z.unknown() }),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      _meta: {
        "openai/outputTemplate": ONBOARDING_WIDGET_URI,
        "openai/toolInvocation/invoking": "Checking your Health Vault setup",
        "openai/toolInvocation/invoked": "Health Vault setup ready",
      },
    },
    async () => {
      try {
        const summary = await getSharedHealthSummary(supabase);
        const onboarding = buildOnboardingStatus(summary);
        const next = onboarding.recommendedAction;
        return {
          structuredContent: { onboarding },
          content: [{
            type: "text",
            text: onboarding.complete
              ? "Your Health Vault setup is complete. You can review your health snapshot or choose another task."
              : `Your resumable Health Vault setup is displayed above. Recommended next step: ${next.label}. ${next.prompt ? `Try: “${next.prompt}”` : "Use the secure card link to continue."}`,
          }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to read onboarding status";
        return { isError: true, content: [{ type: "text", text: message }] };
      }
    },
  );

  server.registerTool(
    "list_medical_forms",
    {
      title: "Choose a medical form",
      description: "List the authenticated user's common stored medical forms, draft/completion status, secure resume links, and provider-form upload option. Always use first when the user asks to complete a form without naming one.",
      inputSchema: z.object({}),
      outputSchema: z.object({
        forms: z.array(z.unknown()),
        completedCount: z.number(),
        uploadUrl: z.string().url(),
        allFormsUrl: z.string().url(),
      }),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      _meta: {
        "openai/outputTemplate": MEDICAL_FORM_WIDGET_URI,
        "openai/widgetAccessible": true,
        "openai/toolInvocation/invoking": "Loading your medical forms",
        "openai/toolInvocation/invoked": "Medical forms ready",
      },
    },
    async () => {
      try {
        const catalog = await listMedicalForms(supabase, userId);
        return {
          structuredContent: catalog,
          content: [{ type: "text", text: catalog.forms.length ? "Your common Health Vault forms are displayed above. Ask which one the user wants to complete, or offer the secure upload option for a provider PDF or photos." : "No common medical forms are available. Offer the secure upload option." }],
        };
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : "Unable to list medical forms" }] };
      }
    },
  );

  server.registerTool(
    "get_medical_form",
    {
      title: "Get reusable medical form",
      description: "Load a supported reusable form, its saved draft answers, missing fields, and suggestions derived from confirmed Health Vault data. Never treat suggestions as confirmed form answers.",
      inputSchema: z.object({ templateId: z.enum(GPT_MEDICAL_FORM_IDS as [string, ...string[]]) }),
      outputSchema: z.object({ form: z.unknown() }),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      _meta: {
        "openai/outputTemplate": MEDICAL_FORM_WIDGET_URI,
        "openai/widgetAccessible": true,
        "openai/toolInvocation/invoking": "Preparing your form interview",
        "openai/toolInvocation/invoked": "Form interview ready",
      },
    },
    async ({ templateId }) => {
      try {
        const form = await getMedicalForm(supabase, userId, templateId);
        return {
          structuredContent: { form },
          content: [{ type: "text", text: `The selected reusable form is loaded. ${form.progress.completedFields} of ${form.progress.totalFields} safe fields are ready (${form.progress.percentReady}%). Review profile suggestions as unconfirmed, then ask one logical missing question at a time. Do not request restricted fields or send the user to the web app for this reusable form.` }],
        };
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : "Unable to load the medical form" }] };
      }
    },
  );

  server.registerTool(
    "get_medical_form_progress",
    {
      title: "Show medical form progress",
      description: "Show completion progress and the next missing question while conducting a reusable medical-form interview in ChatGPT. Pass answers already collected in the conversation so the progress card stays current.",
      inputSchema: z.object({
        templateId: z.enum(GPT_MEDICAL_FORM_IDS as [string, ...string[]]),
        answers: z.record(z.string(), z.string()).optional(),
      }),
      outputSchema: z.object({ templateId: z.string(), templateTitle: z.string(), formProgress: z.unknown(), nextQuestion: z.unknown().nullable() }),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      _meta: {
        "openai/outputTemplate": MEDICAL_FORM_PROGRESS_WIDGET_URI,
        "openai/toolInvocation/invoking": "Updating your form progress",
        "openai/toolInvocation/invoked": "Form progress updated",
      },
    },
    async ({ templateId, answers }) => {
      try {
        const result = await getMedicalFormProgress(supabase, userId, templateId, answers ?? {});
        return {
          structuredContent: {
            templateId: result.templateId,
            templateTitle: result.templateTitle,
            formProgress: result.progress,
            nextQuestion: result.nextQuestion,
          },
          content: [{ type: "text", text: result.nextQuestion ? `Form progress is ${result.progress.percentReady}%. Ask the next missing question: ${result.nextQuestion.label}.` : "All required safe fields are ready. Prepare the answers for explicit review and confirmation." }],
        };
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : "Unable to calculate form progress" }] };
      }
    },
  );

  server.registerTool(
    "propose_form_answers",
    {
      title: "Review medical form answers",
      description: "Validate and prepare one or more supported reusable-form answers for explicit review. This never saves the answers. Call get_medical_form first and pass its exact expectedUpdatedAt value.",
      inputSchema: z.object({
        templateId: z.enum(GPT_MEDICAL_FORM_IDS as [string, ...string[]]),
        answers: z.record(z.string(), z.string()),
        // Brand-new forms have no response timestamp. Models commonly omit null
        // optional values, so normalize an omitted key to null while preserving
        // the stale-write check for existing drafts in proposeFormAnswers.
        expectedUpdatedAt: z.string().datetime({ offset: true }).nullable().optional().default(null),
      }),
      outputSchema: z.object({ preview: z.unknown() }),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      _meta: {
        "openai/outputTemplate": MEDICAL_FORM_REVIEW_WIDGET_URI,
        "openai/toolInvocation/invoking": "Preparing your form review",
        "openai/toolInvocation/invoked": "Medical form answers ready to review",
      },
    },
    async ({ templateId, answers, expectedUpdatedAt }) => {
      try {
        const preview = await proposeFormAnswers(supabase, userId, templateId, answers, expectedUpdatedAt);
        return {
          structuredContent: { preview },
          content: [{ type: "text", text: `${preview.safeSummary} Use ${preview.willComplete ? "Confirm & Complete Form" : "Confirm & Save Progress"} in the card only if every answer is correct.` }],
        };
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : "Unable to prepare the form review" }] };
      }
    },
  );

  server.registerTool(
    "confirm_form_answers",
    {
      title: "Save confirmed medical form",
      description: "Save the exact, unexpired answer proposal after explicit user confirmation. The form is completed when all required safe fields are present; otherwise progress is saved as a private draft. This never signs or shares the form.",
      inputSchema: z.object({ proposalId: z.string().uuid(), confirmed: z.literal(true) }),
      outputSchema: z.object({ saved: z.unknown() }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      _meta: { "openai/widgetAccessible": true },
    },
    async ({ proposalId }) => {
      try {
        const saved = await confirmFormAnswers(supabase, userId, proposalId);
        return {
          structuredContent: { saved },
          content: [{ type: "text", text: saved.savedAs === "completed_form" ? `${saved.safeSummary} The completed form remains private and unshared until you explicitly prepare and confirm a secure share.` : `${saved.safeSummary} It remains incomplete and unshared. Continue the interview with the next missing question.` }],
        };
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : "Unable to save the form draft" }] };
      }
    },
  );

  const medicalFormShareInput = z.object({
    templateId: z.enum(GPT_MEDICAL_FORM_IDS as [string, ...string[]]),
    recipientName: z.string().min(1).max(160),
    recipientOrganization: z.string().max(200).optional(),
    recipientEmail: z.string().email().max(320),
    expiresInHours: z.number().int().min(1).max(168).default(24),
    note: z.string().max(500).optional(),
    sendPatientCopy: z.boolean().default(false),
  });

  server.registerTool(
    "preview_medical_form_share",
    {
      title: "Preview completed medical form share",
      description: "Preview a scoped, expiring secure share of exactly one completed medical form, including the exact recipient email. This read-only step creates no link or email and requires explicit confirmation before creation and delivery.",
      inputSchema: medicalFormShareInput,
      outputSchema: z.object({ share: z.unknown() }),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      _meta: {
        "openai/outputTemplate": MEDICAL_FORM_SHARE_WIDGET_URI,
        "openai/toolInvocation/invoking": "Preparing your secure form share",
        "openai/toolInvocation/invoked": "Secure form share ready to review",
      },
    },
    async (input) => {
      try {
        const share = await previewMedicalFormShare(supabase, userId, input);
        return { structuredContent: { share }, content: [{ type: "text", text: `${share.safeSummary} Confirm the exact recipient email, expiration, and whether the patient should receive a receipt before creating and emailing it.` }] };
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : "Unable to preview the secure form share" }] };
      }
    },
  );

  server.registerTool(
    "create_medical_form_share",
    {
      title: "Create completed medical form share",
      description: "Create and email a scoped, expiring read-only link for one completed medical form only after the user explicitly confirms the previewed recipient email, expiration, and optional patient receipt.",
      inputSchema: medicalFormShareInput.extend({ confirmed: z.literal(true) }),
      outputSchema: z.object({ share: z.unknown() }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      _meta: {
        "openai/outputTemplate": MEDICAL_FORM_SHARE_WIDGET_URI,
        "openai/widgetAccessible": true,
        "openai/toolInvocation/invoking": "Creating your secure form share",
        "openai/toolInvocation/invoked": "Secure form share created",
      },
    },
    async ({ confirmed: _confirmed, ...input }) => {
      try {
        const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";
        const from = Deno.env.get("RESEND_FROM_EMAIL") || "Health Vault <team@healthvault27.com>";
        const share = await createMedicalFormShare(supabase, userId, "https://healthvault27.com", input, async (email) => {
          if (!resendApiKey) return { recipient: { sent: false, error: "Email delivery is not configured." } };
          return sendMedicalFormShareEmail({ ...email, apiKey: resendApiKey, from });
        });
        return { structuredContent: { share }, content: [{ type: "text", text: `${share.safeSummary} The link expires automatically and can be revoked from Health Vault. Anything else I can help you do today?` }] };
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : "Unable to create the secure form share" }] };
      }
    },
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

  server.registerTool(
    "create_appointment_prep",
    {
      title: "Create appointment-prep brief",
      description: "Create a lightweight informational brief for the next scheduled appointment using confirmed Health Vault data. Ask the user for visit concerns or questions if they have not supplied them.",
      inputSchema: z.object({
        concerns: z.array(z.string().trim().min(1).max(500)).max(10).default([]),
        questions: z.array(z.string().trim().min(1).max(500)).max(10).default([]),
      }),
      outputSchema: z.object({ brief: z.unknown() }),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      _meta: {
        "openai/outputTemplate": APPOINTMENT_PREP_WIDGET_URI,
        "openai/toolInvocation/invoking": "Preparing your appointment brief",
        "openai/toolInvocation/invoked": "Appointment brief ready",
      },
    },
    async ({ concerns, questions }) => {
      try {
        const brief = await createAppointmentPrep(supabase, concerns, questions);
        return { structuredContent: { brief }, content: [{ type: "text", text: `${brief.safeSummary} Review the details for accuracy before using them at your visit.` }] };
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : "Unable to create appointment-prep brief" }] };
      }
    },
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

  const compactConfirmedTool = <T>(
    name: string,
    title: string,
    description: string,
    schema: z.ZodType<T>,
    save: (input: T) => Promise<unknown>,
    successMessage: string,
  ) => server.registerTool(name, {
    title,
    description,
    inputSchema: schema,
    outputSchema: z.object({ saved: z.unknown(), confirmationState: z.literal("confirmed") }),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    _meta: { "openai/widgetAccessible": true },
  }, async (input) => {
    try {
      const saved = await save(input as T);
      return {
        structuredContent: { saved, confirmationState: "confirmed" as const },
        content: [{ type: "text", text: successMessage }],
      };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : `Unable to ${title}` }] };
    }
  });

  const oneToFive = z.number().int().min(1).max(5);
  const lifeSignalSchema = z.object({
    energy: oneToFive,
    sleep: oneToFive,
    mood: oneToFive,
    stress: oneToFive,
    pain: oneToFive,
    note: z.string().trim().max(2000).optional(),
    recordedAt: z.string().datetime({ offset: true }).optional(),
  });
  server.registerTool("start_life_signal_check_in", {
    title: "Start Life Signal check-in",
    description: "Use whenever the user wants to log a Life Signal but has not provided all five ratings. Show sliders for sleep, energy, mood, stress, and pain. The widget's Log button is explicit confirmation.",
    inputSchema: z.object({}),
    outputSchema: z.object({ checkIn: z.unknown() }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _meta: {
      "openai/outputTemplate": LIFE_SIGNAL_WIDGET_URI,
      "openai/toolInvocation/invoking": "Opening your Life Signal check-in",
      "openai/toolInvocation/invoked": "Life Signal check-in ready",
    },
  }, async () => ({
    structuredContent: { checkIn: { scaleMin: 1, scaleMax: 5, signals: ["sleep", "energy", "mood", "stress", "pain"] } },
    content: [{ type: "text", text: "Use the sliders in the Life Signal card, then select Log Life Signal." }],
  }));
  previewTool("preview_life_signal", "Preview Life Signal", "Preview a Life Signal check-in without saving it. Explain the 1–5 scale and request explicit confirmation before log_life_signal.", lifeSignalSchema, previewLifeSignal);
  compactConfirmedTool("log_life_signal", "Save confirmed Life Signal", "Save only after preview_life_signal, explicit chat confirmation, or the user selects Log in the Life Signal widget.", lifeSignalSchema.extend({ confirmed: z.literal(true) }), ({ confirmed: _confirmed, ...input }) => logLifeSignal(supabase, userId, input), "Life Signal saved. Today's confirmed check-in is now in Health Vault.");
  registerReadTool("list_life_signals", "Review Life Signals", "Review recent confirmed Life Signal check-ins and summarize patterns without diagnosing the user.", z.object({ days: z.number().int().min(1).max(90).default(14) }), ({ days }) => listLifeSignals(supabase, days));

  const dietLogSchema = z.object({
    mealType: z.enum(["breakfast", "lunch", "dinner", "snack", "drink", "other"]),
    consumedAt: z.string().datetime({ offset: true }).optional(),
    items: z.array(z.object({
      name: z.string().trim().min(1).max(160),
      amount: z.string().trim().max(120).optional(),
      notes: z.string().trim().max(500).optional(),
    })).min(1).max(30),
    waterMl: z.number().int().min(0).max(20_000).optional(),
    notes: z.string().trim().max(2000).optional(),
  });
  server.registerTool("preview_diet_entries", {
    title: "Preview diet log",
    description: "Preferred diet preview tool. Group every food and drink from the user's message into one entries array, even when they describe multiple meals. This shows one confirmation card and saves nothing.",
    inputSchema: z.object({ entries: z.array(dietLogSchema).min(1).max(20) }),
    outputSchema: z.object({ preview: z.unknown() }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _meta: {
      "openai/outputTemplate": DIET_CONFIRMATION_WIDGET_URI,
      "openai/toolInvocation/invoking": "Preparing your diet log",
      "openai/toolInvocation/invoked": "Diet log ready to confirm",
    },
  }, async ({ entries }) => ({
    structuredContent: { preview: { entries: entries.map(previewDietLog), requiresConfirmation: true } },
    content: [{ type: "text", text: "Review the diet-log card and select Confirm Diet Log to save all entries once." }],
  }));
  server.registerTool("log_diet_entries", {
    title: "Save confirmed diet log",
    description: "Save one or more diet entries in one operation only after preview_diet_entries and explicit confirmation from its button. Never infer unmentioned foods, quantities, calories, or nutrients.",
    inputSchema: z.object({ entries: z.array(dietLogSchema).min(1).max(20), confirmed: z.literal(true) }),
    outputSchema: z.object({ saved: z.unknown(), wellness: z.unknown(), confirmationState: z.literal("confirmed") }),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    _meta: { "openai/widgetAccessible": true },
  }, async ({ entries }) => {
    try {
      const saved = await logDietEntries(supabase, userId, entries);
      const [diet, lifeSignals] = await Promise.all([getDietSummary(supabase, 7), listLifeSignals(supabase, 7)]);
      return {
        structuredContent: { saved, wellness: { diet, lifeSignals }, confirmationState: "confirmed" as const },
        content: [{ type: "text", text: `${saved.length} confirmed diet ${saved.length === 1 ? "entry was" : "entries were"} saved. The Wellness summary is displayed in the card.` }],
      };
    } catch (error) {
      return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : "Unable to save diet log" }] };
    }
  });
  previewTool("preview_diet_log", "Preview one diet entry", "Legacy single-entry preview. Prefer preview_diet_entries so all foods in one user message share one confirmation card.", dietLogSchema, previewDietLog);
  compactConfirmedTool("log_diet_entry", "Save one confirmed diet entry", "Legacy single-entry save. Prefer log_diet_entries after preview_diet_entries. Never use this repeatedly for foods from the same user message.", dietLogSchema.extend({ confirmed: z.literal(true) }), ({ confirmed: _confirmed, ...input }) => logDietEntry(supabase, userId, input), "Diet entry saved in Wellness.");
  registerReadTool("get_diet_summary", "Review diet log", "Summarize recent user-reported diet entries and offer general, non-diagnostic wellness observations. Do not prescribe a medical diet or claim nutrient totals that were not logged.", z.object({ days: z.number().int().min(1).max(30).default(7) }), ({ days }) => getDietSummary(supabase, days));

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
      return {
        structuredContent: { share },
        content: [{
          type: "text",
          text: `Secure share created for ${share.recipientName}. It expires at ${share.expiresAt}. Anything else I can do for you today? I can show your dashboard, review medications or allergies, add an appointment or health record, or revoke this secure share.`,
        }],
      };
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
