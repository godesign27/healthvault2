import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getHealthSummary } from "./health-summary.js";
import { DASHBOARD_WIDGET_HTML, DASHBOARD_WIDGET_URI } from "./dashboard-widget.js";
import { getAllergies, getConditions, getHealthRecords, getMedications } from "./health-details.js";
import { createAppointment, previewAppointment } from "./appointments.js";

export function createHealthVaultMcpServer(supabase: SupabaseClient, userId: string): McpServer {
  const server = new McpServer(
    { name: "health-vault", version: "0.1.0" },
    {
      instructions:
        "Use Health Vault tools only for the authenticated user's records. Treat results as informational health data, not diagnosis or emergency medical advice.",
    },
  );

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
