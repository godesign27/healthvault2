import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getHealthSummary } from "./health-summary.js";

export function createHealthVaultMcpServer(supabase: SupabaseClient): McpServer {
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
          content: [
            {
              type: "text",
              text: JSON.stringify(summary),
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

  return server;
}
