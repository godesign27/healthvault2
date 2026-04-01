import { Provider, Pharmacy } from '../types/network';

export async function searchInNetworkProviders(
  query: string,
  insurancePlanId: string
): Promise<Provider[]> {
  await new Promise(resolve => setTimeout(resolve, 500));

  const mockResults: Provider[] = [
    {
      id: crypto.randomUUID(),
      userId: '00000000-0000-0000-0000-000000000000',
      name: 'Dr. Sarah Johnson',
      specialty: 'Internal Medicine',
      clinic: 'Springfield Medical Group',
      phone: '5551112222',
      address: '100 Health Plaza, Springfield, IL 62704',
      relationship: 'Primary',
      connectionSource: 'FHIR',
      inNetwork: true
    },
    {
      id: crypto.randomUUID(),
      userId: '00000000-0000-0000-0000-000000000000',
      name: 'Dr. Robert Martinez',
      specialty: 'Family Medicine',
      clinic: 'Springfield Family Health',
      phone: '5551234567',
      address: '150 Family Care Dr, Springfield, IL 62704',
      relationship: 'Primary',
      connectionSource: 'FHIR',
      inNetwork: true
    },
    {
      id: crypto.randomUUID(),
      userId: '00000000-0000-0000-0000-000000000000',
      name: 'Dr. Lisa Thompson',
      specialty: 'Family Medicine',
      clinic: 'Community Health Center',
      phone: '5559876543',
      address: '75 Wellness Way, Springfield, IL 62703',
      relationship: 'Primary',
      connectionSource: 'FHIR',
      inNetwork: true
    },
    {
      id: crypto.randomUUID(),
      userId: '00000000-0000-0000-0000-000000000000',
      name: 'Dr. Michael Chen',
      specialty: 'Orthopedic Surgery',
      clinic: 'Orthopedic Specialists',
      phone: '5553334444',
      address: '200 Bone St, Springfield, IL 62705',
      relationship: 'Specialist',
      connectionSource: 'FHIR',
      inNetwork: true
    },
    {
      id: crypto.randomUUID(),
      userId: '00000000-0000-0000-0000-000000000000',
      name: 'Dr. Jennifer Lee',
      specialty: 'Cardiology',
      clinic: 'Heart & Vascular Institute',
      phone: '5552468135',
      address: '300 Heart Lane, Springfield, IL 62706',
      relationship: 'Specialist',
      connectionSource: 'FHIR',
      inNetwork: true
    },
    {
      id: crypto.randomUUID(),
      userId: '00000000-0000-0000-0000-000000000000',
      name: 'Dr. David Kumar',
      specialty: 'Pediatrics',
      clinic: 'Children\'s Medical Group',
      phone: '5553691470',
      address: '125 Kids Way, Springfield, IL 62702',
      relationship: 'Primary',
      connectionSource: 'FHIR',
      inNetwork: true
    }
  ];

  return mockResults.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.specialty?.toLowerCase().includes(query.toLowerCase())
  );
}

