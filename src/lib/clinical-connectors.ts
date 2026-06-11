import { Provider, Pharmacy } from '../types/network';
import {
  orgToNetworkProvider,
  searchProviderOrganizationsClient,
} from './network/organization-directory';

export async function searchInNetworkProviders(
  query: string,
  _insurancePlanId: string,
): Promise<Provider[]> {
  const orgs = await searchProviderOrganizationsClient(query, 20);
  return orgs.map((org) => orgToNetworkProvider(org, true));
}

export async function searchPublicProviders(query: string): Promise<Provider[]> {
  const orgs = await searchProviderOrganizationsClient(query, 20);
  return orgs.map((org) => orgToNetworkProvider(org, false));
}

export async function searchInNetworkPharmacies(
  query: string,
  _insurancePlanId: string,
): Promise<Pharmacy[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const mockResults: Pharmacy[] = [
    {
      id: crypto.randomUUID(),
      userId: '',
      name: 'CVS Pharmacy #1234',
      chain: 'CVS',
      phone: '5559991111',
      address: '500 Main St, Springfield, IL 62708',
      preferred: false,
      deliveryOptions: ['Pickup', 'Delivery'],
      inNetwork: true,
    },
    {
      id: crypto.randomUUID(),
      userId: '',
      name: 'Walgreens #5678',
      chain: 'Walgreens',
      phone: '5552223333',
      address: '600 Oak Ave, Springfield, IL 62709',
      preferred: false,
      deliveryOptions: ['Pickup', 'Mail'],
      inNetwork: true,
    },
  ];

  return mockResults.filter(
    (ph) =>
      ph.name.toLowerCase().includes(query.toLowerCase()) ||
      ph.chain?.toLowerCase().includes(query.toLowerCase()),
  );
}

export async function searchPublicPharmacies(query: string): Promise<Pharmacy[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const mockResults: Pharmacy[] = [
    {
      id: crypto.randomUUID(),
      userId: '',
      name: 'Community Pharmacy',
      chain: 'Independent',
      phone: '5554445555',
      address: '700 Park Dr, Springfield, IL 62710',
      preferred: false,
      deliveryOptions: ['Pickup'],
      inNetwork: false,
    },
    {
      id: crypto.randomUUID(),
      userId: '',
      name: 'Rite Aid #9999',
      chain: 'Rite Aid',
      phone: '5556667777',
      address: '800 Elm St, Springfield, IL 62711',
      preferred: false,
      deliveryOptions: ['Pickup', 'Delivery'],
      inNetwork: false,
    },
  ];

  return mockResults.filter(
    (ph) =>
      ph.name.toLowerCase().includes(query.toLowerCase()) ||
      ph.chain?.toLowerCase().includes(query.toLowerCase()),
  );
}

export function mapFhirToProvider(fhirResource: unknown): Provider {
  const resource = fhirResource as any;

  return {
    id: crypto.randomUUID(),
    userId: '',
    npi: resource.identifier?.find((id: any) => id.system?.includes('npi'))?.value,
    name: resource.name?.[0]?.text || 'Unknown Provider',
    specialty: resource.specialty?.[0]?.coding?.[0]?.display,
    connectionSource: 'FHIR',
    inNetwork: true,
  };
}
