# HealthVault

HealthVault is a patient-centered health information platform with an embedded AI assistant. Users manage medical forms, health records, insurance, care providers, pharmacies, medications, and medical profiles through a modern web interface. The AI assistant actively guides users through health tasks -- it is a context-aware orchestration system, not a passive chatbot.

---

## Monorepo structure

```
health-vault/
├── src/                          # Web app source (React 18 + Vite)
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── pages/
├── packages/
│   ├── types/                    # @health-vault/types
│   │   └── src/index.ts          # Canonical TypeScript interfaces
│   ├── api-client/               # @health-vault/api-client
│   │   └── src/
│   │       ├── client.ts         # HealthVaultClient class
│   │       └── index.ts
│   ├── auth/                     # @health-vault/auth
│   │   └── src/
│   │       ├── biometric.ts      # Biometric gate + PIN with lockout
│   │       └── index.ts
│   └── config/                   # @health-vault/config
│       └── src/
│           ├── env.ts            # Zod env validation schemas
│           └── index.ts
├── apps/
│   └── mobile/                   # @health-vault/mobile (Expo placeholder)
├── supabase/
│   └── functions/                # Supabase Edge Functions (Deno)
│       ├── ai-health-assistant/
│       ├── analyze-record/
│       ├── vault-stats/
│       ├── record-request/
│       ├── share/
│       ├── trigger-ehr-fetch/
│       └── inbound-records/
├── api-collection.json           # Postman v2.1 collection
├── package.json                  # npm workspaces root
└── vite.config.ts
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| Edge Functions runtime | Deno |
| AI | OpenAI Chat Completions API (gpt-4o-mini) with function calling |
| EHR integration | Keragon |
| Validation | Zod |
| Icons | Lucide React |
| Package manager | npm workspaces |
| Mobile (planned) | React Native via Expo |

---

## Local development

```bash
# Install all workspace dependencies
npm install

# Start the web app (hot reload)
npm run dev

# Type-check without emitting
npm run typecheck

# Lint
npm run lint
```

Copy `.env.example` to `.env` and fill in your Supabase credentials before running.

---

## Shared packages

These packages live in `packages/` and are consumed by the web app, mobile app, and edge functions via npm workspaces and TypeScript path aliases.

| Package | Purpose |
|---------|---------|
| `@health-vault/types` | Canonical TypeScript interfaces: `HealthRecord`, `PendingRequest`, `EHRConnection`, `VaultStats`, `UserProfile`, `ApiResponse<T>`, etc. |
| `@health-vault/api-client` | `HealthVaultClient` — platform-agnostic fetch-based client for Supabase REST and Edge Functions. Works in React Native (no Node APIs). |
| `@health-vault/auth` | Biometric gate (`authenticateWithVault`) + PIN management (`setPin`, `verifyPin`, `hasPin`) with 3-attempt lockout. Mobile only (`expo-local-authentication`, `expo-secure-store`). |
| `@health-vault/config` | Zod schemas for validating environment variables (`envSchema` for edge functions, `clientEnvSchema` for the web/mobile frontend) |

### Using the API client

```typescript
import { HealthVaultClient } from '@health-vault/api-client';

const client = new HealthVaultClient({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  getAccessToken: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  },
  onTokenExpired: async () => {
    await supabase.auth.refreshSession();
  },
});

const { items } = await client.listRecords({ kind: 'lab', page: 1 });
const stats = await client.getStats();
```

---

## Supabase Edge Functions

All backend logic runs as Deno-based Edge Functions. There is no Express server.

| Function | Method | Auth | Purpose |
|----------|--------|------|---------|
| `ai-health-assistant` | POST | User JWT | Main AI orchestration — multi-turn tool execution loop using OpenAI function calling |
| `vault-stats` | GET | User JWT | Returns dashboard statistics: total records, connected providers, pending requests, last sync time |
| `analyze-record` | POST | User JWT | Generates a plain-language AI summary for a health record using GPT-4o-mini (falls back to rule-based summary) |
| `share` | POST | User JWT | Shares a record with another user or provider by email |
| `record-request` | POST | User JWT | Sends an email to a provider requesting records on the patient's behalf |
| `trigger-ehr-fetch` | POST | User JWT | Triggers a manual EHR sync via Keragon for a connected provider |
| `inbound-records` | POST | Service Role | Ingests records from external systems (Keragon webhook); also handles `/upload` for file uploads |

---

## Environment variables

### Web app (`.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous (public) key |
| `VITE_OPENAI_API_KEY` | No | OpenAI API key (client-side usage only) |

