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

const DIRECTORY_DATA: DirectoryProvider[] = [
  {
    id: 'dir-001', name: 'Dr. Sarah Johnson', specialty: 'Internal Medicine', category: 'Primary Care',
    clinic: 'Springfield Medical Group', phone: '(555) 111-2222',
    address: '100 Health Plaza, Springfield, IL 62704',
    npi: '1234567001', acceptingNewPatients: true, languages: ['English', 'Spanish'], distance: '1.2 mi',
  },
  {
    id: 'dir-002', name: 'Dr. Robert Martinez', specialty: 'Family Medicine', category: 'Primary Care',
    clinic: 'Springfield Family Health', phone: '(555) 123-4567',
    address: '150 Family Care Dr, Springfield, IL 62704',
    npi: '1234567002', acceptingNewPatients: true, languages: ['English', 'Spanish'], distance: '1.5 mi',
  },
  {
    id: 'dir-003', name: 'Dr. Lisa Thompson', specialty: 'Family Medicine', category: 'Primary Care',
    clinic: 'Community Health Center', phone: '(555) 987-6543',
    address: '75 Wellness Way, Springfield, IL 62703',
    npi: '1234567003', acceptingNewPatients: true, languages: ['English'], distance: '0.8 mi',
  },
  {
    id: 'dir-004', name: 'Dr. David Kumar', specialty: 'Internal Medicine', category: 'Primary Care',
    clinic: 'Capital City Primary Care', phone: '(555) 369-1470',
    address: '125 Capitol Ave, Springfield, IL 62702',
    npi: '1234567004', acceptingNewPatients: false, languages: ['English', 'Hindi'], distance: '2.1 mi',
  },
  {
    id: 'dir-005', name: 'Dr. Rachel Adams', specialty: 'Family Medicine', category: 'Primary Care',
    clinic: 'Adams Family Practice', phone: '(555) 222-3333',
    address: '200 Oak Park Rd, Springfield, IL 62704',
    npi: '1234567005', acceptingNewPatients: true, languages: ['English', 'French'], distance: '1.8 mi',
  },
  {
    id: 'dir-006', name: 'Dr. Jennifer Lee', specialty: 'Cardiology', category: 'Cardiology',
    clinic: 'Heart & Vascular Institute', phone: '(555) 246-8135',
    address: '300 Heart Lane, Springfield, IL 62706',
    npi: '1234567006', acceptingNewPatients: true, languages: ['English', 'Korean'], distance: '3.2 mi',
  },
  {
    id: 'dir-007', name: 'Dr. William Park', specialty: 'Cardiology', category: 'Cardiology',
    clinic: 'Springfield Cardiology Associates', phone: '(555) 333-4444',
    address: '310 Cardiac Way, Springfield, IL 62706',
    npi: '1234567007', acceptingNewPatients: true, languages: ['English'], distance: '3.5 mi',
  },
  {
    id: 'dir-008', name: 'Dr. Angela Torres', specialty: 'Interventional Cardiology', category: 'Cardiology',
    clinic: 'Heart & Vascular Institute', phone: '(555) 246-8136',
    address: '300 Heart Lane, Springfield, IL 62706',
    npi: '1234567008', acceptingNewPatients: false, languages: ['English', 'Spanish'], distance: '3.2 mi',
  },
  {
    id: 'dir-009', name: 'Dr. Nathan Cole', specialty: 'Dermatology', category: 'Dermatology',
    clinic: 'Clear Skin Dermatology', phone: '(555) 444-5555',
    address: '400 Skin Care Blvd, Springfield, IL 62707',
    npi: '1234567009', acceptingNewPatients: true, languages: ['English'], distance: '2.4 mi',
  },
  {
    id: 'dir-010', name: 'Dr. Maria Santos', specialty: 'Dermatology', category: 'Dermatology',
    clinic: 'Springfield Dermatology Center', phone: '(555) 555-6666',
    address: '410 Dermis Dr, Springfield, IL 62707',
    npi: '1234567010', acceptingNewPatients: true, languages: ['English', 'Portuguese'], distance: '2.7 mi',
  },
  {
    id: 'dir-011', name: 'Dr. Michael Chen', specialty: 'Orthopedic Surgery', category: 'Orthopedics',
    clinic: 'Orthopedic Specialists of Springfield', phone: '(555) 333-4445',
    address: '200 Bone & Joint Dr, Springfield, IL 62705',
    npi: '1234567011', acceptingNewPatients: true, languages: ['English', 'Mandarin'], distance: '2.9 mi',
  },
  {
    id: 'dir-012', name: 'Dr. Alan Brooks', specialty: 'Sports Medicine', category: 'Orthopedics',
    clinic: 'Springfield Sports Medicine', phone: '(555) 666-7777',
    address: '220 Athletic Way, Springfield, IL 62705',
    npi: '1234567012', acceptingNewPatients: true, languages: ['English'], distance: '3.1 mi',
  },
  {
    id: 'dir-013', name: 'Dr. Sofia Patel', specialty: 'Pediatrics', category: 'Pediatrics',
    clinic: "Children's Medical Group", phone: '(555) 777-8888',
    address: '500 Kids Way, Springfield, IL 62702',
    npi: '1234567013', acceptingNewPatients: true, languages: ['English', 'Gujarati'], distance: '1.9 mi',
  },
  {
    id: 'dir-014', name: 'Dr. James Wright', specialty: 'Pediatrics', category: 'Pediatrics',
    clinic: 'Springfield Pediatric Associates', phone: '(555) 888-9999',
    address: '510 Children Blvd, Springfield, IL 62702',
    npi: '1234567014', acceptingNewPatients: true, languages: ['English'], distance: '2.2 mi',
  },
  {
    id: 'dir-015', name: 'Dr. Amanda Foster', specialty: 'Obstetrics & Gynecology', category: 'OB/GYN',
    clinic: "Women's Health Associates", phone: '(555) 111-3333',
    address: '600 Womens Health Dr, Springfield, IL 62703',
    npi: '1234567015', acceptingNewPatients: true, languages: ['English'], distance: '1.6 mi',
  },
  {
    id: 'dir-016', name: 'Dr. Priya Sharma', specialty: 'Obstetrics & Gynecology', category: 'OB/GYN',
    clinic: "Prairie Women's Care", phone: '(555) 222-4444',
    address: '610 Prairie Rd, Springfield, IL 62703',
    npi: '1234567016', acceptingNewPatients: true, languages: ['English', 'Hindi'], distance: '2.0 mi',
  },
  {
    id: 'dir-017', name: 'Dr. Brian Park', specialty: 'Neurology', category: 'Neurology',
    clinic: 'Springfield Neurology Center', phone: '(555) 333-5555',
    address: '700 Brain Way, Springfield, IL 62709',
    npi: '1234567017', acceptingNewPatients: true, languages: ['English', 'Korean'], distance: '3.8 mi',
  },
  {
    id: 'dir-018', name: 'Dr. Catherine Hayes', specialty: 'Neurology', category: 'Neurology',
    clinic: 'Capital Neuroscience', phone: '(555) 444-6666',
    address: '710 Neural Ave, Springfield, IL 62709',
    npi: '1234567018', acceptingNewPatients: false, languages: ['English'], distance: '4.1 mi',
  },
  {
    id: 'dir-019', name: 'Dr. Steven Yu', specialty: 'Gastroenterology', category: 'Gastroenterology',
    clinic: 'Springfield GI Associates', phone: '(555) 555-7777',
    address: '800 Digestive Dr, Springfield, IL 62710',
    npi: '1234567019', acceptingNewPatients: true, languages: ['English', 'Mandarin'], distance: '2.6 mi',
  },
  {
    id: 'dir-020', name: 'Dr. Diane Mitchell', specialty: 'Gastroenterology', category: 'Gastroenterology',
    clinic: 'GI Health Center', phone: '(555) 666-8888',
    address: '810 GI Blvd, Springfield, IL 62710',
    npi: '1234567020', acceptingNewPatients: true, languages: ['English'], distance: '3.0 mi',
  },
  {
    id: 'dir-021', name: 'Dr. Karina Santos', specialty: 'Ophthalmology', category: 'Ophthalmology',
    clinic: 'Springfield Eye Center', phone: '(555) 777-9999',
    address: '900 Vision Way, Springfield, IL 62711',
    npi: '1234567021', acceptingNewPatients: true, languages: ['English', 'Portuguese'], distance: '2.3 mi',
  },
  {
    id: 'dir-022', name: 'Dr. Howard Phillips', specialty: 'Ophthalmology', category: 'Ophthalmology',
    clinic: 'Phillips Eye Associates', phone: '(555) 888-0000',
    address: '910 Eye St, Springfield, IL 62711',
    npi: '1234567022', acceptingNewPatients: true, languages: ['English'], distance: '2.8 mi',
  },
  {
    id: 'dir-023', name: 'Dr. Thomas Grant', specialty: 'Otolaryngology (ENT)', category: 'ENT',
    clinic: 'Springfield ENT Specialists', phone: '(555) 999-1111',
    address: '1000 ENT Blvd, Springfield, IL 62712',
    npi: '1234567023', acceptingNewPatients: true, languages: ['English'], distance: '3.5 mi',
  },
  {
    id: 'dir-024', name: 'Dr. Laura Bennett', specialty: 'Otolaryngology (ENT)', category: 'ENT',
    clinic: 'Capital ENT Group', phone: '(555) 000-2222',
    address: '1010 ENT Way, Springfield, IL 62712',
    npi: '1234567024', acceptingNewPatients: true, languages: ['English', 'French'], distance: '3.8 mi',
  },
  {
    id: 'dir-025', name: 'Dr. Rebecca Kim', specialty: 'Psychiatry', category: 'Psychiatry',
    clinic: 'Springfield Behavioral Health', phone: '(555) 111-4444',
    address: '1100 Mental Health Dr, Springfield, IL 62713',
    npi: '1234567025', acceptingNewPatients: true, languages: ['English', 'Korean'], distance: '2.0 mi',
  },
  {
    id: 'dir-026', name: 'Dr. Daniel Okafor', specialty: 'Psychiatry', category: 'Psychiatry',
    clinic: 'Mind & Wellness Center', phone: '(555) 222-5555',
    address: '1110 Wellness Ave, Springfield, IL 62713',
    npi: '1234567026', acceptingNewPatients: true, languages: ['English'], distance: '2.5 mi',
  },
  {
    id: 'dir-027', name: 'Springfield Urgent Care Center', specialty: 'Urgent Care', category: 'Urgent Care',
    clinic: 'Springfield Urgent Care', phone: '(555) 333-6666',
    address: '1200 Quick Care Blvd, Springfield, IL 62704',
    npi: '1234567027', acceptingNewPatients: true, languages: ['English', 'Spanish'], distance: '0.6 mi',
  },
  {
    id: 'dir-028', name: 'CareFirst Express Clinic', specialty: 'Urgent Care', category: 'Urgent Care',
    clinic: 'CareFirst Express', phone: '(555) 444-7777',
    address: '1210 Express Way, Springfield, IL 62704',
    npi: '1234567028', acceptingNewPatients: true, languages: ['English'], distance: '1.0 mi',
  },
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
  await new Promise(r => setTimeout(r, 300));
  return DIRECTORY_DATA;
}

export async function getNearbyPharmacies(): Promise<NearbyPharmacyResult[]> {
  await new Promise(r => setTimeout(r, 400));
  return PHARMACY_DATA;
}
