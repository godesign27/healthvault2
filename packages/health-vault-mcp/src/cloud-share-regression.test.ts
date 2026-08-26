import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const readWorkspaceFile = (path: string) => readFile(
  fileURLToPath(new URL(`../../../${path}`, import.meta.url)),
  "utf8",
);

test("cloud share uses the authenticated session instead of the public anon key", async () => {
  const drawer = await readWorkspaceFile("src/components/ShareFormsDrawer.tsx");
  assert.match(drawer, /import \{ supabase \} from '\.\.\/lib\/supabase'/);
  assert.match(drawer, /supabase\.auth\.getSession\(\)/);
  assert.match(drawer, /Bearer \$\{session\.access_token\}/);
  assert.doesNotMatch(drawer, /Bearer \$\{import\.meta\.env\.VITE_SUPABASE_ANON_KEY\}/);
});

test("cloud share verifies ownership and does not insert a nonexistent patient_dob column", async () => {
  const shareFunction = await readWorkspaceFile("supabase/functions/share/index.ts");
  assert.match(shareFunction, /authenticatedSupabase\.auth\.getUser/);
  assert.match(shareFunction, /patientId !== user\.id/);
  const insertBlock = shareFunction.slice(
    shareFunction.indexOf(".from('share_events')\n        .insert"),
    shareFunction.indexOf("if (insertError)"),
  );
  assert.doesNotMatch(insertBlock, /patient_dob/);
});

test("cloud share sends and reports the requested verified-patient receipt", async () => {
  const shareFunction = await readWorkspaceFile("supabase/functions/share/index.ts");
  const drawer = await readWorkspaceFile("src/components/ShareFormsDrawer.tsx");
  assert.match(shareFunction, /patientReceiptSent/);
  assert.match(shareFunction, /Your Health Vault secure-share receipt/);
  assert.match(shareFunction, /email_verified/);
  assert.match(drawer, /data\.patientReceiptSent/);
  assert.match(drawer, /Patient receipt:/);
});

test("cloud share surfaces the backend error message instead of only status 500", async () => {
  const drawer = await readWorkspaceFile("src/components/ShareFormsDrawer.tsx");
  assert.match(drawer, /data\.error/);
});

test("cloud share records delivery truthfully instead of marking failed email as delivered", async () => {
  const shareFunction = await readWorkspaceFile("supabase/functions/share/index.ts");
  assert.match(shareFunction, /status: 'sent'/);
  assert.match(shareFunction, /status: emailSent \? 'delivered' : 'sent'/);
  assert.match(shareFunction, /patientReceipt: patientReceiptSent \? 'accepted' : 'failed'/);
});
