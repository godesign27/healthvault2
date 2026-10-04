import {useState, useEffect, useCallback, useRef} from 'react';
import {supabase} from '../supabase';
import type {CoverageWithProvider} from '../../schemas/insurance';

/** Read only the signed-in owner's coverage; provider omissions must not hide a plan. */
export async function loadInsurance() {
  const {data: auth, error: authError} = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error('Sign in to load insurance.');
  const userId = auth.user.id;
  const {data, error} = await supabase.from('insurance_coverages')
    .select('*, provider:insurance_providers(*)').eq('user_id', userId)
    .order('is_primary', {ascending: false}).order('created_at', {ascending: false});
  if (error) throw error;
  const coverages: CoverageWithProvider[] = (data ?? []).map(c => {
    const p = Array.isArray(c.provider) ? c.provider[0] : c.provider;
    return {
      id: c.id, userId: c.user_id, providerId: c.provider_id,
      planName: c.plan_name, memberId: c.member_id || '', memberIdHash: c.member_id_hash,
      groupNumber: c.group_number, bin: c.bin, pcn: c.pcn, relationship: c.relationship,
      effectiveStart: c.effective_start, effectiveEnd: c.effective_end, isPrimary: c.is_primary,
      verificationStatus: c.verification_status ?? 'needs_attention', lastVerifiedAt: c.last_verified_at,
      source: c.source, coverageStatus: c.coverage_status, stoppedAt: c.stopped_at,
      rawFhir: c.raw_fhir, createdAt: c.created_at, updatedAt: c.updated_at,
      provider: {id: p?.id ?? c.provider_id, name: p?.name ?? 'Insurance provider',
        payerId: p?.payer_id, logoUrl: p?.logo_url, slug: p?.slug ?? 'unknown', isPopular: p?.is_popular ?? false},
    };
  });
  return {userId, coverages};
}
export function useInsuranceData() {
  const [data, setData] = useState<{userId: string | null; coverages: CoverageWithProvider[]}>({userId: null, coverages: []});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const refetch = useCallback(async () => {
    const run = ++generation.current;
    setData({userId: null, coverages: []}); setLoading(true); setError(null);
    try {
      const result = await loadInsurance();
      if (run === generation.current) setData(result);
    } catch {
      if (run === generation.current) setError('Your coverage could not be loaded. Check your connection and try again.');
    } finally {
      if (run === generation.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    let active = true;
    const {data: {subscription}} = supabase.auth.onAuthStateChange(() => {
      generation.current++;
      setData({userId: null, coverages: []}); setLoading(true); setError(null);
      Promise.resolve().then(() => {if (active) void refetch();});
    });
    void refetch();
    return () => {active = false; generation.current++; subscription.unsubscribe();};
  }, [refetch]);
  return {...data, loading, error, refetch};
}