export async function searchPublicProviders(query: string): Promise<Provider[]> {
  await new Promise(resolve => setTimeout(resolve, 500));

  const mockResults: Provider[] = [
    {
      id: crypto.randomUUID(),
      userId: '00000000-0000-0000-0000-000000000000',
      npi: '1234567890',
      name: 'Dr. Emily Rodriguez',
      specialty: 'Dermatology',
      clinic: 'Skin Care Associates',
      phone: '5555556666',
      address: '300 Clear Skin Blvd, Springfield, IL 62706',
      relationship: 'Specialist',
      connectionSource: 'Manual',
      inNetwork: false
    },
    {
      id: crypto.randomUUID(),
      userId: '00000000-0000-0000-0000-000000000000',
      npi: '0987654321',
      name: 'Dr. James Wilson',
      specialty: 'Ophthalmology',
      clinic: 'Vision Center',
      phone: '5557778888',
      address: '400 Eye St, Springfield, IL 62707',
      relationship: 'Specialist',
      connectionSource: 'Manual',
      inNetwork: false
    },
    {
      id: crypto.randomUUID(),
      userId: '00000000-0000-0000-0000-000000000000',
      npi: '1122334455',
      name: 'Dr. Amanda Foster',
      specialty: 'Family Medicine',
      clinic: 'Foster Family Practice',
      phone: '5558889999',
      address: '450 Community Dr, Springfield, IL 62708',
      relationship: 'Primary',
      connectionSource: 'Manual',
      inNetwork: false
    },
    {
      id: crypto.randomUUID(),
      userId: '00000000-0000-0000-0000-000000000000',
      npi: '6677889900',
      name: 'Dr. Brian Park',
      specialty: 'Neurology',
      clinic: 'Springfield Neurology Center',
      phone: '5551112233',
      address: '500 Brain Way, Springfield, IL 62709',
      relationship: 'Specialist',
      connectionSource: 'Manual',
      inNetwork: false
    },
    {
      id: crypto.randomUUID(),
      userId: '00000000-0000-0000-0000-000000000000',
      npi: '3344556677',
      name: 'Dr. Patricia Green',
      specialty: 'Endocrinology',
      clinic: 'Diabetes & Hormone Center',
      phone: '5554445566',
      address: '550 Hormone Ave, Springfield, IL 62710',
      relationship: 'Specialist',
      connectionSource: 'Manual',
      inNetwork: false
    }
  ];

  return mockResults.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.specialty?.toLowerCase().includes(query.toLowerCase())
  );
}

export async function searchInNetworkPharmacies(
  query: string,
  insurancePlanId: string
): Promise<Pharmacy[]> {
  await new Promise(resolve => setTimeout(resolve, 500));

  const mockResults: Pharmacy[] = [
    {
      id: crypto.randomUUID(),
      userId: '00000000-0000-0000-0000-000000000000',
      name: 'CVS Pharmacy #1234',
      chain: 'CVS',
      phone: '5559991111',
      address: '500 Main St, Springfield, IL 62708',
      preferred: false,
      deliveryOptions: ['Pickup', 'Delivery'],
      inNetwork: true
    },
    {
      id: crypto.randomUUID(),
      userId: '00000000-0000-0000-0000-000000000000',
      name: 'Walgreens #5678',
      chain: 'Walgreens',
      phone: '5552223333',
      address: '600 Oak Ave, Springfield, IL 62709',
      preferred: false,
      deliveryOptions: ['Pickup', 'Mail'],
      inNetwork: true
    }
  ];

  return mockResults.filter(ph =>
    ph.name.toLowerCase().includes(query.toLowerCase()) ||
    ph.chain?.toLowerCase().includes(query.toLowerCase())
  );
}

export async function searchPublicPharmacies(query: string): Promise<Pharmacy[]> {
  await new Promise(resolve => setTimeout(resolve, 500));

  const mockResults: Pharmacy[]  = [
    {
      id: crypto.randomUUID(),
      userId: '00000000-0000-0000-0000-000000000000',
      name: 'Community Pharmacy',
      chain: 'Independent',
      phone: '5554445555',
      address: '700 Park Dr, Springfield, IL 62710',
      preferred: false,
      deliveryOptions: ['Pickup'],
      inNetwork: false
    },
    {
      id: crypto.randomUUID(),
      userId: '00000000-0000-0000-0000-000000000000',
      name: 'Rite Aid #9999',
      chain: 'Rite Aid',
      phone: '5556667777',
      address: '800 Elm St, Springfield, IL 62711',
      preferred: false,
      deliveryOptions: ['Pickup', 'Delivery'],
      inNetwork: false
    }
  ];

  return mockResults.filter(ph =>
    ph.name.toLowerCase().includes(query.toLowerCase()) ||
    ph.chain?.toLowerCase().includes(query.toLowerCase())
  );
}

export function mapFhirToProvider(fhirResource: unknown): Provider {
  const resource = fhirResource as any;

  return {
    id: crypto.randomUUID(),
    userId: '00000000-0000-0000-0000-000000000000',
    npi: resource.identifier?.find((id: any) => id.system?.includes('npi'))?.value,
    name: resource.name?.[0]?.text || 'Unknown Provider',
    specialty: resource.specialty?.[0]?.coding?.[0]?.display,
    connectionSource: 'FHIR',
    inNetwork: true
  };
}
