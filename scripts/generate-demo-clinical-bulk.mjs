import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const output = resolve(process.argv[2] ?? 'fixtures/provider-clinical/health-vault-demo-100-patient-clinical-bulk.json');
const patients = Array.from({ length: 100 }, (_, index) => {
  const sequence = String(index + 1).padStart(4, '0');
  const patientNumber = `HV-DEMO-${sequence}`;
  return {
    organizationPatientNumber: patientNumber,
    resources: [
      {
        type: 'health_record', externalId: `encounter-${sequence}-2026-07-14`, title: 'Synthetic annual wellness visit',
        occurredAt: '2026-07-14T15:30:00Z', providerName: 'Health Vault Demo Provider',
        data: { summary: 'Synthetic wellness encounter for demonstration only.', status: 'completed' },
      },
      {
        type: 'lab', externalId: `lab-${sequence}-2026-07-14`, title: 'Synthetic wellness laboratory panel',
        occurredAt: '2026-07-14T16:10:00Z', providerName: 'Health Vault Demo Provider',
        data: { summary: 'Synthetic laboratory results for demonstration only.', status: 'final', resultCount: 6 },
      },
      {
        type: 'vital', externalId: `vital-${sequence}-2026-07-14`, title: 'Synthetic visit vital signs',
        occurredAt: '2026-07-14T15:25:00Z', providerName: 'Health Vault Demo Provider',
        data: { summary: 'Synthetic vital-sign set for demonstration only.', measurementCount: 4 },
      },
    ],
  };
});

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify({ schemaVersion: 'health_vault_clinical_bulk_json_v1', synthetic: true, patients }, null, 2)}\n`);
console.log(output);
