import {useInsuranceMutation} from '../../packages/api-client/src/useInsuranceMutation';
import {useInsuranceData} from '../lib/insurance/useInsuranceData';
import {insuranceVerificationNotice} from '../../packages/api-client/src/insurance-status';
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
  const {coverages, loading, error: loadError, userId, refetch: loadCoverages} = useInsuranceData();
  const [toast, setToast] = useState<{ id: string; message: string; type: 'success' | 'error' } | null>(null);
  const [analytics] = useState(() => new InsuranceAnalytics());
  const [showAddHint, setShowAddHint] = useState(false);

  useEffect(() => {
    if (actionsRef) {
      actionsRef.current = {
        openAddCoverage: () => setShowAddHint(true),
        refreshData: loadCoverages
      };
    }
    return () => { if (actionsRef) actionsRef.current = {}; };
  }, [actionsRef, loadCoverages]);

  const {busy, run} = useInsuranceMutation(supabase,
    (message, type) => setToast({id: crypto.randomUUID(), message, type}),
    loadCoverages, () => setToast(null));
  const handleSetPrimary = async (coverage: CoverageWithProvider) => {
    if (await run(userId, coverage.id, 'primary')) analytics.trackSetPrimary(coverage.id!);
  };
  const handleDelete = async (coverage: CoverageWithProvider) => {
    if (busy || !confirm('Remove this saved coverage from Health Vault? This does not cancel your insurance.')) return;
    if (await run(userId, coverage.id, 'remove')) analytics.trackDelete(coverage.id!);
  };
  const handleStopCoverage = (coverage: CoverageWithProvider) => {void run(userId, coverage.id, 'stop');};
  const handleResumeCoverage = (coverage: CoverageWithProvider) => {void run(userId, coverage.id, 'resume');};

  return (
    <div className="w-full p-6 sm:p-8 lg:p-12 pt-20 lg:pt-12">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2 text-content-primary">
            <ShieldCheck className="w-7 h-7" />
            Insurance
          </h1>
          <p className="text-content-secondary">
            Manage your saved insurance information
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
          <button aria-label="Dismiss insurance instructions" onClick={() => setShowAddHint(false)} className="text-indigo-400 hover:text-indigo-600 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <p className="mb-6 text-content-secondary">{insuranceVerificationNotice}</p>
      {busy && <p role="status" className="mb-4 text-content-secondary">Updating saved coverage…</p>}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span role="status" className="sr-only">Loading insurance</span>
          <div aria-hidden="true" className="w-8 h-8 border-4 border-action-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : loadError ? (
        <div role="alert" className="hv-surface-card p-6">
          <p className="text-content-primary">{loadError}</p>
          <button onClick={() => void loadCoverages()} className="mt-4 min-h-12 px-4 rounded-lg bg-action-primary text-white">Retry</button>
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
              onSaveMemberId={(coverage, value) => run(userId, coverage.id, 'memberId', value)}
              busy={busy}
              showActions
              onEdit={() => setShowAddHint(true)}
              onSetPrimary={handleSetPrimary}
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
