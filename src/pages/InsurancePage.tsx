import { useState, useEffect, MutableRefObject } from 'react';
import { ShieldCheck } from 'lucide-react';
import { CoverageCard } from '../components/insurance/CoverageCard';
import { CoverageWithProvider } from '../schemas/insurance';
import { InsuranceAnalytics } from '../lib/insurance/analytics';
import { supabase } from '../lib/supabase';
import { Toast } from '../components/Toast';

interface InsurancePageProps {
  darkMode?: boolean;
  actionsRef?: MutableRefObject<{
    openAddCoverage?: () => void;
    refreshData?: () => void;
  }>;
}

export function InsurancePage({ darkMode = false, actionsRef }: InsurancePageProps) {
  const [coverages, setCoverages] = useState<CoverageWithProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [analytics] = useState(() => new InsuranceAnalytics());

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) loadCoverages(uid);
      else setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (actionsRef) {
      actionsRef.current = {
        openAddCoverage: () => {}, // Handler removed - managed by AI Assistant
        refreshData: loadCoverages
      };
    }
  }, [actionsRef]);

  const loadCoverages = async (uid?: string) => {
    const activeUserId = uid ?? userId;
    if (!activeUserId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('insurance_coverages')
        .select(`
          *,
          provider:insurance_providers(*)
        `)
        .eq('user_id', activeUserId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: CoverageWithProvider[] = (data || []).map((c: any) => ({
        id: c.id,
        userId: c.user_id,
        providerId: c.provider_id,
        planName: c.plan_name,
        memberId: '',
        memberIdHash: c.member_id_hash,
        groupNumber: c.group_number,
        bin: c.bin,
        pcn: c.pcn,
        relationship: c.relationship,
        effectiveStart: c.effective_start,
        effectiveEnd: c.effective_end,
        isPrimary: c.is_primary,
        verificationStatus: c.verification_status,
        lastVerifiedAt: c.last_verified_at,
        source: c.source,
        coverageStatus: c.coverage_status,
        stoppedAt: c.stopped_at,
        rawFhir: c.raw_fhir,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        provider: {
          id: c.provider.id,
          name: c.provider.name,
          payerId: c.provider.payer_id,
          logoUrl: c.provider.logo_url,
          slug: c.provider.slug,
          isPopular: c.provider.is_popular,
        },
      }));

      setCoverages(mapped);
    } catch (error) {
      console.error('Error loading coverages:', error);
      setToast({ message: 'Failed to load insurance coverages', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrimary = async (coverage: CoverageWithProvider) => {
    try {
      await supabase.from('insurance_coverages').update({ is_primary: false }).eq('user_id', userId);

      const { error } = await supabase
        .from('insurance_coverages')
        .update({ is_primary: true })
        .eq('id', coverage.id);

      if (error) throw error;

      analytics.trackSetPrimary(coverage.id!);
      setToast({ message: 'Primary coverage updated', type: 'success' });
      loadCoverages();
    } catch (error) {
      setToast({ message: 'Failed to update primary coverage', type: 'error' });
    }
  };

  const handleRefreshVerification = async (coverage: CoverageWithProvider) => {
    try {
      const { error } = await supabase
        .from('insurance_coverages')
        .update({
          verification_status: 'connected',
          last_verified_at: new Date().toISOString(),
        })
        .eq('id', coverage.id);

      if (error) throw error;

      analytics.trackVerifyRefresh(coverage.id!);
      setToast({ message: 'Coverage verified successfully', type: 'success' });
      loadCoverages();
    } catch (error) {
      setToast({ message: 'Failed to verify coverage', type: 'error' });
    }
  };

  const handleDelete = async (coverage: CoverageWithProvider) => {
    if (!confirm('Are you sure you want to remove this coverage?')) return;

    try {
      const { error } = await supabase
        .from('insurance_coverages')
        .delete()
        .eq('id', coverage.id);

      if (error) throw error;

      analytics.trackDelete(coverage.id!);
      setToast({ message: 'Coverage removed successfully', type: 'success' });
      loadCoverages();
    } catch (error) {
      setToast({ message: 'Failed to remove coverage', type: 'error' });
    }
  };

  const handleStopCoverage = async (coverage: CoverageWithProvider) => {
    try {
      const { error } = await supabase
        .from('insurance_coverages')
        .update({
          coverage_status: 'stopped',
          stopped_at: new Date().toISOString(),
          is_primary: false,
        })
        .eq('id', coverage.id);

      if (error) throw error;

      setToast({ message: 'Coverage stopped successfully', type: 'success' });
      loadCoverages();
    } catch (error) {
      setToast({ message: 'Failed to stop coverage', type: 'error' });
    }
  };

  const handleResumeCoverage = async (coverage: CoverageWithProvider) => {
    try {
      const { error } = await supabase
        .from('insurance_coverages')
        .update({
          coverage_status: 'active',
          stopped_at: null,
        })
        .eq('id', coverage.id);

      if (error) throw error;

      setToast({ message: 'Coverage resumed successfully', type: 'success' });
      loadCoverages();
    } catch (error) {
      setToast({ message: 'Failed to resume coverage', type: 'error' });
    }
  };

  return (
    <div className="w-full p-6 sm:p-8 lg:p-12 pt-14 lg:pt-12">
      <div className="mb-8">
        <h1 className={`text-2xl font-bold mb-2 flex items-center gap-2 ${
          darkMode ? 'text-white' : 'text-stone-900'
        }`}>
          <ShieldCheck className="w-7 h-7" />
          Insurance
        </h1>
        <p className={darkMode ? 'text-stone-400' : 'text-stone-600'}>
          Manage your insurance coverage and benefits
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : coverages.length === 0 ? (
        <div className={`text-center py-16 rounded-xl border ${
          darkMode ? 'border-stone-800' : 'border-stone-200'
        }`}>
          <ShieldCheck className={`w-16 h-16 mx-auto mb-4 ${
            darkMode ? 'text-stone-700' : 'text-stone-300'
          }`} />
          <h3 className={`text-lg font-semibold mb-2 ${
            darkMode ? 'text-white' : 'text-stone-900'
          }`}>
            No insurance coverage added
          </h3>
          <p className={`${darkMode ? 'text-stone-400' : 'text-stone-600'}`}>
            Use the AI Assistant to add your insurance information
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {coverages.map((coverage) => (
            <CoverageCard
              key={coverage.id}
              coverage={coverage}
              darkMode={darkMode}
              showActions
              onSetPrimary={handleSetPrimary}
              onRefreshVerification={handleRefreshVerification}
              onStopCoverage={handleStopCoverage}
              onResumeCoverage={handleResumeCoverage}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
