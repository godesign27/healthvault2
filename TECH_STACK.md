# Health Vault — Tech Stack

AI-powered personal health records platform. npm-workspaces monorepo with a **web app**, a
**mobile app**, shared **packages**, and a **Supabase** backend.

---

## Monorepo layout

```
HealthVault/
├── src/                     # Web app (Vite + React 18) — root package
├── apps/
│   └── mobile/              # Mobile app (Expo / React Native)
├── packages/
│   ├── types/               # @health-vault/types — shared TS types
│   ├── api-client/          # @health-vault/api-client — shared API client
│   ├── auth/                # @health-vault/auth
│   └── config/              # @health-vault/config
├── supabase/
│   └── functions/           # Deno Edge Functions (shared backend)
├── scripts/                 # build/runtime helper scripts
└── docs/                    # ai-assistant + feature docs
```

Workspaces (root `package.json`): `packages/*`, `apps/mobile`.
Package manager: **npm** (root `package-lock.json`; `packageManager` pins yarn but npm is used in practice).

---

## Web app (root)

- **Build:** Vite 5 (`npm run dev` → `http://localhost:5173`)
- **UI:** React 18.2 + TypeScript 5.5
- **Styling:** Tailwind CSS 3.4 + PostCSS/Autoprefixer
- **Design system:** CSS custom properties with `--hv-*` tokens; surface themes
  (Default, Bold, **Steel** = default). Optional `@radix-ui/*` components.
- **Icons:** `lucide-react`
- **Other:** `sonner` (toasts), `vaul` (drawers), `zod` (validation), `openai`
- **AI Assistant:** OpenAI-powered, context-aware assistant embedded in the authenticated
  product (see "AI Assistant (OpenAI)" below).
- Note: Vite binds IPv6 loopback `[::1]` by default → use `http://localhost:5173`
  (`127.0.0.1` is refused unless `server.host` is set).

## Mobile app (`apps/mobile`)

- **Framework:** Expo SDK **51** + Expo Router 3.5
- **Runtime:** React Native **0.74.5**, React 18.2
- **Styling:** NativeWind 4 (Tailwind for RN) via `react-native-css-interop` (patched)
- **Animation/gesture:** Reanimated 3.10.1, gesture-handler, react-native-screens,
  safe-area-context **4.10.1** (pinned for SDK 51)
- **Auth/session:** `@supabase/supabase-js` + **AsyncStorage** (session persistence) +
  `react-native-url-polyfill`. `expo-secure-store` / `expo-local-authentication` available
  for PIN/biometric lock.
- **Native modules:** image-picker, document-picker, haptics, constants, font, dev-client
- **Icons:** `@expo/vector-icons` (Ionicons)
- **Dev build:** uses a **dev client** (Expo Go is not sufficient — native modules).
  Start: from `apps/mobile`, `npm start`; build native: `npx expo run:ios`.
- **Important:** after adding any native dependency, the dev client must be rebuilt
  (`pod install` + `npx expo run:ios`).

## AI Assistant (OpenAI)

The authenticated **web/desktop app** ships an OpenAI-powered assistant that helps users
manage their health info (forms, records, insurance, care network) and can read/write data
through validated backend tools. Full docs live in `docs/ai-assistant/`.

- **Model:** `gpt-4o-mini` via OpenAI **Chat Completions API** with **function calling**
  (`tool_choice: auto`, up to **5** tool rounds; final round omits tools to force text).
- **Backend:** Edge Function `supabase/functions/ai-health-assistant/`
  - `index.ts` (auth + tool loop orchestration), `tools.ts` (**11** tool handlers + OpenAI
    schemas), `system-prompt.ts` (role + safety + page context), `types.ts`, `logger.ts`.
  - Authenticates the Supabase JWT; every tool handler runs scoped to the authenticated
    `userId` (ownership enforced via RLS). The OpenAI API key lives server-side in the
    function env — never in the client.
- **Frontend client:** `src/lib/openai/` — `client.ts` (`sendChatMessage()` calls the Edge
  Function), `context.ts` (`buildPageContext()` packages current-screen state), `types.ts`,
  `index.ts`. UI: `AIAssistantPanel`.
- **Page-aware:** the assistant receives `pageContext` for the current screen
  (dashboard, medical-forms, health-records, insurance, medical-profile, care, network,
  vitals) so answers stay relevant.
- **Safety:** no diagnoses/clinical advice; never fabricates data or tool results; mutations
  (save/share) require explicit user confirmation (`confirmed: true`).
- **Returns:** `ChatResponse { message, toolEvents?, error? }` — `toolEvents` give per-tool
  observability (input, success, duration).
- **Related functions:** `transcribe-audio`, `elevenlabs-tts` (voice); realtime voice is not
  yet wired (see `docs/ai-assistant/realtime-readiness.md`).
- **Mobile status:** `AssistantSheet.tsx` exists but is **not** yet wired to this backend.

## Shared packages

- `@health-vault/types`, `@health-vault/api-client`, `@health-vault/auth`,
  `@health-vault/config` — consumed by both web and mobile via path aliases
  (see `vite.config.ts` and the mobile babel/tsconfig).

## Backend — Supabase

- **Project:** `bolt-native-database-59699130` · ref **`sgwekxjlvadvdosyudgj`**
- **Auth:** Supabase Auth (email). Mobile passes `Authorization: Bearer <access_token>` +
  `apikey` + `X-Platform: mobile` to functions.
- **Database:** Postgres. Key tables: `user_profiles`, `patient_profiles`,
  `health_records` (kind ∈ lab|imaging|pathology|specialist_report|other), `medications`,
  `provider_connections` (+ `provider_organizations`), `health_record_requests`,
  conditions/allergies/immunizations.
- **Edge Functions (Deno)** in `supabase/functions/`:
  `vault-stats`, `records`, `records-import`, `record-request`, `inbound-records`,
  `providers`, `share`, `sync-status`, `analyze-record`, `add-condition`,
  `ai-health-assistant`, `transcribe-audio`, `elevenlabs-tts`, `welcome-email`.
- **Mobile data access:** two paths —
  1. Edge Functions via `src/lib/api.js` (`/functions/v1/...`) — e.g. stats, records, providers.
  2. Direct PostgREST via `src/lib/supabase.js` — e.g. Medical Profile, provider connections.
- **CLI deploys:** `npx supabase login` → `link --project-ref sgwekxjlvadvdosyudgj` →
  `functions deploy <name>`.

## Environment variables

- **Web:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (in root `.env`).
- **Mobile:** `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  (in `apps/mobile/.env`, not committed).

## Tooling

- TypeScript, ESLint (web: `eslint .`, mobile: `expo lint`)
- Helper scripts: `scripts/patch-react-native-css-interop.cjs` (NativeWind worklets fix,
  runs on install + pre-start), `scripts/expo-with-fd-limit.sh` (raises file-descriptor
  limit for Metro).

---

_Last updated: 2026-06-05_