### Supabase Edge Functions (set via `supabase secrets set`)

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Injected automatically by Supabase runtime |
| `SUPABASE_ANON_KEY` | Yes | Injected automatically by Supabase runtime |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Injected automatically by Supabase runtime |
| `OPENAI_API_KEY` | No | OpenAI key for AI record summaries and assistant (`sk-...`) |
| `KERAGON_WEBHOOK_URL` | No | Keragon webhook endpoint for EHR sync |
| `APP_URL` | No | Canonical app URL (default: `https://healthvault27.com`) |
| `NODE_ENV` | No | `development` / `test` / `production` |

---

## Mobile app

The `apps/mobile/` directory is a placeholder for the React Native (Expo) mobile app.

It shares `@health-vault/types` and `@health-vault/api-client` with the web app. The `HealthVaultClient` uses only standard `fetch` and `FormData` APIs, making it fully compatible with React Native without modification.

See [`apps/mobile/README.md`](./apps/mobile/README.md) for setup instructions once the Expo scaffold is generated.

---

## Product Areas

| Area | Description |
|------|-------------|
| **Dashboard** | Overview of health status, recent activity, next-best-action suggestions |
| **Medical Forms** | Complete, save, and share medical questionnaires (FHIR-backed) |
| **Health Records** | View, filter, search, summarize, and request lab results, imaging, pathology, and specialist reports |
| **Insurance** | Manage coverages, search providers/plans, set primary, verify benefits |
| **Care Network** | Save and search doctors, specialists, and pharmacies; add providers; set preferred pharmacy |
| **Medical Profile** | Conditions, medications, allergies, immunizations, profile completion tracking |
| **Care Management** | Care team relationships, care timeline, health overview, medication refill checks |
| **Current Health / Vitals** | Track vital signs and health metrics (planned) |

---

## AI Assistant Architecture

```
Frontend (React)           Edge Function (Deno)           OpenAI
  |                              |                          |
  |--- ChatRequest ------------>|                          |
  |                              |--- system prompt ------->|
  |                              |--- 26 tool definitions ->|
  |                              |--- user message -------->|
  |                              |                          |
  |                              |<-- tool call request ----|
  |                              |                          |
  |                              |--- execute tool (DB) --->|
  |                              |--- tool result --------->|
  |                              |    (loop up to 5 rounds) |
  |                              |                          |
  |                              |<-- assistant response ---|
  |<-- ChatResponse ------------|                          |
```

**OpenAI** handles reasoning and tool selection. It never touches the database directly.

**HealthVault backend** (Supabase edge function) is the source of truth. It authenticates users, validates tool inputs, executes database queries, and returns results.

**Frontend** sends the user message with page context, receives the assistant response, and renders it.

---

## Tooling Structure

### Backend Tool Handlers (26 tools)

`src/lib/ai-tools/` -- Zod-validated handlers organized by domain:

| File | Tools |
|------|-------|
| `medical-history.ts` | getMedicalHistory |
| `forms.ts` | getIncompleteForms, openForm, saveFormAnswers, shareForm |
| `records.ts` | getHealthRecords, getHealthRecordRequests, summarizeRecord, requestHealthRecord, deleteHealthRecordRequest |
| `insurance.ts` | searchInsuranceProvider, getUserCoverages, setPrimaryInsurance, verifyInsurance |
| `network.ts` | searchInNetworkProviders, searchPharmacies, addProvider, setPreferredPharmacy |
| `medications.ts` | getMedications, summarizeMedication, checkRefillStatus |
| `care.ts` | getCareTeam, getCareTimeline, getCareOverview |
| `profile.ts` | getMedicalProfile, updateMedicalProfile |
| `registry.ts` | Central registry, Zod-to-JSON-Schema converter, `executeTool()` |
| `types.ts` | Shared types (`ToolResult`, `ToolDefinition`) |

### Edge Function (Server-Side Orchestration)

