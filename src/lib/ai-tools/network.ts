import { z } from 'zod';
import { supabase } from '../supabase';
import { toolSuccess, toolError, type ToolResult, DEMO_USER_ID } from './types';

export const SearchInNetworkProvidersInputZ = z.object({
  query: z.string().optional(),
  specialty: z.string().optional(),
  relationship: z.enum(['Primary', 'Specialist', 'Dental', 'Vision', 'Therapy', 'Other']).optional(),
  inNetworkOnly: z.boolean().default(false),
  limit: z.number().int().min(1).max(50).default(20),
});

export type SearchInNetworkProvidersInput = z.infer<typeof SearchInNetworkProvidersInputZ>;

export interface CareProviderResult {
  id: string;
  name: string;
  specialty: string | null;
  clinic: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  relationship: string | null;
  connectionSource: string;
  lastVisitDate: string | null;
  inNetwork: boolean | null;
  notes: string | null;
}

export async function searchInNetworkProviders(
  input: SearchInNetworkProvidersInput,
  userId: string
): Promise<ToolResult<CareProviderResult[]>> {
  try {
    const parsed = SearchInNetworkProvidersInputZ.safeParse(input);
    if (!parsed.success) {
      return toolError(`Invalid input: ${parsed.error.issues[0]?.message}`);
    }

    const { query, specialty, relationship, inNetworkOnly, limit } = parsed.data;

    const effectiveUserId = userId || DEMO_USER_ID;

    let dbQuery = supabase
      .from('providers')
      .select('*')
      .eq('user_id', effectiveUserId)
      .order('name', { ascending: true })
      .limit(limit);

    if (inNetworkOnly) {
      dbQuery = dbQuery.eq('in_network', true);
    }

    if (specialty) {
      dbQuery = dbQuery.ilike('specialty', `%${specialty}%`);
    }

    if (relationship) {
      dbQuery = dbQuery.eq('relationship', relationship);
    }

    if (query) {
      dbQuery = dbQuery.or(`name.ilike.%${query}%,specialty.ilike.%${query}%,clinic.ilike.%${query}%`);
    }

    const { data, error } = await dbQuery;

    if (error) {
      return toolError(`Database error: ${error.message}`);
    }

    const providers: CareProviderResult[] = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      specialty: row.specialty,
      clinic: row.clinic,
      phone: row.phone,
      email: row.email,
      address: row.address,
      relationship: row.relationship,
      connectionSource: row.connection_source,
      lastVisitDate: row.last_visit_date,
      inNetwork: row.in_network,
      notes: row.notes,
    }));

    const label = inNetworkOnly ? 'in-network ' : '';
    if (providers.length === 0) {
      return toolSuccess([], `No ${label}providers found${query ? ` matching "${query}"` : ''}.`);
    }

    return toolSuccess(
      providers,
      `Found ${providers.length} ${label}provider${providers.length !== 1 ? 's' : ''}${query ? ` matching "${query}"` : ''}.`
    );
  } catch (err) {
    return toolError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export const SearchPharmaciesInputZ = z.object({
  query: z.string().optional(),
  preferredOnly: z.boolean().default(false),
  inNetworkOnly: z.boolean().default(false),
  limit: z.number().int().min(1).max(50).default(20),
});

export type SearchPharmaciesInput = z.infer<typeof SearchPharmaciesInputZ>;

export interface PharmacyResult {
  id: string;
  name: string;
  chain: string | null;
  phone: string | null;
  address: string | null;
  preferred: boolean;
  deliveryOptions: string[];
  inNetwork: boolean | null;
}

export async function searchPharmacies(
  input: SearchPharmaciesInput,
  userId: string
): Promise<ToolResult<PharmacyResult[]>> {
  try {
    const parsed = SearchPharmaciesInputZ.safeParse(input);
    if (!parsed.success) {
      return toolError(`Invalid input: ${parsed.error.issues[0]?.message}`);
    }

    const { query, preferredOnly, inNetworkOnly, limit } = parsed.data;
    const effectiveUserId = userId || DEMO_USER_ID;

    let dbQuery = supabase
      .from('pharmacies')
      .select('*')
      .eq('user_id', effectiveUserId)
      .order('preferred', { ascending: false })
      .order('name', { ascending: true })
      .limit(limit);

    if (preferredOnly) {
      dbQuery = dbQuery.eq('preferred', true);
    }

    if (inNetworkOnly) {
      dbQuery = dbQuery.eq('in_network', true);
    }

    if (query) {
      dbQuery = dbQuery.or(`name.ilike.%${query}%,chain.ilike.%${query}%,address.ilike.%${query}%`);
    }

    const { data, error } = await dbQuery;

    if (error) {
      return toolError(`Database error: ${error.message}`);
    }

    const pharmacies: PharmacyResult[] = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      chain: row.chain,
      phone: row.phone,
      address: row.address,
      preferred: row.preferred,
      deliveryOptions: row.delivery_options || [],
      inNetwork: row.in_network,
    }));

    return toolSuccess(
      pharmacies,
      `Found ${pharmacies.length} pharmac${pharmacies.length !== 1 ? 'ies' : 'y'}${query ? ` matching "${query}"` : ''}.`
    );
  } catch (err) {
    return toolError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export const AddProviderInputZ = z.object({
  name: z.string().min(1, 'Provider name is required'),
  specialty: z.string().optional(),
  clinic: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  relationship: z.enum(['Primary', 'Specialist', 'Dental', 'Vision', 'Therapy', 'Other']).optional(),
  inNetwork: z.boolean().optional(),
  confirmed: z.boolean(),
});

export type AddProviderInput = z.infer<typeof AddProviderInputZ>;

export async function addProvider(
  input: AddProviderInput,
  userId: string
): Promise<ToolResult<{ id: string; name: string }>> {
  try {
    const parsed = AddProviderInputZ.safeParse(input);
    if (!parsed.success) {
      return toolError(`Invalid input: ${parsed.error.issues[0]?.message}`);
    }

    if (!parsed.data.confirmed) {
      return toolError('Adding a provider requires confirmation. Please confirm to proceed.');
    }

    const effectiveUserId = userId || DEMO_USER_ID;

    const { data, error } = await supabase
      .from('providers')
      .insert({
        user_id: effectiveUserId,
        name: parsed.data.name,
        specialty: parsed.data.specialty || null,
        clinic: parsed.data.clinic || null,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        address: parsed.data.address || null,
        relationship: parsed.data.relationship || null,
        in_network: parsed.data.inNetwork ?? null,
        connection_source: 'Manual',
      })
      .select('id, name')
      .single();

    if (error) {
      return toolError(`Database error: ${error.message}`);
    }

    return toolSuccess(
      { id: data.id, name: data.name },
      `Added ${data.name} to your care network.`
    );
  } catch (err) {
    return toolError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export const SetPreferredPharmacyInputZ = z.object({
  pharmacyId: z.string().min(1, 'Pharmacy ID is required'),
  confirmed: z.boolean(),
});

export type SetPreferredPharmacyInput = z.infer<typeof SetPreferredPharmacyInputZ>;

export async function setPreferredPharmacy(
  input: SetPreferredPharmacyInput,
  userId: string
): Promise<ToolResult<{ pharmacyId: string; preferred: boolean }>> {
  try {
    const parsed = SetPreferredPharmacyInputZ.safeParse(input);
    if (!parsed.success) {
      return toolError(`Invalid input: ${parsed.error.issues[0]?.message}`);
    }

    if (!parsed.data.confirmed) {
      return toolError('Setting preferred pharmacy requires confirmation. Please confirm to proceed.');
    }

    const effectiveUserId = userId || DEMO_USER_ID;

    const { error: clearError } = await supabase
      .from('pharmacies')
      .update({ preferred: false, updated_at: new Date().toISOString() })
      .eq('user_id', effectiveUserId);

    if (clearError) {
      return toolError(`Database error clearing preferred: ${clearError.message}`);
    }

    const { error: setError } = await supabase
      .from('pharmacies')
      .update({ preferred: true, updated_at: new Date().toISOString() })
      .eq('id', parsed.data.pharmacyId)
      .eq('user_id', effectiveUserId);

    if (setError) {
      return toolError(`Database error setting preferred: ${setError.message}`);
    }

    return toolSuccess(
      { pharmacyId: parsed.data.pharmacyId, preferred: true },
      'Preferred pharmacy updated.'
    );
  } catch (err) {
    return toolError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  }
}
