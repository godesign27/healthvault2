# Health Vault MCP server

This package exposes authenticated, read-only Health Vault tools over MCP.

## Configuration

Set these server-only environment variables in the hosting platform:

- `SUPABASE_URL`: hosted Supabase project URL
- `SUPABASE_ANON_KEY`: public Supabase publishable/anonymous key
- `PORT`: optional HTTP port (defaults to `8787`)
- `MCP_PUBLIC_URL`: public HTTPS server origin after deployment

Never configure a Supabase service-role key for this server. Each request must
provide the signed-in user's Supabase access token as a Bearer token. Database
queries use that token so Supabase Row Level Security restricts results to that
user.

## Run

```sh
npm run dev --workspace @health-vault/mcp-server
```

The MCP endpoint is `POST /mcp`; `GET /health` is an unauthenticated liveness
check. OAuth protected-resource metadata is served from
`/.well-known/oauth-protected-resource` and points clients to Supabase Auth.

Before connecting ChatGPT, enable the Supabase OAuth 2.1 server, configure the
Health Vault authorization/consent page, enable dynamic client registration,
and use the deployed HTTPS origin for `MCP_PUBLIC_URL`.

## Supabase Edge Function deployment

The production MCP endpoint is implemented by the `health-vault-mcp` Supabase
Edge Function. Supabase automatically provides the project URL and anonymous
key to the function runtime; no additional hosting variables or DNS records are
required. Deploy it without gateway JWT verification so unauthenticated clients
can read its OAuth protected-resource metadata and receive the correct
`WWW-Authenticate` challenge. The function validates every Bearer token itself
with Supabase Auth before querying through Row Level Security.

```sh
supabase functions deploy health-vault-mcp --no-verify-jwt
```

Use the deployed function URL as the MCP server URL in ChatGPT. Never configure
a service-role key for this function.

The repository's `supabase/config.toml` sets `verify_jwt = false` for this
function. Preserve that setting when deploying through the management API or
dashboard too: gateway verification blocks unauthenticated OAuth discovery and
the function's `WWW-Authenticate` challenge. The function itself still rejects
missing or invalid user tokens before creating the MCP server.

Deployment smoke checks: an unauthenticated GET must return OAuth metadata
(HTTP 200); an unauthenticated POST must return HTTP 401 with the
`WWW-Authenticate` header. Then verify an authenticated `get_health_summary`
call through the connector; passing the public checks alone does not establish
that the connector is working end to end.

## Dashboard widget verification

The dashboard uses `text/html;profile=mcp-app` and `_meta.ui.resourceUri`,
with the legacy OpenAI output-template alias retained. It supports both the
standard MCP Apps initialization/tool-result messages and `openai:set_globals`.
Keep standard and legacy CSP origins identical when updating the registration.

Run the bridge regression checks with Node 24:

```sh
node --test packages/health-vault-mcp/src/dashboard-widget.test.ts
```

After changing a widget resource URI, refresh Health Vault in ChatGPT's plugin
settings and test in a new conversation. Existing installations may keep the
previous tool metadata and template until refreshed. A successful tool call
alone does not prove the iframe rendered; verify the visible dashboard too.

## Confirmation checks

Run all package regression tests with Node 24 from the repository root:

```sh
node --test packages/health-vault-mcp/src/*.test.ts
```

Diet previews contain nullable display fields; save inputs must omit absent
optional values and preview-only metadata. Tests exercise the actual preview
formatter through both host interfaces. Never automatically retry a mutation
after an ambiguous response or use real health writes as test fixtures.

See [the release review](RELEASE_REVIEW.md) for verified production behavior,
remaining confirmation-button findings, and CSP testing still required.
