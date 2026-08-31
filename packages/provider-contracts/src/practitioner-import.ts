export const HEALTH_VAULT_PRACTITIONER_CSV_V1_HEADERS = [
  'email', 'display_name', 'specialty', 'professional_identifier_type', 'professional_identifier_value',
] as const;

export type PractitionerCsvV1Header = (typeof HEALTH_VAULT_PRACTITIONER_CSV_V1_HEADERS)[number];
export type PractitionerRowV1 = Record<PractitionerCsvV1Header, string>;
export interface PractitionerValidationError { rowNumber: number; field: string; message: string }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FORMULA_PREFIX = /^[=+\-@]/;
const IDENTIFIER_TYPES = new Set(['npi', 'license', 'other']);

function parseRecords(csv: string): string[][] {
  const records: string[][] = []; let field = ''; let row: string[] = []; let quoted = false;
  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    if (character === '"') {
      if (quoted && csv[index + 1] === '"') { field += '"'; index += 1; } else quoted = !quoted;
    } else if (character === ',' && !quoted) { row.push(field); field = ''; }
    else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && csv[index + 1] === '\n') index += 1;
      row.push(field); field = ''; if (row.some(Boolean)) records.push(row); row = [];
    } else field += character;
  }
  if (quoted) throw new Error('CSV contains an unterminated quoted field');
  if (field || row.length) { row.push(field); records.push(row); }
  return records;
}

export function parsePractitionerCsvV1(csv: string): { rows: PractitionerRowV1[]; errors: PractitionerValidationError[] } {
  let records: string[][];
  try { records = parseRecords(csv.replace(/^\uFEFF/, '')); }
  catch (error) { return { rows: [], errors: [{ rowNumber: 1, field: 'csv', message: error instanceof Error ? error.message : 'CSV is invalid' }] }; }
  const header = records.shift()?.map((value) => value.trim()) ?? [];
  if (header.length !== HEALTH_VAULT_PRACTITIONER_CSV_V1_HEADERS.length || header.some((value, index) => value !== HEALTH_VAULT_PRACTITIONER_CSV_V1_HEADERS[index])) {
    return { rows: [], errors: [{ rowNumber: 1, field: 'header', message: 'CSV header must exactly match Health Vault practitioner CSV v1' }] };
  }
  if (records.length > 2000) return { rows: [], errors: [{ rowNumber: 1, field: 'csv', message: 'CSV may contain at most 2,000 practitioners' }] };
  const rows: PractitionerRowV1[] = []; const errors: PractitionerValidationError[] = []; const emails = new Set<string>();
  records.forEach((record, index) => {
    const rowNumber = index + 2;
    if (record.length !== header.length) { errors.push({ rowNumber, field: 'row', message: 'row has an unexpected number of columns' }); return; }
    const row = Object.fromEntries(header.map((key, column) => [key, String(record[column] ?? '').trim()])) as PractitionerRowV1;
    row.email = row.email.toLowerCase(); row.professional_identifier_type = row.professional_identifier_type.toLowerCase();
    if (!EMAIL.test(row.email)) errors.push({ rowNumber, field: 'email', message: 'a valid email is required' });
    if (!row.display_name) errors.push({ rowNumber, field: 'display_name', message: 'display_name is required' });
    if (emails.has(row.email)) errors.push({ rowNumber, field: 'email', message: 'email is duplicated in this file' });
    for (const fieldName of HEALTH_VAULT_PRACTITIONER_CSV_V1_HEADERS) {
      if (FORMULA_PREFIX.test(row[fieldName])) errors.push({ rowNumber, field: fieldName, message: `${fieldName} contains a spreadsheet formula prefix` });
      if (row[fieldName].length > 250) errors.push({ rowNumber, field: fieldName, message: `${fieldName} exceeds 250 characters` });
    }
    if (row.professional_identifier_type && !IDENTIFIER_TYPES.has(row.professional_identifier_type)) errors.push({ rowNumber, field: 'professional_identifier_type', message: 'identifier type must be npi, license, other, or blank' });
    if (Boolean(row.professional_identifier_type) !== Boolean(row.professional_identifier_value)) errors.push({ rowNumber, field: 'professional_identifier_value', message: 'identifier type and value must be provided together' });
    if (!errors.some((error) => error.rowNumber === rowNumber)) { emails.add(row.email); rows.push(row); }
  });
  return { rows, errors };
}
