import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getHealthSummary } from "./health-summary.js";
import { DASHBOARD_WIDGET_HTML, DASHBOARD_WIDGET_URI } from "./dashboard-widget.js";
import { ONBOARDING_WIDGET_HTML, ONBOARDING_WIDGET_URI } from "./onboarding-widget.js";
import { buildOnboardingStatus } from "./onboarding.js";
import { getAllergies, getConditions, getHealthRecords, getMedications } from "./health-details.js";
import { createAppointment, previewAppointment } from "./appointments.js";
import { callNourishedRebel, NOURISHED_REBEL_WIDGET_HTML, NOURISHED_REBEL_WIDGET_URI } from "./nourished-rebel.js";
import { confirmHealthImport, HEALTH_IMPORT_SOURCES, listVitalMeasurements, previewHealthImport, VITAL_METRICS } from "./health-imports.js";
import { HEALTH_IMPORT_WIDGET_HTML, HEALTH_IMPORT_WIDGET_URI } from "./health-import-widget.js";
import { CLINICAL_IMPORT_WIDGET_HTML, CLINICAL_IMPORT_WIDGET_URI } from "./clinical-import-widget.js";
import { CLINICAL_RECORD_TYPES, listConnectedHealthRecords, previewClinicalImport } from "./clinical-imports.js";

