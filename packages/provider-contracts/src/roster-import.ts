export const HEALTH_VAULT_ROSTER_CSV_V1_HEADERS = [
  'external_patient_id', 'organization_patient_number', 'given_name', 'family_name',
  'birth_date', 'administrative_sex', 'email', 'phone', 'address_line_1',
  'address_line_2', 'city', 'state', 'postal_code', 'country',
] as const;

export type RosterCsvV1Header = (typeof HEALTH_VAULT_ROSTER_CSV_V1_HEADERS)[number];
export type RosterRowV1 = Record<RosterCsvV1Header, string>;
export interface RosterValidationError { rowNumber: number; field: string; message: string }

const FORMULA_PREFIX = /^[=+\-@]/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ADMINISTRATIVE_SEX = new Set(['female', 'male', 'other', 'unknown']);

function parseCsvRecords(csv: string): string[][] {
  const records: string[][] = [];
  let field = '';
  let record: string[] = [];
  let quoted = false;
  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    if (character === '"') {
      if (quoted && csv[index + 1] === '"') { field += '"'; index += 1; }
      else quoted = !quoted;
    } else if (character === ',' && !quoted) {
      record.push(field); field = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && csv[index + 1] === '\n') index += 1;
      record.push(field); field = '';
      if (record.some((value) => value.length > 0)) records.push(record);
      record = [];
    } else field += character;
  }
  if (quoted) throw new Error('CSV contains an unterminated quoted field');
  if (field.length > 0 || record.length > 0) { record.push(field); records.push(record); }
  return records;
}

function blankRow(): RosterRowV1 {
  return Object.fromEntries(HEALTH_VAULT_ROSTER_CSV_V1_HEADERS.map((header) => [header, ''])) as RosterRowV1;
}

export function validateRosterRowV1(input: Partial<Record<RosterCsvV1Header, string>>, rowNumber = 1): { valid: boolean; row: RosterRowV1; errors: RosterValidationError[] } {
  const row = blankRow();
  for (const header of HEALTH_VAULT_ROSTER_CSV_V1_HEADERS) row[header] = String(input[header] ?? '').trim();
  row.email = row.email.toLowerCase();
  row.administrative_sex = row.administrative_sex.toLowerCase();
  row.country = row.country.toUpperCase();
  const errors: RosterValidationError[] = [];
  for (const field of ['external_patient_id', 'given_name', 'family_name', 'birth_date'] as const) {
    if (!row[field]) errors.push({ rowNumber, field, message: `${field} is required` });
  }
  for (const header of HEALTH_VAULT_ROSTER_CSV_V1_HEADERS) {
    if (FORMULA_PREFIX.test(row[header])) errors.push({ rowNumber, field: header, message: `${header} contains a spreadsheet formula prefix` });
    if (row[header].length > 500) errors.push({ rowNumber, field: header, message: `${header} exceeds 500 characters` });
  }
  const birthDate = new Date(`${row.birth_date}T00:00:00Z`);
  if (!ISO_DATE.test(row.birth_date) || !Number.isFinite(birthDate.getTime()) || birthDate > new Date()) {
    errors.push({ rowNumber, field: 'birth_date', message: 'birth_date must be a valid past ISO date' });
  }
  if (row.email && !EMAIL.test(row.email)) errors.push({ rowNumber, field: 'email', message: 'email is invalid' });
  if (row.administrative_sex && !ADMINISTRATIVE_SEX.has(row.administrative_sex)) {
    errors.push({ rowNumber, field: 'administrative_sex', message: 'administrative_sex must be female, male, other, or unknown' });
  }
  return { valid: errors.length === 0, row, errors };
}

export function parseRosterCsvV1(csv: string): { rows: RosterRowV1[]; errors: RosterValidationError[] } {
  let records: string[][];
  try { records = parseCsvRecords(csv.replace(/^\uFEFF/, '')); }
  catch (error) { return { rows: [], errors: [{ rowNumber: 1, field: 'csv', message: error instanceof Error ? error.message : 'CSV is invalid' }] }; }
  const header = records.shift()?.map((value) => value.trim()) ?? [];
  if (header.length !== HEALTH_VAULT_ROSTER_CSV_V1_HEADERS.length || header.some((value, index) => value !== HEALTH_VAULT_ROSTER_CSV_V1_HEADERS[index])) {
    return { rows: [], errors: [{ rowNumber: 1, field: 'header', message: 'CSV header must exactly match Health Vault roster CSV v1' }] };
  }
  const rows: RosterRowV1[] = [];
  const errors: RosterValidationError[] = [];
  const seenIds = new Set<string>();
  records.forEach((record, index) => {
    const rowNumber = index + 2;
    if (record.length !== header.length) { errors.push({ rowNumber, field: 'row', message: 'row has an unexpected number of columns' }); return; }
    const input = Object.fromEntries(header.map((key, column) => [key, record[column] ?? ''])) as RosterRowV1;
    const result = validateRosterRowV1(input, rowNumber);
    if (seenIds.has(result.row.external_patient_id)) result.errors.push({ rowNumber, field: 'external_patient_id', message: 'external_patient_id is duplicated in this file' });
    if (result.errors.length > 0) errors.push(...result.errors);
    else { seenIds.add(result.row.external_patient_id); rows.push(result.row); }
  });
  return { rows, errors };
}
