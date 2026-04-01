import type {
  FhirCondition,
  FhirAllergy,
  FhirMedicationStatement,
  FhirImmunization,
  FhirCodeableConcept,
  FhirCoding,
} from './types';
import { ConditionSchema, MedicationSchema, AllergySchema, ImmunizationSchema } from '../../schemas/medical-profile';

export function pickDisplay(cc?: FhirCodeableConcept): string {
  return cc?.coding?.[0]?.display ?? cc?.text ?? '';
}

export function extractCodes(cc?: FhirCodeableConcept): FhirCoding[] {
  return cc?.coding ?? [];
}

export function mapConditionStatus(code?: string): 'Active' | 'In remission' | 'Resolved' | undefined {
  if (!code) return undefined;
  const lower = code.toLowerCase();
  if (lower.includes('active')) return 'Active';
  if (lower.includes('remission')) return 'In remission';
  if (lower.includes('resolved') || lower.includes('inactive')) return 'Resolved';
  return 'Active';
}

export function mapSeverity(code?: string): 'Mild' | 'Moderate' | 'Severe' | undefined {
  if (!code) return undefined;
  const lower = code.toLowerCase();
  if (lower.includes('mild') || lower.includes('low')) return 'Mild';
  if (lower.includes('moderate') || lower.includes('medium')) return 'Moderate';
  if (lower.includes('severe') || lower.includes('high') || lower.includes('critical')) return 'Severe';
  return 'Moderate';
}

export function fhirConditionToApp(c: FhirCondition) {
  return {
    name: pickDisplay(c.code),
    diagnosedOn: c.onsetDateTime?.slice(0, 10) || c.recordedDate?.slice(0, 10),
    status: mapConditionStatus(c.clinicalStatus?.coding?.[0]?.code),
    managingPhysician: c.asserter?.display,
    notes: c.note?.[0]?.text,
    _codes: extractCodes(c.code),
    _provenance: {
      source: 'FHIR',
      id: c.id,
      resourceType: 'Condition',
    },
  };
}

export function fhirAllergyToApp(a: FhirAllergy) {
  const reactions = a.reaction
    ?.map((r) => r.manifestation.map((m) => pickDisplay(m)).join(', '))
    .filter(Boolean)
    .join('; ');

  return {
    allergen: pickDisplay(a.code),
    reaction: reactions || a.note?.[0]?.text,
    severity: mapSeverity(a.criticality || a.reaction?.[0]?.severity),
    diagnosedOn: a.onsetDateTime?.slice(0, 10) || a.recordedDate?.slice(0, 10),
    notes: a.note?.[0]?.text,
    _codes: extractCodes(a.code),
    _provenance: {
      source: 'FHIR',
      id: a.id,
      resourceType: 'AllergyIntolerance',
    },
  };
}

export function fhirMedicationToApp(m: FhirMedicationStatement) {
  const dosageText = m.dosage?.[0]?.text;
  const doseQuantity = m.dosage?.[0]?.doseAndRate?.[0]?.doseQuantity;
  const timing = m.dosage?.[0]?.timing?.repeat;

  let dosage = dosageText;
  if (!dosage && doseQuantity) {
    dosage = `${doseQuantity.value} ${doseQuantity.unit}`;
  }

  let frequency = '';
  if (timing) {
    frequency = `${timing.frequency || 1}x per ${timing.periodUnit || 'day'}`;
  }

  return {
    name: pickDisplay(m.medicationCodeableConcept),
    dosage: dosage || undefined,
    frequency: frequency || undefined,
    prescribedBy: m.informationSource?.display,
    startDate: m.effectiveDateTime?.slice(0, 10) || m.effectivePeriod?.start?.slice(0, 10),
    endDate: m.effectivePeriod?.end?.slice(0, 10),
    notes: m.note?.[0]?.text,
    _codes: extractCodes(m.medicationCodeableConcept),
    _provenance: {
      source: 'FHIR',
      id: m.id,
      resourceType: 'MedicationStatement',
    },
  };
}

export function fhirImmunizationToApp(i: FhirImmunization) {
  return {
    vaccine: pickDisplay(i.vaccineCode),
    administeredOn: i.occurrenceDateTime?.slice(0, 10) || i.recorded?.slice(0, 10),
    provider: i.performer?.[0]?.actor?.display || i.location?.display,
    lotNumber: i.lotNumber,
    notes: i.note?.[0]?.text,
    _codes: extractCodes(i.vaccineCode),
    _provenance: {
      source: 'FHIR',
      id: i.id,
      resourceType: 'Immunization',
    },
  };
}

export const validators = {
  condition: (v: any) => ConditionSchema.safeParse(v),
  allergy: (v: any) => AllergySchema.safeParse(v),
  medication: (v: any) => MedicationSchema.safeParse(v),
  immunization: (v: any) => ImmunizationSchema.safeParse(v),
};
