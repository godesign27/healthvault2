import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { normalizeHealthImport } from "./health-imports.js";
import { HEALTH_IMPORT_WIDGET_HTML, HEALTH_IMPORT_WIDGET_URI } from "./health-import-widget.js";

const migration = readFileSync(new URL("../../../supabase/migrations/20260908090000_create_patient_health_imports.sql", import.meta.url), "utf8");
const serverSource = readFileSync(new URL("./server.ts", import.meta.url), "utf8");

const base = {
  sourceKind: "chatgpt_health_apple_health" as const,
  sourceName: "Apple Health",
  idempotencyKey: "62f338e5-9545-40e9-b344-31b0e702f185",
};

test("normalizes a user-authorized vital and produces a stable fingerprint", async () => {
  const input = { ...base, vitals: [{ metric: "heart_rate" as const, value: 68, unit: "bpm", observedAt: "2026-09-08T12:00:00-06:00", sourceRecordId: "sample-1" }] };
  const first = await normalizeHealthImport(input);
  const second = await normalizeHealthImport(input);
  assert.equal(first.vitals[0].observedAt, "2026-09-08T18:00:00.000Z");
  assert.equal(first.vitals[0].fingerprint, second.vitals[0].fingerprint);
});

test("requires both blood-pressure values", async () => {
  await assert.rejects(() => normalizeHealthImport({ ...base, vitals: [{ metric: "blood_pressure", value: 120, unit: "mmHg", observedAt: "2026-09-08T12:00:00Z" }] }), /requires both systolic and diastolic/);
});

test("rejects incompatible units before any proposal is stored", async () => {
  await assert.rejects(() => normalizeHealthImport({ ...base, vitals: [{ metric: "oxygen_saturation", value: 98, unit: "bpm", observedAt: "2026-09-08T12:00:00Z" }] }), /not a supported unit/);
});

test("rejects future measurements", async () => {
  await assert.rejects(() => normalizeHealthImport({ ...base, vitals: [{ metric: "steps", value: 1000, unit: "count", observedAt: "2099-01-01T00:00:00Z" }] }), /cannot be dated in the future/);
});

test("keeps abnormal but plausible measurements available for patient review", async () => {
  const result = await normalizeHealthImport({ ...base, vitals: [{ metric: "heart_rate", value: 220, unit: "bpm", observedAt: "2026-09-08T12:00:00Z" }] });
  assert.equal(result.vitals[0].value, 220);
});

test("rejects malformed values without classifying the patient's health", async () => {
  await assert.rejects(() => normalizeHealthImport({ ...base, vitals: [{ metric: "oxygen_saturation", value: 980, unit: "%", observedAt: "2026-09-08T12:00:00Z" }] }), /outside the supported measurement range/);
});

test("rejects duplicate measurements inside one proposal", async () => {
  const measurement = { metric: "steps" as const, value: 5000, unit: "count", observedAt: "2026-09-08T12:00:00Z" };
  await assert.rejects(() => normalizeHealthImport({ ...base, vitals: [measurement, measurement] }), /appears more than once/);
});

test("confirmation is owner-scoped, stale-safe, atomic, and replay-safe", () => {
  assert.match(migration, /where id = p_proposal_id and user_id = v_user_id\s+for update/i);
  assert.match(migration, /expires_at <= now\(\)/i);
  assert.match(migration, /on conflict \(user_id, fingerprint\) do nothing/i);
  assert.match(migration, /if v_proposal\.status = 'confirmed' then return v_proposal\.result/i);
});

test("browser roles cannot insert measurements without the confirmation transaction", () => {
  assert.doesNotMatch(migration, /create policy vital_measurements_insert/i);
  assert.match(migration, /create or replace function private\.confirm_health_import_proposal/i);
  assert.match(migration, /create or replace function public\.confirm_health_import_proposal[\s\S]+security invoker/i);
  assert.match(migration, /revoke all on function public\.confirm_health_import_proposal\(uuid\) from public, anon/i);
  assert.match(migration, /grant execute on function public\.confirm_health_import_proposal\(uuid\) to authenticated/i);
});

test("preview copy clearly states that no measurements were saved", () => {
  assert.match(serverSource, /title: "Prepare health measurements for review"/);
  assert.match(serverSource, /Nothing has been added to Health Vault/);
  assert.match(serverSource, /Never call confirm_health_data_import in the same assistant turn/);
  assert.match(serverSource, /confirm_health_data_import[\s\S]+destructiveHint: true/);
});

test("vital previews use an explicit review-and-import card", () => {
  assert.equal(HEALTH_IMPORT_WIDGET_URI, "ui://widget/health-vault-vitals-import-v2.html");
  assert.match(HEALTH_IMPORT_WIDGET_HTML, /Nothing has been added to Health Vault/);
  assert.match(HEALTH_IMPORT_WIDGET_HTML, /Import to Health Vault/);
  assert.match(HEALTH_IMPORT_WIDGET_HTML, /Saved to your Health Vault/);
  assert.match(HEALTH_IMPORT_WIDGET_HTML, /openai:set_globals/);
  assert.match(HEALTH_IMPORT_WIDGET_HTML, /callTool\('confirm_health_data_import'/);
  assert.match(serverSource, /"openai\/outputTemplate": HEALTH_IMPORT_WIDGET_URI/);
  assert.match(serverSource, /"openai\/widgetAccessible": true/);
});
