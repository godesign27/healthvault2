# Health Vault — Mobile (Expo)

Expo SDK 51 + Expo Router + NativeWind v4 + Supabase.

## Setup

1. From repo root, install workspaces:

   ```bash
   npm install
   ```

2. Create `apps/mobile/.env` (not committed) with values from the web app `.env`:

   ```env
   EXPO_PUBLIC_SUPABASE_URL=<same as VITE_SUPABASE_URL>
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<same as VITE_SUPABASE_ANON_KEY>
   ```

3. Start Expo (pick one):

   **From the repo root** (works even if `cd apps/mobile` fails or paths confuse your shell):

   ```bash
   npm run mobile
   ```

   Then press **`i`** for the iOS Simulator, or run the simulator directly:

   ```bash
   npm run mobile:ios
   ```

   **From `apps/mobile`** (you are already here if your prompt ends in `mobile %`):

   ```bash
   npm start
   ```

   Same thing, explicit names (also work in this folder now):

   ```bash
   npm run mobile
   npm run mobile:ios
   ```

   Do **not** run `cd apps/mobile` again from inside `apps/mobile` — that path does not exist here. If you need the repo root, use `cd ../..`.

   Each `npm start` / `npm run ios` runs a small **pre** script that fixes the NativeWind Babel `worklets` issue so a fresh install still bundles.

4. **“Port 8081 is already in use”** — another Metro/Expo is still running. Either close that terminal (`Ctrl+C`) or start on another port from the repo root:

   ```bash
   npm run mobile:8083
   ```

   (Then press **`i`** in that terminal for the simulator.)

## Structure

- `app/` — Expo Router routes (`(tabs)`, `auth`)
- `src/components` — UI, layout, assistant, records
- `src/lib` — Supabase + `HealthVaultClient`
- `src/hooks` — `useAuth`, `useRecords`, `useVaultStats`

## Notes

- Root `npm install` runs `scripts/patch-react-native-css-interop.cjs` so NativeWind’s `react-native-css-interop@0.2.3` does not require `react-native-worklets` (that path targets Reanimated 4+; this app uses Reanimated 3 on Expo 51).
- Replace `assets/icon.png` and `assets/splash.png` with production artwork when ready.
- Tab order matches web IA: Dashboard → Care → Network → Records → Medical.
