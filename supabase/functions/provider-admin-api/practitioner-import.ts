export interface PractitionerImportRow {
  email: string;
  display_name: string;
  specialty: string;
  professional_identifier_type: string;
  professional_identifier_value: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IDENTIFIER_TYPES = new Set(['', 'npi', 'license', 'other']);
const FORMULA_PREFIX = /^[=+\-@]/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validatePractitionerImport(input: unknown): PractitionerImportRow[] {
  if (!Array.isArray(input) || input.length < 1 || input.length > 2000) throw new Error('practitioners must contain 1 to 2,000 rows');
  const seen = new Set<string>();
  return input.map((value, index) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`row ${index + 1} must be an object`);
    const source = value as Record<string, unknown>;
    const allowed = new Set(['email', 'display_name', 'specialty', 'professional_identifier_type', 'professional_identifier_value']);
    if (Object.keys(source).some((key) => !allowed.has(key))) throw new Error(`row ${index + 1} contains an unsupported field`);
    const row = Object.fromEntries([...allowed].map((key) => [key, String(source[key] ?? '').trim()])) as unknown as PractitionerImportRow;
    row.email = row.email.toLowerCase(); row.professional_identifier_type = row.professional_identifier_type.toLowerCase();
    if (!EMAIL.test(row.email) || !row.display_name) throw new Error(`row ${index + 1} requires a valid email and display name`);
    if ([row.email, row.display_name, row.specialty, row.professional_identifier_type, row.professional_identifier_value].some((field) => field.length > 250)) throw new Error(`row ${index + 1} exceeds field limits`);
    if ([row.email, row.display_name, row.specialty, row.professional_identifier_type, row.professional_identifier_value].some((field) => FORMULA_PREFIX.test(field))) throw new Error(`row ${index + 1} contains a spreadsheet formula prefix`);
    if (!IDENTIFIER_TYPES.has(row.professional_identifier_type) || Boolean(row.professional_identifier_type) !== Boolean(row.professional_identifier_value)) throw new Error(`row ${index + 1} has an invalid professional identifier`);
    if (seen.has(row.email)) throw new Error(`row ${index + 1} duplicates an email`); seen.add(row.email);
    return row;
  });
}

export function validatePractitionerInvitationCancellation(input: { invitationIds?: unknown; sourceImportBatchId?: unknown }): { invitationIds?: string[]; sourceImportBatchId?: string } {
  const ids = Array.isArray(input.invitationIds) ? input.invitationIds.map(String) : [];
  const batchId = typeof input.sourceImportBatchId === 'string' ? input.sourceImportBatchId : '';
  if (Boolean(ids.length) === Boolean(batchId)) throw new Error('provide invitationIds or sourceImportBatchId, but not both');
  if (ids.length > 500 || ids.some((id) => !UUID_PATTERN.test(id)) || new Set(ids).size !== ids.length) throw new Error('invitationIds must contain 1 to 500 unique UUIDs');
  if (batchId && !UUID_PATTERN.test(batchId)) throw new Error('sourceImportBatchId must be a valid UUID');
  return batchId ? { sourceImportBatchId: batchId } : { invitationIds: ids };
}
