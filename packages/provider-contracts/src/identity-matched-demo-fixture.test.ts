import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { parseRosterCsvV1 } from './roster-import.ts';
import { validateClinicalImport } from '../../../supabase/functions/provider-admin-api/clinical-import.ts';

const rosterCsv = readFileSync(new URL('../../../fixtures/provider-rosters/health-vault-demo-identity-match.csv', import.meta.url), 'utf8');
const clinicalJson = JSON.parse(readFileSync(new URL('../../../fixtures/provider-clinical/health-vault-demo-identity-match-clinical.json', import.meta.url), 'utf8')) as unknown;

test('identity-matched demo roster is valid and bound to the approved AOL review account', () => {
  const result = parseRosterCsvV1(rosterCsv);
  assert.deepEqual(result.errors, []);
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].organization_patient_number, 'HV-DEMO-TIMOTHY');
  assert.equal(result.rows[0].given_name, 'Timothy');
  assert.equal(result.rows[0].family_name, 'McGuire');
  assert.equal(result.rows[0].birth_date, '1967-10-12');
  assert.equal(result.rows[0].email, 'godesigngo@aol.com');
});

test('identity-matched demo clinical package is valid, synthetic, and patient scoped', () => {
  const result = validateClinicalImport(clinicalJson);
  assert.deepEqual(result.errors, []);
  assert.equal(result.value?.packages.length, 1);
  assert.equal(result.value?.packages[0].organizationPatientNumber, 'HV-DEMO-TIMOTHY');
  assert.equal(result.value?.packages[0].resources.length, 8);
});
