export interface FhirCoding {
  system?: string;
  code?: string;
  display?: string;
}

export interface FhirCodeableConcept {
  coding?: FhirCoding[];
  text?: string;
}

export interface FhirCondition {
  resourceType: 'Condition';
  id?: string;
  clinicalStatus?: FhirCodeableConcept;
  code?: FhirCodeableConcept;
  onsetDateTime?: string;
  recordedDate?: string;
  asserter?: { display?: string };
  note?: Array<{ text?: string }>;
}

export interface FhirAllergy {
  resourceType: 'AllergyIntolerance';
  id?: string;
  clinicalStatus?: FhirCodeableConcept;
  code?: FhirCodeableConcept;
  criticality?: string;
  onsetDateTime?: string;
  recordedDate?: string;
  reaction?: Array<{
    manifestation: FhirCodeableConcept[];
    severity?: string;
  }>;
  note?: Array<{ text?: string }>;
}

export interface FhirMedicationStatement {
  resourceType: 'MedicationStatement';
  id?: string;
  status?: string;
  medicationCodeableConcept?: FhirCodeableConcept;
  effectiveDateTime?: string;
  effectivePeriod?: {
    start?: string;
    end?: string;
  };
  informationSource?: { display?: string };
  dosage?: Array<{
    text?: string;
    doseAndRate?: Array<{
      doseQuantity?: {
        value?: number;
        unit?: string;
      };
    }>;
    timing?: {
      repeat?: {
        frequency?: number;
        period?: number;
        periodUnit?: string;
      };
    };
  }>;
  note?: Array<{ text?: string }>;
}

export interface FhirImmunization {
  resourceType: 'Immunization';
  id?: string;
  status?: string;
  vaccineCode?: FhirCodeableConcept;
  occurrenceDateTime?: string;
  recorded?: string;
  performer?: Array<{
    actor?: { display?: string };
  }>;
  location?: { display?: string };
  lotNumber?: string;
  note?: Array<{ text?: string }>;
}

export interface FhirBundle<T = any> {
  resourceType: 'Bundle';
  type: string;
  total?: number;
  entry?: Array<{
    fullUrl?: string;
    resource: T;
  }>;
}
