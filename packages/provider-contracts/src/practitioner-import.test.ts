import assert from 'node:assert/strict';
import test from 'node:test';
import { HEALTH_VAULT_PRACTITIONER_CSV_V1_HEADERS, parsePractitionerCsvV1 } from './practitioner-import.ts';

test('practitioner CSV v1 accepts quoted fields and normalizes identifiers', () => {
  const csv = `${HEALTH_VAULT_PRACTITIONER_CSV_V1_HEADERS.join(',')}\nADA@EXAMPLE.COM,"Lovelace, Ada",Primary Care,NPI,1234567890\n`;
  const result = parsePractitionerCsvV1(csv);
  assert.equal(result.errors.length, 0);
  assert.deepEqual(result.rows[0], { email: 'ada@example.com', display_name: 'Lovelace, Ada', specialty: 'Primary Care', professional_identifier_type: 'npi', professional_identifier_value: '1234567890' });
});

test('practitioner CSV v1 rejects duplicates, formulas, and excessive batches', () => {
  const header = HEALTH_VAULT_PRACTITIONER_CSV_V1_HEADERS.join(',');
  assert.match(parsePractitionerCsvV1(`${header}\na@example.com,A,,,\nA@example.com,B,,,\n`).errors[0]?.message ?? '', /duplicated/);
  assert.match(parsePractitionerCsvV1(`${header}\na@example.com,=cmd,,,\n`).errors[0]?.message ?? '', /formula/);
  const excessive = `${header}\n${Array.from({ length: 2001 }, (_, index) => `p${index}@example.com,P ${index},,,`).join('\n')}\n`;
  assert.match(parsePractitionerCsvV1(excessive).errors[0]?.message ?? '', /2,000/);
});
