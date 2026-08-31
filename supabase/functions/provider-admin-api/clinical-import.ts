export const CLINICAL_RESOURCE_TYPES = ['health_record', 'lab', 'medication', 'condition', 'allergy', 'immunization', 'vital'] as const;
type ResourceType = typeof CLINICAL_RESOURCE_TYPES[number];
export interface ClinicalValidationError { field: string; message: string }

export const MAX_INTERACTIVE_CLINICAL_PATIENTS = 250;
export const MAX_INTERACTIVE_CLINICAL_RESOURCES = 5000;

export function validateClinicalPackage(input: unknown) {
  const errors: ClinicalValidationError[] = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { value: null, errors: [{ field: 'package', message: 'package must be an object' }] };
  const record = input as Record<string, unknown>;
  const allowedTop = new Set(['schemaVersion', 'synthetic', 'patient', 'resources']);
  for (const key of Object.keys(record)) if (!allowedTop.has(key)) errors.push({ field: key, message: `${key} is not allowed` });
  if (record.schemaVersion !== 'health_vault_clinical_json_v1') errors.push({ field: 'schemaVersion', message: 'schemaVersion must be health_vault_clinical_json_v1' });
  if (record.synthetic !== true) errors.push({ field: 'synthetic', message: 'clinical pilot imports must be explicitly synthetic' });
  const patient = record.patient && typeof record.patient === 'object' && !Array.isArray(record.patient) ? record.patient as Record<string, unknown> : {};
  const organizationPatientNumber = String(patient.organizationPatientNumber ?? '').trim();
  if (!organizationPatientNumber || organizationPatientNumber.length > 100) errors.push({ field: 'patient.organizationPatientNumber', message: 'a bounded organization patient number is required' });
  const candidates = Array.isArray(record.resources) ? record.resources : [];
  if (!candidates.length || candidates.length > 1000) errors.push({ field: 'resources', message: '1 to 1000 resources are required' });
  const resources: Array<{ resourceType: ResourceType; externalResourceId: string; title: string; occurredAt: string | null; providerName: string | null; payload: Record<string, unknown> }> = [];
  const seen = new Set<string>();
  candidates.forEach((candidate, index) => {
    const prefix = `resources.${index}`;
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) { errors.push({ field: prefix, message: 'resource must be an object' }); return; }
    const item = candidate as Record<string, unknown>;
    const allowed = new Set(['type', 'externalId', 'title', 'occurredAt', 'providerName', 'data']);
    for (const key of Object.keys(item)) if (!allowed.has(key)) errors.push({ field: `${prefix}.${key}`, message: `${key} is not allowed` });
    const resourceType = String(item.type ?? '') as ResourceType;
    const externalResourceId = String(item.externalId ?? '').trim();
    const title = String(item.title ?? '').trim();
    const providerName = item.providerName == null ? null : String(item.providerName).trim();
    const occurredAt = item.occurredAt == null ? null : String(item.occurredAt);
    const payload = item.data && typeof item.data === 'object' && !Array.isArray(item.data) ? item.data as Record<string, unknown> : null;
    if (!CLINICAL_RESOURCE_TYPES.includes(resourceType)) errors.push({ field: `${prefix}.type`, message: 'unsupported clinical resource type' });
    if (!externalResourceId || externalResourceId.length > 200) errors.push({ field: `${prefix}.externalId`, message: 'a bounded externalId is required' });
    if (!title || title.length > 300) errors.push({ field: `${prefix}.title`, message: 'a bounded title is required' });
    if (providerName && providerName.length > 300) errors.push({ field: `${prefix}.providerName`, message: 'providerName exceeds 300 characters' });
    if (occurredAt && !Number.isFinite(new Date(occurredAt).getTime())) errors.push({ field: `${prefix}.occurredAt`, message: 'occurredAt must be a valid date-time' });
    if (!payload || JSON.stringify(payload).length > 25000) errors.push({ field: `${prefix}.data`, message: 'data must be an object no larger than 25KB' });
    const key = `${resourceType}:${externalResourceId}`;
    if (seen.has(key)) errors.push({ field: `${prefix}.externalId`, message: 'resource identity is duplicated' });
    if (CLINICAL_RESOURCE_TYPES.includes(resourceType) && externalResourceId && title && payload) { seen.add(key); resources.push({ resourceType, externalResourceId, title, occurredAt, providerName, payload }); }
  });
  return { value: errors.length ? null : { schemaVersion: 'health_vault_clinical_json_v1', synthetic: true, organizationPatientNumber, resources }, errors };
}

