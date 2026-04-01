import { supabase } from '../supabase';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';

export interface InsuranceDetail {
  id: string;
  insuranceProviderId: string | null;
  providerName: string;
  providerLogoUrl: string | null;
  planName: string;
  memberId: string;
  isPrimary: boolean;
  status: string;
  connectionStatus: 'connected' | 'inactive';
}

export interface InsuranceContextResult {
  total: number;
  activeCount: number;
  insurance: InsuranceDetail[];
  summary: string;
}

export interface AddressContext {
  fullAddress: string;
  city: string;
  state: string | null;
  postalCode: string | null;
}

export interface CareNetworkProvider {
  id: string;
  name: string;
  specialty: string | null;
  clinic: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  relationship: string | null;
  inNetwork: boolean | null;
  insuranceLabel: string | null;
  connectionSource: string;
  lastVisitDate: string | null;
}

export interface CareNetworkPharmacy {
  id: string;
  name: string;
  chain: string | null;
  address: string | null;
  phone: string | null;
  isPreferred: boolean;
  inNetwork: boolean | null;
  deliveryOptions: string[];
}

export interface CareNetworkResult {
  primaryCare: CareNetworkProvider[];
  specialists: CareNetworkProvider[];
  allProviders: CareNetworkProvider[];
  preferredPharmacy: CareNetworkPharmacy | null;
  allPharmacies: CareNetworkPharmacy[];
  counts: {
    totalProviders: number;
    primaryCare: number;
    specialists: number;
    pharmacies: number;
  };
}

export interface PharmacySearchResult {
  addressContext: AddressContext | null;
  total: number;
  pharmacies: CareNetworkPharmacy[];
  message?: string;
}

export async function fetchInsuranceContext(
  userId = DEMO_USER_ID
): Promise<InsuranceContextResult> {
  const { data, error } = await supabase
    .from('insurance_coverages')
    .select(`
      id, plan_name, member_id_hash, group_number,
      is_primary, coverage_status, verification_status,
      insurance_providers!inner (id, name, logo_url)
    `)
    .eq('user_id', userId)
    .order('is_primary', { ascending: false })
    .order('effective_start', { ascending: false });

  if (error) throw error;

  const insurance: InsuranceDetail[] = (data || []).map((row: any) => ({
    id: row.id,
    insuranceProviderId: row.insurance_providers?.id || null,
    providerName: row.insurance_providers?.name || 'Unknown',
    providerLogoUrl: row.insurance_providers?.logo_url || null,
    planName: row.plan_name,
    memberId: row.member_id_hash,
    isPrimary: row.is_primary,
    status: row.coverage_status,
    connectionStatus: row.coverage_status === 'active' ? 'connected' : 'inactive',
  }));

  const activeCount = insurance.filter(i => i.status === 'active').length;

  return {
    total: insurance.length,
    activeCount,
    insurance,
    summary: activeCount > 0
      ? `You have ${activeCount} active insurance plan${activeCount !== 1 ? 's' : ''}. This can be used to find in-network providers.`
      : 'No active insurance found. You can still search for providers, but in-network filtering won\'t be available.',
  };
}

export async function fetchCareNetwork(
  userId = DEMO_USER_ID
): Promise<CareNetworkResult> {
  let insuranceName: string | null = null;
  const { data: primaryCoverage } = await supabase
    .from('insurance_coverages')
    .select('id, plan_name, coverage_status, insurance_providers!inner(name)')
    .eq('user_id', userId)
    .eq('coverage_status', 'active')
    .eq('is_primary', true)
    .maybeSingle();

  if (primaryCoverage) {
    insuranceName = (primaryCoverage as any).insurance_providers?.name || null;
  }

  const [providersRes, pharmaciesRes] = await Promise.all([
    supabase
      .from('providers')
      .select('*')
      .eq('user_id', userId)
      .order('relationship', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('pharmacies')
      .select('*')
      .eq('user_id', userId)
      .order('preferred', { ascending: false })
      .order('name', { ascending: true }),
  ]);

  if (providersRes.error) throw providersRes.error;
  if (pharmaciesRes.error) throw pharmaciesRes.error;

  const allProviders: CareNetworkProvider[] = (providersRes.data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    specialty: row.specialty || null,
    clinic: row.clinic || null,
    phone: row.phone || null,
    address: row.address || null,
    email: row.email || null,
    relationship: row.relationship || null,
    connectionSource: row.connection_source,
    inNetwork: row.in_network ?? null,
    insuranceLabel: insuranceName && row.in_network
      ? `In-network with ${insuranceName}`
      : row.in_network === false
        ? 'Out of network'
        : null,
    lastVisitDate: row.last_visit_date || null,
  }));

  const primaryCare = allProviders.filter(p => p.relationship === 'Primary');
  const specialists = allProviders.filter(p => p.relationship !== 'Primary');

  const allPharmacies: CareNetworkPharmacy[] = (pharmaciesRes.data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    chain: row.chain || null,
    phone: row.phone || null,
    address: row.address || null,
    isPreferred: row.preferred,
    inNetwork: row.in_network ?? null,
    deliveryOptions: row.delivery_options || [],
  }));

  const preferredPharmacy = allPharmacies.find(p => p.isPreferred) || null;

  return {
    primaryCare,
    specialists,
    allProviders,
    preferredPharmacy,
    allPharmacies,
    counts: {
      totalProviders: allProviders.length,
      primaryCare: primaryCare.length,
      specialists: specialists.length,
      pharmacies: allPharmacies.length,
    },
  };
}

