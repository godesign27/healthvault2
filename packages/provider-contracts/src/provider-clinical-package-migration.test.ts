import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sql = readFileSync(new URL('../../../supabase/migrations/20260829222000_create_provider_clinical_package_quarantine.sql', import.meta.url), 'utf8');
const bulkSql = readFileSync(new URL('../../../supabase/migrations/20260829222806_add_bulk_clinical_import_support.sql', import.meta.url), 'utf8');

test('clinical packages are synthetic-only, patient-scoped, and provenance-bound', () => {
  assert.match(sql, /provider_patient_identity_id uuid NOT NULL/);
  assert.match(sql, /source_format text NOT NULL/);
  assert.match(sql, /source_digest text NOT NULL/);
  assert.match(sql, /CHECK \(synthetic\)/);
  assert.match(sql, /UNIQUE \(provider_account_id, source_digest\)/);
});

test('quarantined clinical resources are normalized and unavailable to browsers', () => {
  for (const type of ['health_record', 'lab', 'medication', 'condition', 'allergy', 'immunization', 'vital']) assert.match(sql, new RegExp(`'${type}'`));
  assert.match(sql, /REVOKE ALL ON public\.provider_clinical_packages FROM PUBLIC, anon, authenticated/);
  assert.match(sql, /REVOKE ALL ON public\.provider_clinical_resources FROM PUBLIC, anon, authenticated/);
  assert.match(sql, /Validation does not grant practitioner access or attach data to a patient vault/);
});

test('bulk files retain one source digest while packages remain patient scoped', () => {
  assert.match(bulkSql, /ADD COLUMN source_batch_digest text/);
  assert.match(bulkSql, /health_vault_clinical_bulk_json_v1/);
  assert.match(bulkSql, /provider_account_id, source_batch_digest/);
  assert.match(bulkSql, /one separately releasable package per roster patient/);
});