export function validateClinicalImport(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { value: null, errors: [{ field: 'import', message: 'import must be an object' }] };
  const record = input as Record<string, unknown>;
  if (record.schemaVersion !== 'health_vault_clinical_bulk_json_v1') {
    const single = validateClinicalPackage(input);
    return { value: single.value ? { schemaVersion: single.value.schemaVersion, synthetic: true, packages: [single.value] } : null, errors: single.errors };
  }
  const errors: ClinicalValidationError[] = [];
  const allowedTop = new Set(['schemaVersion', 'synthetic', 'patients']);
  for (const key of Object.keys(record)) if (!allowedTop.has(key)) errors.push({ field: key, message: `${key} is not allowed` });
  if (record.synthetic !== true) errors.push({ field: 'synthetic', message: 'clinical pilot imports must be explicitly synthetic' });
  const patients = Array.isArray(record.patients) ? record.patients : [];
  if (!patients.length || patients.length > MAX_INTERACTIVE_CLINICAL_PATIENTS) errors.push({ field: 'patients', message: `1 to ${MAX_INTERACTIVE_CLINICAL_PATIENTS} patients are required for an interactive upload` });
  const packages: NonNullable<ReturnType<typeof validateClinicalPackage>['value']>[] = [];
  const seenPatients = new Set<string>();
  let resourceTotal = 0;
  patients.forEach((patient, index) => {
    const item = patient && typeof patient === 'object' && !Array.isArray(patient) ? patient as Record<string, unknown> : {};
    const allowedPatient = new Set(['organizationPatientNumber', 'resources']);
    for (const key of Object.keys(item)) if (!allowedPatient.has(key)) errors.push({ field: `patients.${index}.${key}`, message: `${key} is not allowed` });
    const result = validateClinicalPackage({ schemaVersion: 'health_vault_clinical_json_v1', synthetic: record.synthetic, patient: { organizationPatientNumber: item.organizationPatientNumber }, resources: item.resources });
    errors.push(...result.errors.map((error) => ({ field: `patients.${index}.${error.field.replace(/^patient\./, '')}`, message: error.message })));
    if (result.value) {
      if (seenPatients.has(result.value.organizationPatientNumber)) errors.push({ field: `patients.${index}.organizationPatientNumber`, message: 'patient is duplicated in this import' });
      seenPatients.add(result.value.organizationPatientNumber);
      resourceTotal += result.value.resources.length;
      packages.push(result.value);
    }
  });
  if (resourceTotal > MAX_INTERACTIVE_CLINICAL_RESOURCES) errors.push({ field: 'patients.resources', message: `interactive imports support at most ${MAX_INTERACTIVE_CLINICAL_RESOURCES} resources` });
  return { value: errors.length ? null : { schemaVersion: 'health_vault_clinical_bulk_json_v1', synthetic: true, packages }, errors };
}

export function clinicalCounts(resources: Array<{ resourceType: string }>) {
  const count = (type: string) => resources.filter((item) => item.resourceType === type).length;
  return { total: resources.length, records: count('health_record'), labs: count('lab'), medications: count('medication'), conditions: count('condition'), allergies: count('allergy'), immunizations: count('immunization'), vitals: count('vital') };
}
