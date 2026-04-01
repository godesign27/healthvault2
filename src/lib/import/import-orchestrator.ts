import { exchangeCode, fetchResources } from '../providers/client';
import { normalizeAndValidate } from './normalize-and-validate';
import type { FhirBundle, FhirCondition, FhirAllergy, FhirMedicationStatement, FhirImmunization } from '../fhir/types';

export interface ImportOrchestrationResult {
  connection: any;
  data: {
    conditions: { unique: any[]; duplicates: any[]; invalid: any[] };
    medications: { unique: any[]; duplicates: any[]; invalid: any[] };
    allergies: { unique: any[]; duplicates: any[]; invalid: any[] };
    immunizations: { unique: any[]; duplicates: any[]; invalid: any[] };
  };
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function orchestrateProviderImport(
  state: string,
  code: string
): Promise<ImportOrchestrationResult> {
  const startTime = Date.now();

  const connection = await exchangeCode({ state, code });

  await delay(2000);

  const [conditionsBundle, medicationsBundle, allergiesBundle, immunizationsBundle] = await Promise.all([
    fetchResources<FhirBundle<FhirCondition>>({
      connectionId: connection.id,
      resource: 'Condition',
    }),
    fetchResources<FhirBundle<FhirMedicationStatement>>({
      connectionId: connection.id,
      resource: 'MedicationStatement',
    }),
    fetchResources<FhirBundle<FhirAllergy>>({
      connectionId: connection.id,
      resource: 'AllergyIntolerance',
    }),
    fetchResources<FhirBundle<FhirImmunization>>({
      connectionId: connection.id,
      resource: 'Immunization',
    }),
  ]);

  await delay(2000);

  const normalized = await normalizeAndValidate({
    conditions: conditionsBundle,
    medications: medicationsBundle,
    allergies: allergiesBundle,
    immunizations: immunizationsBundle,
  });

  await delay(2000);

  const elapsed = Date.now() - startTime;
  const minDuration = 10000;
  if (elapsed < minDuration) {
    await delay(minDuration - elapsed);
  }

  return {
    connection,
    data: normalized,
  };
}
