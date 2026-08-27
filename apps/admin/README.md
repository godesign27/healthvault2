# Health Vault Admin

Dedicated administration application for product analytics and platform operations.

## Current foundation

- Supabase sign-in with fail-closed administrator assignment checks.
- Product-scoped navigation for the GPT App.
- Reserved SaaS Cloud boundary.
- Independently permissioned Provider Operations boundary.

The application does not grant administrator access automatically. Apply the admin-platform migration and provision the first `platform_owner` through an approved service-role or Supabase administrative workflow.

## Local development

From the repository root:

```bash
npm install
npm run admin:dev
```

Open `http://localhost:5174`.

Local development reads the existing repository-root `.env`. Do not open
`apps/admin/index.html` directly; Vite must serve the TypeScript application.

## Verification

```bash
npm run admin:typecheck
npm run admin:build
```

The admin frontend must never use the Supabase service-role key. Future analytics and provider mutations belong behind role-aware Edge Functions or database RPCs.
