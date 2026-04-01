import type { FhirBundle, FhirCondition, FhirAllergy, FhirMedicationStatement, FhirImmunization } from '../fhir/types';
import {
  fhirConditionToApp,
  fhirAllergyToApp,
  fhirMedicationToApp,
  fhirImmunizationToApp,
  validators,
} from '../fhir/map-to-zod';
import { dedupeByCodeAndDate } from './dedupe';

export async function normalizeAndValidate(bundles: {
  conditions?: FhirBundle<FhirCondition>;
  medications?: FhirBundle<FhirMedicationStatement>;
  allergies?: FhirBundle<FhirAllergy>;
  immunizations?: FhirBundle<FhirImmunization>;
}) {
  const processConditions = () => {
    if (!bundles.conditions?.entry?.length) {
      return { unique: [], duplicates: [], invalid: [] };
    }
    const mapped = bundles.conditions.entry.map((e) => fhirConditionToApp(e.resource));
    const { unique, duplicates } = dedupeByCodeAndDate(mapped, { dateField: 'diagnosedOn' });
    return { unique, duplicates, invalid: [] };
  };

  const processMedications = () => {
    if (!bundles.medications?.entry?.length) {
      return { unique: [], duplicates: [], invalid: [] };
    }
    const mapped = bundles.medications.entry.map((e) => fhirMedicationToApp(e.resource));
    const { unique, duplicates } = dedupeByCodeAndDate(mapped, { dateField: 'startDate' });
    return { unique, duplicates, invalid: [] };
  };

  const processAllergies = () => {
    if (!bundles.allergies?.entry?.length) {
      return { unique: [], duplicates: [], invalid: [] };
    }
    const mapped = bundles.allergies.entry.map((e) => fhirAllergyToApp(e.resource));
    const { unique, duplicates } = dedupeByCodeAndDate(mapped, { dateField: 'diagnosedOn' });
    return { unique, duplicates, invalid: [] };
  };

  const processImmunizations = () => {
    if (!bundles.immunizations?.entry?.length) {
      return { unique: [], duplicates: [], invalid: [] };
    }
    const mapped = bundles.immunizations.entry.map((e) => fhirImmunizationToApp(e.resource));
    const { unique, duplicates } = dedupeByCodeAndDate(mapped, { dateField: 'administeredOn' });
    return { unique, duplicates, invalid: [] };
  };

  return {
    conditions: processConditions(),
    medications: processMedications(),
    allergies: processAllergies(),
    immunizations: processImmunizations(),
  };
}