export async function searchNetworkProviders(
  userId = DEMO_USER_ID,
  opts?: { query?: string; specialty?: string; insuranceId?: string; limit?: number }
): Promise<{
  insuranceContext: { providerName: string; planName: string } | null;
  total: number;
  providers: CareNetworkProvider[];
  message?: string;
}> {
  const { query, specialty, insuranceId, limit = 20 } = opts || {};

  let insuranceContext: { providerName: string; planName: string } | null = null;

  if (insuranceId) {
    const { data: coverage } = await supabase
      .from('insurance_coverages')
      .select('id, plan_name, coverage_status, insurance_providers!inner(name)')
      .eq('id', insuranceId)
      .eq('user_id', userId)
      .maybeSingle();
    if (coverage) {
      insuranceContext = {
        providerName: (coverage as any).insurance_providers?.name || 'Unknown',
        planName: coverage.plan_name,
      };
    }
  } else {
    const { data: primaryCoverage } = await supabase
      .from('insurance_coverages')
      .select('id, plan_name, coverage_status, insurance_providers!inner(name)')
      .eq('user_id', userId)
      .eq('coverage_status', 'active')
      .eq('is_primary', true)
      .maybeSingle();
    if (primaryCoverage) {
      insuranceContext = {
        providerName: (primaryCoverage as any).insurance_providers?.name || 'Unknown',
        planName: primaryCoverage.plan_name,
      };
    }
  }

  let dbQuery = supabase
    .from('providers')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true })
    .limit(limit);

  if (specialty) {
    dbQuery = dbQuery.ilike('specialty', `%${specialty}%`);
  }
  if (query) {
    dbQuery = dbQuery.or(
      `name.ilike.%${query}%,specialty.ilike.%${query}%,clinic.ilike.%${query}%`
    );
  }

  const { data, error } = await dbQuery;
  if (error) throw error;

  const providers: CareNetworkProvider[] = (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    specialty: row.specialty || null,
    clinic: row.clinic || null,
    address: row.address || null,
    phone: row.phone || null,
    email: row.email || null,
    relationship: row.relationship || null,
    inNetwork: row.in_network ?? null,
    insuranceLabel: insuranceContext && row.in_network
      ? `In-network with ${insuranceContext.providerName}`
      : row.in_network === false
        ? 'Out of network'
        : null,
    connectionSource: row.connection_source,
    lastVisitDate: row.last_visit_date || null,
  }));

  return {
    insuranceContext,
    total: providers.length,
    providers,
    message: providers.length === 0
      ? `No providers found${query ? ` matching "${query}"` : ''}. You can add providers to your care network.`
      : undefined,
  };
}

export async function fetchNearbyPharmacies(
  userId = DEMO_USER_ID,
  query?: string
): Promise<PharmacySearchResult> {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('address_line1, address_line2, city, state, postal_code')
    .eq('id', userId)
    .maybeSingle();

  let addressContext: AddressContext | null = null;
  if (profile?.address_line1 && profile?.city) {
    const parts = [profile.address_line1];
    if (profile.address_line2) parts.push(profile.address_line2);
    parts.push(`${profile.city}, ${profile.state || ''} ${profile.postal_code || ''}`.trim());
    addressContext = {
      fullAddress: parts.join(', '),
      city: profile.city,
      state: profile.state,
      postalCode: profile.postal_code,
    };
  }

  let dbQuery = supabase
    .from('pharmacies')
    .select('*')
    .eq('user_id', userId)
    .order('preferred', { ascending: false })
    .order('name', { ascending: true })
    .limit(20);

  if (query) {
    dbQuery = dbQuery.or(
      `name.ilike.%${query}%,chain.ilike.%${query}%,address.ilike.%${query}%`
    );
  }

  const { data, error } = await dbQuery;
  if (error) throw error;

  const pharmacies: CareNetworkPharmacy[] = (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    chain: row.chain || null,
    address: row.address || null,
    phone: row.phone || null,
    isPreferred: row.preferred,
    inNetwork: row.in_network ?? null,
    deliveryOptions: row.delivery_options || [],
  }));

  return {
    addressContext,
    total: pharmacies.length,
    pharmacies,
    message: !addressContext
      ? 'No address on file. Add your address in your profile to enable proximity-based pharmacy search.'
      : pharmacies.length === 0
        ? 'No saved pharmacies found. You can add pharmacies to your profile.'
        : undefined,
  };
}

