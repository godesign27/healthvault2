import { z } from 'zod';
import { supabase } from '../supabase';
import { toolSuccess, toolError, type ToolResult } from './types';

export const SearchInsuranceProviderInputZ = z.object({
  query: z.string().min(1, 'Search query is required'),
  limit: z.number().int().min(1).max(50).default(20),
});

export type SearchInsuranceProviderInput = z.infer<typeof SearchInsuranceProviderInputZ>;

export interface InsuranceProviderResult {
  id: string;
  name: string;
  payerId: string | null;
  logoUrl: string | null;
  slug: string;
  isPopular: boolean;
}

export async function searchInsuranceProvider(
  input: SearchInsuranceProviderInput,
  _userId: string
): Promise<ToolResult<InsuranceProviderResult[]>> {
  try {
    const parsed = SearchInsuranceProviderInputZ.safeParse(input);
    if (!parsed.success) {
      return toolError(`Invalid input: ${parsed.error.issues[0]?.message}`);
    }

    const { query, limit } = parsed.data;

    const { data, error } = await supabase
      .from('insurance_providers')
      .select('id, name, payer_id, logo_url, slug, is_popular')
      .or(`name.ilike.%${query}%,slug.ilike.%${query}%,payer_id.ilike.%${query}%`)
      .order('is_popular', { ascending: false })
      .order('name', { ascending: true })
      .limit(limit);

    if (error) {
      return toolError(`Database error: ${error.message}`);
    }

    const providers: InsuranceProviderResult[] = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      payerId: row.payer_id,
      logoUrl: row.logo_url,
      slug: row.slug,
      isPopular: row.is_popular,
    }));

    if (providers.length === 0) {
      return toolSuccess([], `No insurance providers found matching "${query}".`);
    }

    return toolSuccess(
      providers,
      `Found ${providers.length} insurance provider${providers.length !== 1 ? 's' : ''} matching "${query}".`
    );
  } catch (err) {
    return toolError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export const GetUserCoveragesInputZ = z.object({
  activeOnly: z.boolean().default(true),
});

export type GetUserCoveragesInput = z.infer<typeof GetUserCoveragesInputZ>;

export interface UserCoverageResult {
  id: string;
  planName: string;
  providerName: string;
  memberIdMasked: string;
  groupNumber: string | null;
  relationship: string;
  isPrimary: boolean;
  verificationStatus: string;
  coverageStatus: string;
  effectiveStart: string;
  effectiveEnd: string | null;
}

export async function getUserCoverages(
  input: GetUserCoveragesInput,
  userId: string
): Promise<ToolResult<UserCoverageResult[]>> {
  try {
    const parsed = GetUserCoveragesInputZ.safeParse(input);
    if (!parsed.success) {
      return toolError(`Invalid input: ${parsed.error.issues[0]?.message}`);
    }

    let query = supabase
      .from('insurance_coverages')
      .select(`
        id, plan_name, member_id_hash, group_number, relationship,
        is_primary, verification_status, coverage_status,
        effective_start, effective_end,
        insurance_providers!inner (name)
      `)
      .eq('user_id', userId)
      .order('is_primary', { ascending: false });

    if (parsed.data.activeOnly) {
      query = query.eq('coverage_status', 'active');
    }

    const { data, error } = await query;

    if (error) {
      return toolError(`Database error: ${error.message}`);
    }

    const coverages: UserCoverageResult[] = (data || []).map((row: any) => ({
      id: row.id,
      planName: row.plan_name,
      providerName: (row.insurance_providers as any)?.name || 'Unknown',
      memberIdMasked: row.member_id_hash ? `****${row.member_id_hash.slice(-4)}` : '****',
      groupNumber: row.group_number,
      relationship: row.relationship,
      isPrimary: row.is_primary,
      verificationStatus: row.verification_status,
      coverageStatus: row.coverage_status,
      effectiveStart: row.effective_start,
      effectiveEnd: row.effective_end,
    }));

    return toolSuccess(
      coverages,
      `Found ${coverages.length} insurance coverage${coverages.length !== 1 ? 's' : ''}.`
    );
  } catch (err) {
    return toolError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export const SetPrimaryInsuranceInputZ = z.object({
  coverageId: z.string().min(1, 'Coverage ID is required'),
  confirmed: z.boolean(),
});

export type SetPrimaryInsuranceInput = z.infer<typeof SetPrimaryInsuranceInputZ>;

export async function setPrimaryInsurance(
  input: SetPrimaryInsuranceInput,
  userId: string
): Promise<ToolResult<{ coverageId: string; isPrimary: boolean }>> {
  try {
    const parsed = SetPrimaryInsuranceInputZ.safeParse(input);
    if (!parsed.success) {
      return toolError(`Invalid input: ${parsed.error.issues[0]?.message}`);
    }

    if (!parsed.data.confirmed) {
      return toolError('Setting primary insurance requires confirmation. Please confirm to proceed.');
    }

    const { error: clearError } = await supabase
      .from('insurance_coverages')
      .update({ is_primary: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (clearError) {
      return toolError(`Database error clearing primary: ${clearError.message}`);
    }

    const { error: setError } = await supabase
      .from('insurance_coverages')
      .update({ is_primary: true, updated_at: new Date().toISOString() })
      .eq('id', parsed.data.coverageId)
      .eq('user_id', userId);

    if (setError) {
      return toolError(`Database error setting primary: ${setError.message}`);
    }

    return toolSuccess(
      { coverageId: parsed.data.coverageId, isPrimary: true },
      'Primary insurance updated successfully.'
    );
  } catch (err) {
    return toolError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export const VerifyInsuranceInputZ = z.object({
  coverageId: z.string().min(1, 'Coverage ID is required'),
});

export type VerifyInsuranceInput = z.infer<typeof VerifyInsuranceInputZ>;

export async function verifyInsurance(
  input: VerifyInsuranceInput,
  userId: string
): Promise<ToolResult<{ coverageId: string; verificationStatus: string }>> {
  try {
    const parsed = VerifyInsuranceInputZ.safeParse(input);
    if (!parsed.success) {
      return toolError(`Invalid input: ${parsed.error.issues[0]?.message}`);
    }

    const { data: coverage, error: fetchError } = await supabase
      .from('insurance_coverages')
      .select('id, verification_status')
      .eq('id', parsed.data.coverageId)
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      return toolError(`Database error: ${fetchError.message}`);
    }

    if (!coverage) {
      return toolError('Coverage not found or you do not have access.');
    }

    const { error: updateError } = await supabase
      .from('insurance_coverages')
      .update({
        verification_status: 'verified',
        last_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', parsed.data.coverageId)
      .eq('user_id', userId);

    if (updateError) {
      return toolError(`Database error: ${updateError.message}`);
    }

    return toolSuccess(
      { coverageId: parsed.data.coverageId, verificationStatus: 'verified' },
      'Insurance coverage marked as verified.'
    );
  } catch (err) {
    return toolError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  }
}