`supabase/functions/ai-health-assistant/`:
- `index.ts` -- Main orchestration with multi-turn tool execution loop (max 5 rounds)
- `tools.ts` -- 26 tool definitions with OpenAI function schemas and server-side handlers
- `system-prompt.ts` -- Context-aware system prompt with per-page behavior models
- `types.ts` -- Shared types for the edge function
- `logger.ts` -- Structured JSON logging (request, tool calls, errors, responses)

### Frontend Client

`src/lib/openai/`:
- `client.ts` -- `sendChatMessage()` function
- `context.ts` -- `buildPageContext()` page context builder with `PageId` types
- `types.ts` -- `ChatRequest`, `ChatResponse`, `ToolEvent`, `ConversationMessage`

---

## Documentation Map

All assistant documentation lives in `docs/ai-assistant/`:

| Document | Purpose |
|----------|---------|
| `assistant-system.md` | Assistant role, capabilities, restrictions, safety rules |
| `conversation-rules.md` | 26 rules governing response style, data integrity, confirmations, medical safety |
| `product-map.md` | Maps product areas to tools, typical tasks, and assistant behavior |
| `task-flows.md` | Step-by-step flows for key user tasks |
| `assistant-flows.md` | 10 detailed assistant-driven workflow definitions |
| `assistant-scripts.md` | Tone guidelines and example scripts per page |
| `page-context-prompts.md` | Page-to-behavior mapping with context signals |
| `tools-registry.md` | Complete reference of all 26 tools with inputs/outputs |
| `tool-contracts.md` | Formal input/output contracts for each tool |
| `openai-integration.md` | How the OpenAI orchestration works end-to-end |
| `tool-exposure-map.md` | Maps each OpenAI tool name to its backend handler |
| `realtime-readiness.md` | What is reusable for voice and what still needs building |

Root governance: `AGENT_INSTRUCTIONS.md`

---

## Development Principles

1. **Backend is source of truth.** All data reads and writes go through backend tool handlers.
2. **Do not duplicate logic.** The edge function and frontend registry serve different contexts but follow the same contracts.
3. **Prefer evolution over replacement.** Extend existing files rather than creating parallel systems.
4. **Never fake success.** Tool results must reflect actual database outcomes.
5. **Validate inputs.** Zod schemas in the frontend; JSON parsing in the edge function.
6. **Keep responses concise.** 1-3 sentences for simple answers. No filler.
7. **Require confirmation for mutations.** Sharing, adding providers, setting primary insurance, updating profiles.
8. **Medical safety.** Summaries must be factual. No diagnoses, treatment recommendations, or clinical interpretations.
9. **Be proactive.** The assistant guides users forward -- it does not wait passively.

---

## API testing

Import `api-collection.json` into Postman. Set the `baseUrl` collection variable to your Supabase project URL and run the **Login** request first — it automatically saves the access token for all subsequent requests.

---

## Changelog

### 2026-05-10 — Mobile backend prep fixes

- **`packages/api-client`** — `getAccessToken` is now `async () => Promise<string | null>` (Supabase JS v2 compatible). Added optional `onTokenExpired` callback. Added automatic 401 retry once (calls `onTokenExpired` if provided, then retries) in both `restGet` and `fn`. All inline token reads are now awaited.
- **`packages/auth`** — New package `@health-vault/auth`. Exports `getBiometricSupport`, `promptBiometric`, `authenticateWithVault`, `setPin`, `hasPin`, `verifyPin`. PIN is SHA-256 hashed and stored in `expo-secure-store`. Failed PIN attempts lock the vault for 60 seconds after 3 failures.
- **`packages/types`** — `RecordKind` is now the single source of truth. `RecordType` is retained as a `@deprecated` alias (`type RecordType = RecordKind`) to avoid breaking web/desktop imports.

---

## Next Planned Milestones

- Full page/screen context ingestion for richer assistant awareness
- Frontend assistant wiring improvements (tool event rendering, action callbacks, drawer triggers)
- Realtime Talk button integration using the existing tool handler layer
- Admin monitoring, logging dashboard, and usage analytics
- Conversation persistence
- External provider directory search (NPI registry)
- Lab result interpretation with safety guardrails
- Mobile app scaffold (Expo) from Figma artboard
