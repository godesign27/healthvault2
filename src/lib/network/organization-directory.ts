import { supabase } from '../supabase';
import type { DirectoryProvider } from '../network-directory';
import type { Provider } from '../../types/network';
import {
  formatOrganizationLocation,
  mapOrganizationRow,
  organizationSearchFilter,
  organizationSpecialtyLabel,
  type ProviderOrganization,
} from './provider-organizations';

export type { ProviderOrganization } from './provider-organizations';

export async function searchProviderOrganizationsClient(
  query?: string,
  limit = 20,
): Promise<ProviderOrganization[]> {
  let dbQuery = supabase
    .from('provider_organizations')
    .select('*')
    .order('name', { ascending: true })
    .limit(limit);

  if (query?.trim()) {
    dbQuery = dbQuery.or(organizationSearchFilter(query));
  }

  const { data, error } = await dbQuery;
  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(mapOrganizationRow);
}

export function orgToDirectoryProvider(org: ProviderOrganization): DirectoryProvider {
  return {
    id: org.id,
    name: org.name,
    specialty: organizationSpecialtyLabel(org),
    category: 'Health System',
    clinic: org.name,
    phone: '',
    address: formatOrganizationLocation(org),
    npi: '',
    acceptingNewPatients: org.supportsDirectConnection || org.supportsEpicConnection,
    languages: ['English'],
    distance: '',
  };
}

export function orgToNetworkProvider(org: ProviderOrganization, inNetwork: boolean): Provider {
  return {
    id: org.id,
    userId: '',
    name: org.name,
    specialty: org.ehrVendor || undefined,
    clinic: org.name,
    address: formatOrganizationLocation(org) || undefined,
    relationship: 'Other',
    connectionSource:
      org.supportsEpicConnection || org.supportsDirectConnection ? 'FHIR' : 'Manual',
    inNetwork,
  };
}

export interface RecordRequestProviderOption {
  id: string;
  name: string;
  specialty: string;
  clinic: string;
  address: string;
  organizationId: string;
  supportsManualRequest: boolean;
}

export function orgToRecordRequestProvider(org: ProviderOrganization): RecordRequestProviderOption {
  return {
    id: org.id,
    name: org.name,
    specialty: organizationSpecialtyLabel(org),
    clinic: org.name,
    address: formatOrganizationLocation(org),
    organizationId: org.id,
    supportsManualRequest: org.supportsManualRequest,
  };
}
