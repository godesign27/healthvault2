# Health Vault Mobile App

> React Native (Expo) — placeholder for Claude Code scaffold

## Status
This directory is a placeholder. The mobile app will be scaffolded from the Figma artboard.

## Shared packages available
| Package | Import | Purpose |
|---------|--------|---------|
| `@health-vault/types` | `import type { HealthRecord } from '@health-vault/types'` | TypeScript types |
| `@health-vault/api-client` | `import { HealthVaultClient } from '@health-vault/api-client'` | API calls |
| `@health-vault/config` | `import { clientEnvSchema } from '@health-vault/config'` | Env validation |

## Quick start (once scaffolded)
```bash
# From repo root
npm install
cd apps/mobile
npx expo start
```

## Auth
Use Supabase Auth. Pass the access token to `HealthVaultClient`:
```typescript
import { HealthVaultClient } from '@health-vault/api-client';
import { supabase } from './lib/supabase';

const client = new HealthVaultClient({
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  getAccessToken: () => supabase.auth.session()?.access_token ?? null,
});
```
