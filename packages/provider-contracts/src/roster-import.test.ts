import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  HEALTH_VAULT_ROSTER_CSV_V1_HEADERS,
  parseRosterCsvV1,
  validateRosterRowV1,
} from './roster-import.ts';

test('roster CSV v1 has an explicit, roster-only header contract', () => {
  assert.deepEqual(HEALTH_VAULT_ROSTER_CSV_V1_HEADERS, [
    'external_patient_id', 'organization_patient_number', 'given_name', 'family_name',
    'birth_date', 'administrative_sex', 'email', 'phone', 'address_line_1',
    'address_line_2', 'city', 'state', 'postal_code', 'country',
  ]);
});

test('parses quoted CSV fields and normalizes safe roster values', () => {
  const csv = `${HEALTH_VAULT_ROSTER_CSV_V1_HEADERS.join(',')}\npatient-1,MRN-1,Ana,Nguyen,1985-03-04,female,ANA@EXAMPLE.COM,555-0100,"10 Main St, Apt 2",,Denver,CO,80202,US`;
  const result = parseRosterCsvV1(csv);
  assert.equal(result.rows.length, 1);
  assert.equal(result.errors.length, 0);
  assert.equal(result.rows[0]?.email, 'ana@example.com');
  assert.equal(result.rows[0]?.address_line_1, '10 Main St, Apt 2');
});

test('rejects clinical columns and invalid roster data', () => {
  const clinicalCsv = `${HEALTH_VAULT_ROSTER_CSV_V1_HEADERS.join(',')},condition\npatient-1,,Ana,Nguyen,not-a-date,female,,,,,,,,US,diabetes`;
  const result = parseRosterCsvV1(clinicalCsv);
  assert.equal(result.rows.length, 0);
  assert.match(result.errors[0]?.message ?? '', /header/i);

  const invalid = validateRosterRowV1({ external_patient_id: '', given_name: '=cmd', family_name: 'Nguyen', birth_date: '2050-01-01' });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.length >= 3);
});

test('provider import migration creates protected staging and lifecycle functions', () => {
  const migration = readFileSync(new URL('../../../supabase/migrations/20260829183355_create_provider_roster_import_pipeline.sql', import.meta.url), 'utf8');
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.provider_import_jobs/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.provider_import_rows/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.provider_import_exceptions/);
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/g);
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.commit_provider_roster_import/);
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.rollback_provider_roster_import/);
  assert.match(migration, /REVOKE ALL ON (TABLE|FUNCTION)/);
  assert.match(migration, /source_import_job_id/);
});

test('roster lifecycle RPCs use canonical membership roles and a locked search path', () => {
  const migration = readFileSync(new URL('../../../supabase/migrations/20260830001731_fix_provider_roster_commit_roles.sql', import.meta.url), 'utf8');
  assert.match(migration, /membership\.roles && ARRAY\['organization_owner', 'provider_admin', 'integration_operator'\]::text\[\]/);
  assert.match(migration, /SET search_path = ''/);
  assert.doesNotMatch(migration, /provider_membership_roles/);
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.commit_provider_roster_import\(uuid\)/);
});
