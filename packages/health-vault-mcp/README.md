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
