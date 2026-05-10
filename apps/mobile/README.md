# Health Vault Mobile App

> React Native (Expo) — placeholder for Claude Code scaffold
> UI will be scaffolded from the Figma artboard.

## Status

This directory is a placeholder. The shared backend layer is fully wired and ready for the Expo app to be built on top of it.

## Environment Variables

Create `apps/mobile/.env` (or use Expo's `app.config.js`):

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Quick Start (once scaffolded)

```bash
# From repo root
npm install
cd apps/mobile
npx expo start          # iOS + Android dev server on :8081
npx expo start --ios    # iOS simulator
npx expo start --android
```

## Shared Packages

| Package | Import | Purpose |
|---------|--------|---------|
| `@health-vault/types` | `import type { HealthRecord } from '@health-vault/types'` | Canonical TypeScript types |
| `@health-vault/api-client` | `import { HealthVaultClient } from '@health-vault/api-client'` | All API calls |
| `@health-vault/config` | `import { clientEnvSchema } from '@health-vault/config'` | Env validation |
| `@health-vault/auth` | `import { authenticateWithVault, verifyPin } from '@health-vault/auth'` | Biometric + PIN auth gate |

## Client Setup

```typescript
import { createClient } from '@supabase/supabase-js';
import { HealthVaultClient } from '@health-vault/api-client';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

export const api = new HealthVaultClient({
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  getAccessToken: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  },
  onTokenExpired: async () => {
    await supabase.auth.refreshSession();
  },
});
```

## Auth

Authentication uses Supabase Auth directly — no custom JWT handling needed.

```typescript
// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});

// Sign out
await supabase.auth.signOut();

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
  (async () => {
    if (event === 'SIGNED_IN') {
      // session.access_token is automatically picked up by HealthVaultClient
    }
  })();
});
```

## Biometric Auth (Face ID / Touch ID / PIN)

Every screen requiring vault access must pass the biometric gate. Biometric is tried first; failure falls back to PIN entry.

```typescript
import { authenticateWithVault, verifyPin, setPin, hasPin } from '@health-vault/auth';

// 1. On app foreground / any sensitive action:
const biometricPassed = await authenticateWithVault();
if (!biometricPassed) {
  // Show <PinEntryScreen /> — it calls verifyPin(pin) on submit
}

// 2. PIN entry screen:
const result = await verifyPin(enteredPin);
if (result.success) { /* proceed */ }
if (result.lockedUntil) { /* show countdown — locked for 60s after 3 failures */ }
if (result.attemptsLeft !== undefined) { /* show "X attempts remaining" */ }

// 3. First-time setup (after Supabase sign-in):
const pinAlreadySet = await hasPin();
if (!pinAlreadySet) { /* show <SetPinScreen /> */ }
await setPin('1234'); // stores SHA-256 hash in SecureStore
```

**Note:** `@health-vault/auth` depends on `expo-local-authentication` and `expo-secure-store`. These are Expo modules — install them in the mobile app:

```bash
npx expo install expo-local-authentication expo-secure-store
```

## RecordKind

**Always use `record.kind` and type `RecordKind`** in mobile code. `RecordType` is a deprecated alias kept for web/desktop backward compatibility.

```typescript
import type { RecordKind, HealthRecord } from '@health-vault/types';

const labRecords = await api.listRecords({ kind: 'lab' });
```

Valid `RecordKind` values: `'lab' | 'imaging' | 'pathology' | 'specialist_report' | 'other'`

## Available API Methods

### Records
```typescript
await api.listRecords({ kind: 'lab', page: 1, pageSize: 20 });
await api.getRecord(id);
await api.createRecord({ title, kind, providerName, serviceDate, tags });
await api.updateRecord(id, { title, tags });
await api.deleteRecord(id);
await api.analyzeRecord(id);          // AI summary
await api.shareRecord(id, email);
await api.importRecord(id);           // mark shared record as imported
await api.uploadRecord({ file, fileName, kind, title });
```

### Providers
```typescript
await api.listProviders();
await api.connectProvider({ ehrSource, ehrPatientId, providerName });
await api.disconnectProvider(id);
await api.triggerSync(connectionId);
await api.getSyncStatus();
```

### Stats
```typescript
await api.getStats(); // { totalRecords, connectedProviders, pendingRequests, lastSyncedAt }
```

## Mobile Headers

Include `X-Platform: mobile` on all requests for analytics. The `HealthVaultClient`
can be extended to add this automatically:

```typescript
// Subclass to inject platform header on all requests
class MobileClient extends HealthVaultClient {
  // Pass X-Platform via custom fetch wrapper when needed
}
```

## CORS Origins (already configured on all Edge Functions)

- `http://localhost:8081` — Expo dev server
- `http://localhost:19000` — Expo Go
- `exp://` — Expo deep link scheme
- All origins are allowed via `Access-Control-Allow-Origin: *`
