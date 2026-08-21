import { useState, useEffect, MutableRefObject } from 'react';
import { ShieldCheck, Plus, X } from 'lucide-react';
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
  const [toast, setToast] = useState<{ id: string; message: string; type: 'success' | 'error' } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [analytics] = useState(() => new InsuranceAnalytics());
  const [showAddHint, setShowAddHint] = useState(false);

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
        openAddCoverage: () => setShowAddHint(true),
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
        memberId: c.member_id_hash || '',   // member_id_hash stores the display value
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
      setToast({ id: crypto.randomUUID(), message: 'Failed to load insurance coverages', type: 'error' });
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
      setToast({ id: crypto.randomUUID(), message: 'Primary coverage updated', type: 'success' });
      loadCoverages();
    } catch (error) {
      setToast({ id: crypto.randomUUID(), message: 'Failed to update primary coverage', type: 'error' });
    }
  };

  const handleRefreshVerification = async (coverage: CoverageWithProvider) => {
    try {
      const { error } = await supabase
        .from('insurance_coverages')
        .update({
          verification_status: 'verified',
          last_verified_at: new Date().toISOString(),
        })
        .eq('id', coverage.id);

      if (error) throw error;

      analytics.trackVerifyRefresh(coverage.id!);
      setToast({ id: crypto.randomUUID(), message: 'Coverage verified successfully', type: 'success' });
      loadCoverages();
    } catch (error) {
      setToast({ id: crypto.randomUUID(), message: 'Failed to verify coverage', type: 'error' });
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
      setToast({ id: crypto.randomUUID(), message: 'Coverage removed successfully', type: 'success' });
      loadCoverages();
    } catch (error) {
      setToast({ id: crypto.randomUUID(), message: 'Failed to remove coverage', type: 'error' });
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

      setToast({ id: crypto.randomUUID(), message: 'Coverage stopped successfully', type: 'success' });
      loadCoverages();
    } catch (error) {
      setToast({ id: crypto.randomUUID(), message: 'Failed to stop coverage', type: 'error' });
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

      setToast({ id: crypto.randomUUID(), message: 'Coverage resumed successfully', type: 'success' });
      loadCoverages();
    } catch (error) {
      setToast({ id: crypto.randomUUID(), message: 'Failed to resume coverage', type: 'error' });
    }
  };

  return (
    <div className="w-full p-6 sm:p-8 lg:p-12 pt-20 lg:pt-12">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2 text-content-primary">
            <ShieldCheck className="w-7 h-7" />
            Insurance
          </h1>
          <p className="text-content-secondary">
            Manage your insurance coverage and benefits
          </p>
        </div>
        <button
          onClick={() => setShowAddHint(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex-shrink-0 ml-4"
        >
          <Plus className="w-4 h-4" />
          Add Coverage
        </button>
      </div>

      {showAddHint && (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-lg bg-indigo-50 border border-indigo-200">
          <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-indigo-900">Add coverage via the AI Assistant</p>
            <p className="text-sm text-indigo-700 mt-0.5">
              Open the AI Assistant panel on the right and say "Add my insurance" — it will walk you through adding a new plan.
            </p>
          </div>
          <button onClick={() => setShowAddHint(false)} className="text-indigo-400 hover:text-indigo-600 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-action-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : coverages.length === 0 ? (
        <div className="text-center py-16 hv-surface-card">
          <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-content-tertiary" />
          <h3 className="text-lg font-semibold mb-2 text-content-primary">
            No insurance coverage added
          </h3>
          <p className="text-content-secondary">
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
              onEdit={() => setShowAddHint(true)}
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
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
