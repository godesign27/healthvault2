import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { authenticateRequest } from "./auth.js";
import { loadConfig } from "./config.js";
import { createHealthVaultMcpServer } from "./server.js";

const config = loadConfig();
const app = express();

app.disable("x-powered-by");
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ status: "ok", service: "health-vault-mcp" });
});

app.get("/.well-known/oauth-protected-resource", (_request, response) => {
  response.json({
    resource: `${config.MCP_PUBLIC_URL}/mcp`,
    authorization_servers: [`${config.SUPABASE_URL}/auth/v1`],
    bearer_methods_supported: ["header"],
    scopes_supported: ["openid", "email", "profile"],
  });
});

app.post("/mcp", async (request, response) => {
  const authenticated = await authenticateRequest(request, config);
  if (!authenticated) {
    response.setHeader(
      "WWW-Authenticate",
      `Bearer resource_metadata="${config.MCP_PUBLIC_URL}/.well-known/oauth-protected-resource"`,
    );
    response.status(401).json({ error: "A valid Health Vault access token is required" });
    return;
  }

  const server = createHealthVaultMcpServer(authenticated.supabase, authenticated.user.id);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  response.on("close", () => {
    void transport.close();
    void server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(request, response, request.body);
  } catch (error) {
    console.error("MCP request failed", error instanceof Error ? error.message : "Unknown error");
    if (!response.headersSent) {
      response.status(500).json({ error: "MCP request failed" });
    }
  }
});

app.all("/mcp", (_request, response) => {
  response.status(405).json({ error: "This stateless MCP endpoint accepts POST requests" });
});

app.listen(config.PORT, "0.0.0.0", () => {
  console.log(`Health Vault MCP server listening on port ${config.PORT}`);
});