export function createHealthVaultMcpServer(supabase: SupabaseClient, userId: string): McpServer {
  const server = new McpServer(
    { name: "health-vault", version: "0.1.0" },
    {
      instructions:
        "Use Health Vault tools only for the authenticated user's records. When the user asks to use records already present in ChatGPT Health, read those existing Health records without reconnecting to or refreshing the provider, then pass them to preview_connected_health_records_import. Use preview_health_data_import for vital measurements. Explain that nothing has been saved and stop after either preview. Never call a confirmation tool in the same assistant turn as its preview. Wait for the user to approve the displayed proposal, then confirm that exact proposal. Never silently import or overwrite clinical information. Treat results as informational health data, not diagnosis or emergency medical advice.",
    },
  );

  server.registerResource("nourished-rebel-insights", NOURISHED_REBEL_WIDGET_URI, { mimeType: "text/html+skybridge", description: "Nourished Rebel wellness check-in and insight" }, async () => ({ contents: [{ uri: NOURISHED_REBEL_WIDGET_URI, mimeType: "text/html+skybridge", text: NOURISHED_REBEL_WIDGET_HTML, _meta: { "openai/widgetDescription": "The authenticated user's resumable Nourished Rebel check-in or latest stored insight.", "openai/widgetPrefersBorder": true, "openai/widgetDomain": "https://widgets.healthvault.me", "openai/widgetCSP": { connect_domains: [], resource_domains: [] } } }] }));
  server.registerResource("health-vault-vitals-import", HEALTH_IMPORT_WIDGET_URI, { mimeType: "text/html+skybridge", description: "Review and explicitly confirm vital measurements" }, async () => ({ contents: [{ uri: HEALTH_IMPORT_WIDGET_URI, mimeType: "text/html+skybridge", text: HEALTH_IMPORT_WIDGET_HTML, _meta: { "openai/widgetDescription": "A private review of proposed vital measurements. Nothing is saved until the user presses Import to Health Vault.", "openai/widgetPrefersBorder": true, "openai/widgetDomain": "https://widgets.healthvault.me", "openai/widgetCSP": { connect_domains: [], resource_domains: [] } } }] }));
  server.registerResource("health-vault-record-import", CLINICAL_IMPORT_WIDGET_URI, { mimeType: "text/html+skybridge", description: "Review and explicitly confirm existing ChatGPT Health records" }, async () => ({ contents: [{ uri: CLINICAL_IMPORT_WIDGET_URI, mimeType: "text/html+skybridge", text: CLINICAL_IMPORT_WIDGET_HTML, _meta: { "openai/widgetDescription": "A private review of records already retrieved in ChatGPT Health. Nothing is saved until the user presses Import selected records.", "openai/widgetPrefersBorder": true, "openai/widgetDomain": "https://widgets.healthvault.me", "openai/widgetCSP": { connect_domains: [], resource_domains: [] } } }] }));

  server.registerTool("get_nourished_rebel_insight", { title: "View Nourished Rebel insight", description: "Get the authenticated user's authoritative stored Nourished Rebel insight or check-in progress. Do not create a competing assessment.", inputSchema: z.object({}), annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }, _meta: { "openai/outputTemplate": NOURISHED_REBEL_WIDGET_URI } }, async () => { try { const state = await callNourishedRebel(supabase, "status"); return { structuredContent: { state }, content: [{ type: "text", text: state.latestInsight ? "The stored Nourished Rebel insight is displayed." : "The resumable wellness check-in is displayed." }] }; } catch (error) { return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : "Unable to load wellness insight" }] }; } });
  server.registerTool("generate_nourished_rebel_insight", { title: "Generate Nourished Rebel insight", description: "Generate or regenerate the authenticated user's authoritative Nourished Rebel insight from their latest saved check-in. Use this whenever the user explicitly asks to generate, regenerate, refresh, or update their insight; do not substitute the view action.", inputSchema: z.object({ confirmed: z.literal(true) }), annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }, _meta: { "openai/outputTemplate": NOURISHED_REBEL_WIDGET_URI } }, async () => { try { const state = await callNourishedRebel(supabase, "generate", { force: true }); return { structuredContent: { state }, content: [{ type: "text", text: "Your refreshed Nourished Rebel insight is displayed." }] }; } catch (error) { return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : "Unable to generate the wellness insight" }] }; } });
  server.registerTool("start_nourished_rebel_check_in", { title: "Start Nourished Rebel check-in", description: "Opt in and start the six-question Nourished Rebel check-in only after the user explicitly chooses to start.", inputSchema: z.object({ confirmed: z.literal(true) }), annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }, _meta: { "openai/outputTemplate": NOURISHED_REBEL_WIDGET_URI, "openai/widgetAccessible": true } }, async () => { try { const state = await callNourishedRebel(supabase, "enroll"); return { structuredContent: { state }, content: [{ type: "text", text: "The check-in is ready in the card." }] }; } catch (error) { return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : "Unable to start check-in" }] }; } });
  server.registerTool("save_nourished_rebel_check_in_answer", { title: "Save wellness check-in answer", description: "Save one explicit answer or skip and return the same stored progress and insight used by Health Vault.", inputSchema: z.object({ questionKey: z.enum(["sleep","meal_rhythm","energy_cravings","stress","hydration","movement"]), answer: z.string().trim().max(1000).nullable(), skipped: z.boolean().default(false), confirmed: z.literal(true) }), annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }, _meta: { "openai/outputTemplate": NOURISHED_REBEL_WIDGET_URI, "openai/widgetAccessible": true } }, async ({ questionKey, answer, skipped }) => { try { const state = await callNourishedRebel(supabase, "save_answer", { questionKey, answer, skipped }); return { structuredContent: { state }, content: [{ type: "text", text: `Check-in progress saved: ${state.checkIn?.answered_count ?? 0} of 6 answered.` }] }; } catch (error) { return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : "Unable to save answer" }] }; } });
  server.registerTool("rate_nourished_rebel_insight", { title: "Rate Nourished Rebel insight", description: "Save explicit thumbs-up or thumbs-down feedback for the stored insight.", inputSchema: z.object({ insightId: z.string().uuid(), target: z.enum(["overall","headline","sleep","blood_sugar","nourishment","stress"]), rating: z.enum(["up","down"]), confirmed: z.literal(true) }), annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async ({ confirmed: _confirmed, ...input }) => { try { await callNourishedRebel(supabase, "feedback", input); return { content: [{ type: "text", text: "Feedback saved." }] }; } catch (error) { return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : "Unable to save feedback" }] }; } });
  server.registerTool("open_nourished_rebel_site", { title: "Visit Nourished Rebel", description: "Return the Nourished Rebel public website CTA. No health data or user details are included. Booking integration is not currently supported.", inputSchema: z.object({ correlationId: z.string().uuid(), confirmed: z.literal(true) }), annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true } }, async ({ correlationId }) => { try { const cta = await callNourishedRebel(supabase, "cta", { correlationId }); return { structuredContent: { cta }, content: [{ type: "text", text: "The Nourished Rebel website link is ready." }] }; } catch (error) { return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : "Unable to open partner site" }] }; } });

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
          "openai/widgetDomain": "https://widgets.healthvault.me",
          "openai/widgetCSP": {
            connect_domains: [],
            resource_domains: ["https://sgwekxjlvadvdosyudgj.supabase.co"],
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
          "openai/widgetDomain": "https://widgets.healthvault.me",
          "openai/widgetCSP": { connect_domains: [], resource_domains: [] },
        },
      }],
    }),
  );

  server.registerTool(
    "get_onboarding_status",
    {
      title: "Continue Health Vault setup",
      description: "Start, continue, resume, or check the authenticated user's privacy-first Health Vault onboarding.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      _meta: {
        "openai/outputTemplate": ONBOARDING_WIDGET_URI,
        "openai/toolInvocation/invoking": "Checking your Health Vault setup",
        "openai/toolInvocation/invoked": "Health Vault setup ready",
      },
    },
    async () => {
      try {
        const onboarding = buildOnboardingStatus(await getHealthSummary(supabase));
        return {
          structuredContent: { onboarding },
          content: [{ type: "text", text: `Recommended next step: ${onboarding.recommendedAction.label}.` }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to read onboarding status";
        return { isError: true, content: [{ type: "text", text: message }] };
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
        const summary = await getHealthSummary(supabase);
        return {
          structuredContent: { summary },
          content: [
            {
              type: "text",
              text: "The current Health Vault dashboard is displayed in the widget.",
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to read health summary";
        return {
          isError: true,
          content: [{ type: "text", text: message }],
        };
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

  const vitalImportSchema = z.object({
    metric: z.enum(VITAL_METRICS),
    value: z.number().finite(),
    secondaryValue: z.number().finite().optional(),
    unit: z.string().trim().min(1).max(32),
    observedAt: z.string().datetime({ offset: true }),
    sourceRecordId: z.string().trim().max(240).optional(),
    deviceName: z.string().trim().max(160).optional(),
  });
  const healthImportSchema = z.object({
    sourceKind: z.enum(HEALTH_IMPORT_SOURCES),
    sourceName: z.string().trim().min(1).max(160),
    idempotencyKey: z.string().uuid(),
    vitals: z.array(vitalImportSchema).min(1).max(100),
  });
  server.registerTool("preview_health_data_import", {
    title: "Prepare health measurements for review",
    description: "Create a temporary review of the authenticated user's explicitly authorized vital information from ChatGPT Health, Apple Health, or a connected provider. Nothing is imported or saved to Health Vault by this action. Say that clearly, show what is new or duplicated, and stop. Never call confirm_health_data_import in the same assistant turn; wait for a new user message explicitly approving the displayed proposal.",
    inputSchema: healthImportSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _meta: { "openai/outputTemplate": HEALTH_IMPORT_WIDGET_URI, "openai/widgetAccessible": true },
  }, async (input) => { try { const preview = await previewHealthImport(supabase, userId, input); return { structuredContent: { preview }, content: [{ type: "text", text: "Nothing has been added to Health Vault. Review the measurements and source below. Adding them requires a separate confirmation from you." }] }; } catch (error) { return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : "Unable to prepare the health import." }] }; } });
  server.registerTool("confirm_health_data_import", {
    title: "Import confirmed health data",
    description: "Add the exact measurements from a current preview only after a new user message explicitly approves it. Never call this in the same assistant turn as preview_health_data_import, and never treat a request to prepare or preview as confirmation. Accept only the proposal ID; never resend or alter the health payload.",
    inputSchema: z.object({ proposalId: z.string().uuid(), confirmed: z.literal(true) }),
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    _meta: { "openai/outputTemplate": HEALTH_IMPORT_WIDGET_URI, "openai/widgetAccessible": true },
  }, async ({ proposalId }) => { try { const imported = await confirmHealthImport(supabase, proposalId); return { structuredContent: { imported }, content: [{ type: "text", text: "Your confirmed measurements are now in Health Vault." }] }; } catch (error) { return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : "Unable to import the health information." }] }; } });
  registerReadTool("list_vital_measurements", "Review vital measurements", "Review the authenticated user's imported vital measurements and their sources. Summarize trends without diagnosing or treating the user.", z.object({ days: z.number().int().min(1).max(365).default(30) }), ({ days }) => listVitalMeasurements(supabase, days));
  const clinicalRecordSchema = z.object({ recordType: z.enum(CLINICAL_RECORD_TYPES), title: z.string().trim().min(1).max(240), code: z.string().trim().max(120).optional(), status: z.string().trim().max(80).optional(), effectiveDate: z.string().date().optional(), providerName: z.string().trim().max(160).optional(), sourceRecordId: z.string().trim().max(240).optional(), details: z.record(z.string(), z.union([z.string().max(4000), z.number(), z.boolean(), z.null()])).optional() });
  server.registerTool("preview_connected_health_records_import", { title: "Review existing ChatGPT Health records", description: "Prepare a private review of medications, conditions, allergies, immunizations, labs, encounters, or documents that ChatGPT has already read from the user's existing ChatGPT Health area. Do not reconnect to or refresh the provider. The user's request authorizes this read and review, but nothing is saved to Health Vault. Stop after showing the review and wait for explicit confirmation.", inputSchema: z.object({ sourceKind: z.enum(HEALTH_IMPORT_SOURCES), sourceName: z.string().trim().min(1).max(160), idempotencyKey: z.string().uuid(), records: z.array(clinicalRecordSchema).min(1).max(100) }), annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }, _meta: { "openai/outputTemplate": CLINICAL_IMPORT_WIDGET_URI, "openai/widgetAccessible": true } }, async (input) => { try { const preview = await previewClinicalImport(supabase, userId, input); return { structuredContent: { preview }, content: [{ type: "text", text: "Nothing has been added to Health Vault. Review the records already read from ChatGPT Health, then choose whether to import them." }] }; } catch (error) { return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : "Unable to prepare the record review." }] }; } });
  server.registerTool("confirm_connected_health_records_import", { title: "Import confirmed health records", description: "Import the exact records from a current connected-health-record review only after the user explicitly approves the displayed proposal. Accept only its proposal ID; never resend or alter the records.", inputSchema: z.object({ proposalId: z.string().uuid(), confirmed: z.literal(true) }), annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }, _meta: { "openai/outputTemplate": CLINICAL_IMPORT_WIDGET_URI, "openai/widgetAccessible": true } }, async ({ proposalId }) => { try { const imported = await confirmHealthImport(supabase, proposalId); return { structuredContent: { imported }, content: [{ type: "text", text: "Your confirmed health records are now in Health Vault." }] }; } catch (error) { return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : "Unable to import the health records." }] }; } });
  registerReadTool("list_connected_health_records", "Review connected health records", "Review health records the authenticated user previously confirmed for import, including source and provider provenance.", z.object({ limit: z.number().int().min(1).max(200).default(50) }), ({ limit }) => listConnectedHealthRecords(supabase, limit));

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
        const summary = await getHealthSummary(supabase);
        return {
          structuredContent: {
            appointment,
            summary,
            recentChange: {
              title: "Appointment added",
              message: `${appointment.appointment_type} with ${appointment.provider_name} is now in Health Vault.`,
            },
          },
          content: [{ type: "text", text: "The appointment was saved and the refreshed Health Vault dashboard is displayed in the widget." }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to add appointment";
        return { isError: true, content: [{ type: "text", text: message }] };
      }
    },
  );

  return server;
}
