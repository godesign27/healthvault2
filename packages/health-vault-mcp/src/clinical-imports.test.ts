import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { CLINICAL_IMPORT_WIDGET_HTML, CLINICAL_IMPORT_WIDGET_URI } from "./clinical-import-widget.js";
import { normalizeClinicalImport } from "./clinical-imports.js";

const root = new URL("../../../", import.meta.url);
const serverSource = readFileSync(new URL("packages/health-vault-mcp/src/server.ts", root), "utf8");
const migration = readFileSync(new URL("supabase/migrations/20260909012207_add_connected_health_record_imports.sql", root), "utf8");
const privilegeMigration = readFileSync(new URL("supabase/migrations/20260909012652_restrict_connected_health_record_writes.sql", root), "utf8");

test("normalizes existing ChatGPT Health records with stable provenance", async () => {
  const input = { sourceKind: "chatgpt_health_medical_records" as const, sourceName: "Example Clinic via ChatGPT Health", idempotencyKey: crypto.randomUUID(), records: [{ recordType: "medication" as const, title: "Example medicine 20 mg", effectiveDate: "2026-07-08", providerName: "Example Clinic", sourceRecordId: "med-1", details: { dosage: "20 mg" } }] };
  const first = await normalizeClinicalImport(input);
  const second = await normalizeClinicalImport(input);
  assert.equal(first.records[0].fingerprint, second.records[0].fingerprint);
  assert.equal(first.records[0].recordType, "medication");
});

test("rejects duplicate records inside one review", async () => {
  const record = { recordType: "condition" as const, title: "Example condition", effectiveDate: "2026-07-06" };
  await assert.rejects(() => normalizeClinicalImport({ sourceKind: "chatgpt_health_medical_records", sourceName: "Example Clinic", idempotencyKey: crypto.randomUUID(), records: [record, record] }), /appears more than once/);
});

test("connected record imports preserve review and confirmation boundaries", () => {
  assert.match(serverSource, /without reconnecting to or refreshing the provider/);
  assert.match(serverSource, /preview_connected_health_records_import/);
  assert.match(serverSource, /confirm_connected_health_records_import/);
  assert.match(serverSource, /list_connected_health_records/);
  assert.match(migration, /where id = p_proposal_id and user_id = v_user_id for update/);
  assert.match(migration, /on conflict \(user_id, fingerprint\) do nothing/);
  assert.match(migration, /alter table public\.connected_health_records enable row level security/);
  assert.match(privilegeMigration, /revoke insert, update, delete/);
  assert.match(privilegeMigration, /from authenticated, anon/);
});

test("record review card is explicit before and after import", () => {
  assert.equal(CLINICAL_IMPORT_WIDGET_URI, "ui://widget/health-vault-record-import-v1.html");
  assert.match(CLINICAL_IMPORT_WIDGET_HTML, /Nothing has been added to Health Vault/);
  assert.match(CLINICAL_IMPORT_WIDGET_HTML, /Import selected records/);
  assert.match(CLINICAL_IMPORT_WIDGET_HTML, /Saved to your Health Vault/);
  assert.match(CLINICAL_IMPORT_WIDGET_HTML, /confirm_connected_health_records_import/);
});
