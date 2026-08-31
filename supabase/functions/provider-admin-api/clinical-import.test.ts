import assert from 'node:assert/strict';
import test from 'node:test';
import { clinicalCounts, validateClinicalImport, validateClinicalPackage } from './clinical-import.ts';

const valid = { schemaVersion: 'health_vault_clinical_json_v1', synthetic: true, patient: { organizationPatientNumber: 'HV-DEMO-0058' }, resources: [{ type: 'lab', externalId: 'lab-1', title: 'CBC', occurredAt: '2026-08-01T12:00:00Z', providerName: 'Demo Clinic', data: { summary: 'Synthetic result' } }, { type: 'medication', externalId: 'med-1', title: 'Example medicine', data: { dosage: '10 mg' } }] };

test('accepts and normalizes a bounded synthetic clinical package', () => {
  const result = validateClinicalPackage(valid);
  assert.equal(result.errors.length, 0); assert.equal(result.value?.resources.length, 2);
  assert.deepEqual(clinicalCounts(result.value!.resources), { total: 2, records: 0, labs: 1, medications: 1, conditions: 0, allergies: 0, immunizations: 0, vitals: 0 });
});

test('rejects non-synthetic, unknown, duplicate, and oversized clinical input', () => {
  const result = validateClinicalPackage({ ...valid, synthetic: false, unexpected: true, resources: [valid.resources[0], valid.resources[0], { ...valid.resources[0], externalId: 'huge', data: { value: 'x'.repeat(26000) } }] });
  assert.ok(result.errors.some((item) => item.field === 'synthetic'));
  assert.ok(result.errors.some((item) => item.field === 'unexpected'));
  assert.ok(result.errors.some((item) => item.message.includes('duplicated')));
  assert.ok(result.errors.some((item) => item.message.includes('25KB')));
});

test('accepts a bulk clinical file and keeps each patient as a separate package', () => {
  const result = validateClinicalImport({ schemaVersion: 'health_vault_clinical_bulk_json_v1', synthetic: true, patients: [
    { organizationPatientNumber: 'HV-DEMO-0058', resources: valid.resources },
    { organizationPatientNumber: 'HV-DEMO-0059', resources: [{ ...valid.resources[0], externalId: 'lab-2' }] },
  ] });
  assert.equal(result.errors.length, 0);
  assert.equal(result.value?.packages.length, 2);
  assert.equal(result.value?.packages.reduce((total, item) => total + item.resources.length, 0), 3);
});

test('bulk imports reject duplicate patients and excessive interactive batches', () => {
  const patient = { organizationPatientNumber: 'HV-DEMO-0058', resources: valid.resources };
  const duplicate = validateClinicalImport({ schemaVersion: 'health_vault_clinical_bulk_json_v1', synthetic: true, patients: [patient, patient] });
  assert.ok(duplicate.errors.some((item) => item.message.includes('patient is duplicated')));
  const excessive = validateClinicalImport({ schemaVersion: 'health_vault_clinical_bulk_json_v1', synthetic: true, patients: Array.from({ length: 251 }, (_, index) => ({ ...patient, organizationPatientNumber: `HV-${index}` })) });
  assert.ok(excessive.errors.some((item) => item.field === 'patients'));
});