export async function setPreferredPharmacyApi(
  userId = DEMO_USER_ID,
  pharmacyId: string
) {
  const { error: clearError } = await supabase
    .from('pharmacies')
    .update({ preferred: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (clearError) throw clearError;

  const { error: setError } = await supabase
    .from('pharmacies')
    .update({ preferred: true, updated_at: new Date().toISOString() })
    .eq('id', pharmacyId)
    .eq('user_id', userId);

  if (setError) throw setError;
}

export type AddressType = 'home_1' | 'home_2' | 'work';

export interface UserAddress {
  id: string;
  userId: string;
  addressType: AddressType;
  label: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
  isActive: boolean;
}

export interface UserAddressInput {
  addressType: AddressType;
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isActive?: boolean;
}

const ADDRESS_LABELS: Record<AddressType, string> = {
  home_1: 'Home',
  home_2: 'Second Home',
  work: 'Work',
};

function mapAddressRow(row: any): UserAddress {
  return {
    id: row.id,
    userId: row.user_id,
    addressType: row.address_type,
    label: row.label || ADDRESS_LABELS[row.address_type as AddressType] || '',
    addressLine1: row.address_line1,
    addressLine2: row.address_line2 || null,
    city: row.city,
    state: row.state || null,
    postalCode: row.postal_code || null,
    country: row.country || 'US',
    isActive: row.is_active,
  };
}

export async function fetchUserAddresses(
  userId = DEMO_USER_ID
): Promise<UserAddress[]> {
  const { data, error } = await supabase
    .from('user_addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_active', { ascending: false })
    .order('address_type', { ascending: true });

  if (error) throw error;
  return (data || []).map(mapAddressRow);
}

export async function saveUserAddress(
  userId = DEMO_USER_ID,
  input: UserAddressInput
): Promise<UserAddress> {
  const { data, error } = await supabase
    .from('user_addresses')
    .upsert(
      {
        user_id: userId,
        address_type: input.addressType,
        label: input.label || ADDRESS_LABELS[input.addressType],
        address_line1: input.addressLine1,
        address_line2: input.addressLine2 || null,
        city: input.city,
        state: input.state || null,
        postal_code: input.postalCode || null,
        country: input.country || 'US',
        is_active: input.isActive ?? false,
      },
      { onConflict: 'user_id,address_type' }
    )
    .select()
    .single();

  if (error) throw error;
  return mapAddressRow(data);
}

export async function setActiveAddress(
  userId = DEMO_USER_ID,
  addressId: string
): Promise<void> {
  const { error } = await supabase
    .from('user_addresses')
    .update({ is_active: true })
    .eq('id', addressId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function deleteUserAddress(
  userId = DEMO_USER_ID,
  addressId: string
): Promise<void> {
  const { error } = await supabase
    .from('user_addresses')
    .delete()
    .eq('id', addressId)
    .eq('user_id', userId);

  if (error) throw error;
}

export function getActiveAddressContext(addresses: UserAddress[]): AddressContext | null {
  const active = addresses.find(a => a.isActive);
  if (!active || !active.addressLine1 || !active.city) return null;
  const parts = [active.addressLine1];
  if (active.addressLine2) parts.push(active.addressLine2);
  parts.push(`${active.city}, ${active.state || ''} ${active.postalCode || ''}`.trim());
  return {
    fullAddress: parts.join(', '),
    city: active.city,
    state: active.state,
    postalCode: active.postalCode,
  };
}

export async function saveProviderApi(
  userId = DEMO_USER_ID,
  data: {
    name: string;
    specialty?: string;
    clinic?: string;
    phone?: string;
    email?: string;
    address?: string;
    npi?: string;
    providerType?: string;
    relationship?: string;
    inNetwork?: boolean;
  }
) {
  const effectiveRelationship = data.relationship
    || (data.providerType === 'primary_care' ? 'Primary' : undefined)
    || (data.providerType === 'specialist' ? 'Specialist' : undefined)
    || undefined;

  const { data: result, error } = await supabase
    .from('providers')
    .insert({
      user_id: userId,
      npi: data.npi || null,
      name: data.name,
      specialty: data.specialty || null,
      clinic: data.clinic || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      relationship: effectiveRelationship || null,
      in_network: data.inNetwork ?? null,
      connection_source: 'Manual',
    })
    .select()
    .single();

  if (error) throw error;
  return result;
}
