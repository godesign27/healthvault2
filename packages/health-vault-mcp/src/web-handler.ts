import { createClient } from "@supabase/supabase-js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { loadConfig } from "./config.js";
import { createHealthVaultMcpServer } from "./server.js";

function jsonResponse(body: unknown, status = 200, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...headers,
    },
  });
}

function readBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export function handleProtectedResourceMetadata(): Response {
  const config = loadConfig();
  return jsonResponse({
    resource: `${config.MCP_PUBLIC_URL}/mcp`,
    authorization_servers: [`${config.SUPABASE_URL}/auth/v1`],
    bearer_methods_supported: ["header"],
    scopes_supported: ["openid", "email", "profile"],
  });
}

export async function handleMcpRequest(request: Request): Promise<Response> {
  const config = loadConfig();
  if (request.method !== "POST") {
    return jsonResponse(
      { error: "This stateless MCP endpoint accepts POST requests" },
      405,
      { allow: "POST" },
    );
  }

  const accessToken = readBearerToken(request);
  if (!accessToken) {
    return jsonResponse(
      { error: "A valid Health Vault access token is required" },
      401,
      {
        "www-authenticate":
          `Bearer resource_metadata="${config.MCP_PUBLIC_URL}/.well-known/oauth-protected-resource"`,
      },
    );
  }

  const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    return jsonResponse(
      { error: "A valid Health Vault access token is required" },
      401,
      {
        "www-authenticate":
          `Bearer resource_metadata="${config.MCP_PUBLIC_URL}/.well-known/oauth-protected-resource"`,
      },
    );
  }

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
  } catch (requestError) {
    console.error(
      "MCP request failed",
      requestError instanceof Error ? requestError.message : "Unknown error",
    );
    return jsonResponse({ error: "MCP request failed" }, 500);
  } finally {
    await transport.close();
    await server.close();
  }
}
