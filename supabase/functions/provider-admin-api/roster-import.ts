export const HEALTH_VAULT_ROSTER_CSV_V1_HEADERS = [
  "external_patient_id", "organization_patient_number", "given_name", "family_name",
  "birth_date", "administrative_sex", "email", "phone", "address_line_1",
  "address_line_2", "city", "state", "postal_code", "country",
] as const;
type Header = (typeof HEALTH_VAULT_ROSTER_CSV_V1_HEADERS)[number];
type RosterRowV1 = Record<Header, string>;
export interface RosterValidationError { rowNumber: number; field: string; message: string }
const FORMULA_PREFIX = /^[=+\-@]/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ADMINISTRATIVE_SEX = new Set(["female", "male", "other", "unknown"]);

function validateRow(input: Partial<Record<Header, unknown>>, rowNumber: number) {
  const row = Object.fromEntries(HEALTH_VAULT_ROSTER_CSV_V1_HEADERS.map((header) => [header, String(input[header] ?? "").trim()])) as RosterRowV1;
  row.email = row.email.toLowerCase();
  row.administrative_sex = row.administrative_sex.toLowerCase();
  row.country = row.country.toUpperCase();
  const errors: RosterValidationError[] = [];
  for (const field of ["external_patient_id", "given_name", "family_name", "birth_date"] as const) {
    if (!row[field]) errors.push({ rowNumber, field, message: `${field} is required` });
  }
  for (const header of HEALTH_VAULT_ROSTER_CSV_V1_HEADERS) {
    if (FORMULA_PREFIX.test(row[header])) errors.push({ rowNumber, field: header, message: `${header} contains a spreadsheet formula prefix` });
    if (row[header].length > 500) errors.push({ rowNumber, field: header, message: `${header} exceeds 500 characters` });
  }
  const birthDate = new Date(`${row.birth_date}T00:00:00Z`);
  if (!ISO_DATE.test(row.birth_date) || !Number.isFinite(birthDate.getTime()) || birthDate > new Date()) {
    errors.push({ rowNumber, field: "birth_date", message: "birth_date must be a valid past ISO date" });
  }
  if (row.email && !EMAIL.test(row.email)) errors.push({ rowNumber, field: "email", message: "email is invalid" });
  if (row.administrative_sex && !ADMINISTRATIVE_SEX.has(row.administrative_sex)) {
    errors.push({ rowNumber, field: "administrative_sex", message: "administrative_sex must be female, male, other, or unknown" });
  }
  return { row, errors };
}

export type StagedRosterRow = RosterRowV1 & { row_number: number };

export function validateRosterImportPayload(input: unknown): { rows: StagedRosterRow[]; errors: RosterValidationError[] } {
  if (!Array.isArray(input) || input.length === 0) {
    return { rows: [], errors: [{ rowNumber: 1, field: "rows", message: "at least one roster row is required" }] };
  }
  if (input.length > 500) {
    return { rows: [], errors: [{ rowNumber: 1, field: "rows", message: "interactive imports are limited to 500 rows" }] };
  }

  const allowed = new Set<string>(HEALTH_VAULT_ROSTER_CSV_V1_HEADERS);
  const rows: StagedRosterRow[] = [];
  const errors: RosterValidationError[] = [];
  const seenIds = new Set<string>();

  input.forEach((candidate, index) => {
    const rowNumber = index + 2;
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      errors.push({ rowNumber, field: "row", message: "row must be an object" });
      return;
    }
    const record = candidate as Record<string, unknown>;
    const unknownField = Object.keys(record).find((key) => !allowed.has(key));
    if (unknownField) {
      errors.push({ rowNumber, field: unknownField, message: `${unknownField} is not allowed in roster CSV v1` });
      return;
    }
    const result = validateRow(record, rowNumber);
    if (seenIds.has(result.row.external_patient_id)) {
      result.errors.push({ rowNumber, field: "external_patient_id", message: "external_patient_id is duplicated in this import" });
    }
    if (result.errors.length) errors.push(...result.errors);
    else {
      seenIds.add(result.row.external_patient_id);
      rows.push({ ...result.row, row_number: rowNumber });
    }
  });

  return { rows, errors };
}
