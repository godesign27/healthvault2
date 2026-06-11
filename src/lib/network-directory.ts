import {
  orgToDirectoryProvider,
  searchProviderOrganizationsClient,
} from './network/organization-directory';

export interface DirectoryProvider {
  id: string;
  name: string;
  specialty: string;
  category: string;
  clinic: string;
  phone: string;
  address: string;
  npi: string;
  acceptingNewPatients: boolean;
  languages: string[];
  distance: string;
}

export interface NearbyPharmacyResult {
  id: string;
  name: string;
  chain: string;
  address: string;
  phone: string;
  distance: string;
  lat: number;
  lng: number;
  hours: string;
  inNetwork: boolean;
  deliveryOptions: ('Pickup' | 'Delivery' | 'Mail')[];
}

export const SPECIALTY_CATEGORIES = [
  'All',
  'Health System',
  'Primary Care',
  'Cardiology',
  'Dermatology',
  'Orthopedics',
  'Pediatrics',
  'OB/GYN',
  'Neurology',
  'Gastroenterology',
  'Ophthalmology',
  'ENT',
  'Psychiatry',
  'Urgent Care',
];

const PHARMACY_DATA: NearbyPharmacyResult[] = [
  {
    id: 'pharm-001', name: 'CVS Pharmacy', chain: 'CVS',
    address: '123 Main St, Springfield, IL 62701', phone: '(555) 100-2001',
    distance: '0.3 mi', lat: 39.7840, lng: -89.6480,
    hours: 'Mon-Sat 8am-10pm, Sun 9am-7pm', inNetwork: true,
    deliveryOptions: ['Pickup', 'Delivery'],
  },
  {
    id: 'pharm-002', name: 'Walgreens', chain: 'Walgreens',
    address: '456 Oak Ave, Springfield, IL 62702', phone: '(555) 200-3002',
    distance: '0.5 mi', lat: 39.7790, lng: -89.6520,
    hours: 'Mon-Fri 7am-10pm, Sat-Sun 8am-9pm', inNetwork: true,
    deliveryOptions: ['Pickup', 'Mail'],
  },
  {
    id: 'pharm-003', name: 'Community Health Pharmacy', chain: 'Independent',
    address: '89 Wellness Dr, Springfield, IL 62703', phone: '(555) 300-4003',
    distance: '0.4 mi', lat: 39.7825, lng: -89.6460,
    hours: 'Mon-Fri 9am-7pm, Sat 9am-3pm', inNetwork: true,
    deliveryOptions: ['Pickup'],
  },
  {
    id: 'pharm-004', name: 'Rite Aid Pharmacy', chain: 'Rite Aid',
    address: '789 Elm St, Springfield, IL 62704', phone: '(555) 400-5004',
    distance: '0.7 mi', lat: 39.7860, lng: -89.6540,
    hours: 'Mon-Sat 8am-9pm, Sun 10am-6pm', inNetwork: true,
    deliveryOptions: ['Pickup', 'Delivery'],
  },
  {
    id: 'pharm-005', name: 'Walmart Pharmacy', chain: 'Walmart',
    address: '2100 Veterans Pkwy, Springfield, IL 62704', phone: '(555) 500-6005',
    distance: '0.9 mi', lat: 39.7770, lng: -89.6420,
    hours: 'Mon-Sat 9am-9pm, Sun 10am-6pm', inNetwork: true,
    deliveryOptions: ['Pickup'],
  },
  {
    id: 'pharm-006', name: 'Target Pharmacy', chain: 'Target',
    address: '3100 S Dirksen Pkwy, Springfield, IL 62703', phone: '(555) 600-7006',
    distance: '1.1 mi', lat: 39.7750, lng: -89.6380,
    hours: 'Mon-Fri 9am-8pm, Sat 9am-6pm, Sun 11am-5pm', inNetwork: true,
    deliveryOptions: ['Pickup'],
  },
  {
    id: 'pharm-007', name: 'Costco Pharmacy', chain: 'Costco',
    address: '3600 Freedom Dr, Springfield, IL 62704', phone: '(555) 700-8007',
    distance: '1.4 mi', lat: 39.7900, lng: -89.6600,
    hours: 'Mon-Fri 10am-8:30pm, Sat 9:30am-6pm', inNetwork: false,
    deliveryOptions: ['Pickup'],
  },
  {
    id: 'pharm-008', name: 'Express Scripts Mail Pharmacy', chain: 'Express Scripts',
    address: 'Mail Order Service', phone: '(800) 555-0199',
    distance: 'Mail', lat: 39.7817, lng: -89.6501,
    hours: 'Order anytime, delivery in 3-5 days', inNetwork: true,
    deliveryOptions: ['Mail'],
  },
];

export async function getInNetworkDirectory(): Promise<DirectoryProvider[]> {
  const orgs = await searchProviderOrganizationsClient(undefined, 50);
  return orgs.map(orgToDirectoryProvider);
}

export async function getNearbyPharmacies(): Promise<NearbyPharmacyResult[]> {
  await new Promise((r) => setTimeout(r, 400));
  return PHARMACY_DATA;
}
