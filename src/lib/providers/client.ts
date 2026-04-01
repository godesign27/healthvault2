import { MockFHIRAPI } from '../api/mock-fhir-api';
import type { ProviderConnection } from './types';

export async function exchangeCode(params: { state: string; code: string }): Promise<ProviderConnection> {
  return MockFHIRAPI.exchangeCode(params.state, params.code);
}

export async function fetchResources<T = any>(params: { connectionId: string; resource: string }): Promise<T> {
  const { connectionId, resource } = params;

  switch (resource.toLowerCase()) {
    case 'condition':
      return MockFHIRAPI.fetchConditions(connectionId) as T;
    case 'medicationstatement':
      return MockFHIRAPI.fetchMedications(connectionId) as T;
    case 'allergyintolerance':
      return MockFHIRAPI.fetchAllergies(connectionId) as T;
    case 'immunization':
      return MockFHIRAPI.fetchImmunizations(connectionId) as T;
    default:
      throw new Error(`Unsupported resource type: ${resource}`);
  }
}
