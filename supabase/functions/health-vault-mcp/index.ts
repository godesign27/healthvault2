import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { McpServer } from "npm:@modelcontextprotocol/sdk@1.25.3/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "npm:@modelcontextprotocol/sdk@1.25.3/server/webStandardStreamableHttp.js";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.112.3";
import { z } from "npm:zod@4.1.13";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/health-vault-mcp`;

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
  const [profile, conditions, medications, allergies, records, appointments] =
    await Promise.all([
      supabase.from("user_profiles").select("first_name, last_name").maybeSingle(),
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
    ]);

  assertSuccessful("profile", profile);
  assertSuccessful("conditions", conditions);
  assertSuccessful("medications", medications);
  assertSuccessful("allergies", allergies);
  assertSuccessful("health records", records);
  assertSuccessful("appointments", appointments);

  const medicationRows = (medications.data ?? []) as Array<{ end_date: string | null }>;
  const profileRow = profile.data as { first_name?: string; last_name?: string } | null;
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
  };
}

function createHealthVaultMcpServer(supabase: SupabaseClient): McpServer {
  const server = new McpServer(
    { name: "health-vault", version: "0.1.0" },
    {
      instructions:
        "Use Health Vault tools only for the authenticated user's records. Treat results as informational health data, not diagnosis or emergency medical advice.",
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
    },
    async () => {
      try {
        const summary = await getHealthSummary(supabase);
        return {
          structuredContent: { summary },
          content: [{ type: "text", text: JSON.stringify(summary) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to read health summary";
        return { isError: true, content: [{ type: "text", text: message }] };
      }
    },
  );

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

  const server = createHealthVaultMcpServer(supabase);
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
