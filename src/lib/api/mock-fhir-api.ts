import type { FhirBundle, FhirCondition, FhirAllergy, FhirMedicationStatement, FhirImmunization } from '../fhir/types';

const MOCK_CONDITIONS: FhirBundle<FhirCondition> = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [
    {
      resource: {
        resourceType: 'Condition',
        id: 'cond-1',
        clinicalStatus: { coding: [{ code: 'active', display: 'Active' }] },
        code: { coding: [{ system: 'http://snomed.info/sct', code: '195967001', display: 'Asthma' }], text: 'Asthma' },
        onsetDateTime: '2015-06-15',
        asserter: { display: 'Dr. Sarah Johnson' },
        note: [{ text: 'Exercise-induced asthma, well controlled with medications' }],
      },
    },
    {
      resource: {
        resourceType: 'Condition',
        id: 'cond-2',
        clinicalStatus: { coding: [{ code: 'resolved', display: 'Resolved' }] },
        code: { coding: [{ system: 'http://snomed.info/sct', code: '161527007', display: 'History of appendectomy' }] },
        onsetDateTime: '2010-08-22',
        asserter: { display: 'Dr. Michael Chen' },
      },
    },
    {
      resource: {
        resourceType: 'Condition',
        id: 'cond-3',
        clinicalStatus: { coding: [{ code: 'active', display: 'Active' }] },
        code: { coding: [{ system: 'http://snomed.info/sct', code: '38341003', display: 'Hypertension' }], text: 'Essential Hypertension' },
        onsetDateTime: '2020-03-10',
        asserter: { display: 'Dr. Sarah Johnson' },
        note: [{ text: 'Controlled with medication and lifestyle modifications' }],
      },
    },
  ],
};

const MOCK_MEDICATIONS: FhirBundle<FhirMedicationStatement> = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [
    {
      resource: {
        resourceType: 'MedicationStatement',
        id: 'med-1',
        status: 'active',
        medicationCodeableConcept: { coding: [{ code: '245314', display: 'Albuterol' }], text: 'Albuterol Inhaler' },
        effectiveDateTime: '2015-06-15',
        dosage: [{ text: '2 puffs every 4-6 hours as needed', doseAndRate: [{ doseQuantity: { value: 90, unit: 'mcg' } }] }],
        informationSource: { display: 'Dr. Sarah Johnson' },
      },
    },
  ],
};

const MOCK_ALLERGIES: FhirBundle<FhirAllergy> = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [
    {
      resource: {
        resourceType: 'AllergyIntolerance',
        id: 'allergy-1',
        clinicalStatus: { coding: [{ code: 'active' }] },
        code: { coding: [{ code: '227493005', display: 'Penicillin' }], text: 'Penicillin' },
        criticality: 'high',
        reaction: [{ manifestation: [{ coding: [{ code: '271807003', display: 'Rash' }] }], severity: 'moderate' }],
        recordedDate: '2005-01-15',
      },
    },
  ],
};

const MOCK_IMMUNIZATIONS: FhirBundle<FhirImmunization> = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [
    {
      resource: {
        resourceType: 'Immunization',
        id: 'imm-1',
        status: 'completed',
        vaccineCode: { coding: [{ code: '208', display: 'COVID-19 vaccine' }], text: 'COVID-19 mRNA Vaccine' },
        occurrenceDateTime: '2021-04-15',
        performer: [{ actor: { display: 'Walgreens Pharmacy' } }],
        lotNumber: 'EW0150',
      },
    },
  ],
};

export class MockFHIRAPI {
  private static connections = new Map<string, any>();

  static async exchangeCode(state: string, code: string): Promise<any> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const connectionId = `conn_${Math.random().toString(36).substring(7)}`;
    const connection = {
      id: connectionId,
      name: 'MyChart (Mock)',
      fhirBaseUrl: 'https://mock-fhir.example.com',
      patientId: 'patient-123',
      scopes: ['launch/patient', 'patient/*.read', 'offline_access'],
      lastSyncedAt: new Date().toISOString(),
      context: 'medical',
      userId: 'user-123',
      createdAt: new Date().toISOString(),
    };

    this.connections.set(connectionId, connection);
    return connection;
  }

  static async fetchConditions(connectionId: string): Promise<FhirBundle<FhirCondition>> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return MOCK_CONDITIONS;
  }

  static async fetchMedications(connectionId: string): Promise<FhirBundle<FhirMedicationStatement>> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return MOCK_MEDICATIONS;
  }

  static async fetchAllergies(connectionId: string): Promise<FhirBundle<FhirAllergy>> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return MOCK_ALLERGIES;
  }

  static async fetchImmunizations(connectionId: string): Promise<FhirBundle<FhirImmunization>> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return MOCK_IMMUNIZATIONS;
  }
}
