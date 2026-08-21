import { ShieldCheck, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { CoverageWithProvider } from '../../schemas/insurance';
import { StatusBadge } from './StatusBadge';
import { supabase } from '../../lib/supabase';

interface InsuranceSummaryProps {
  userId: string;
  darkMode?: boolean;
  onViewAll?: () => void;
}

export function InsuranceSummary({ userId, darkMode = false, onViewAll }: InsuranceSummaryProps) {
  const [primaryCoverage, setPrimaryCoverage] = useState<CoverageWithProvider | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrimaryCoverage();
  }, [userId]);

  const loadPrimaryCoverage = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('insurance_coverages')
        .select(`
          *,
          provider:insurance_providers(*)
        `)
        .eq('user_id', userId)
        .eq('is_primary', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const mapped: CoverageWithProvider = {
          id: data.id,
          userId: data.user_id,
          providerId: data.provider_id,
          planName: data.plan_name,
          memberId: '',
          memberIdHash: data.member_id_hash,
          groupNumber: data.group_number,
          bin: data.bin,
          pcn: data.pcn,
          relationship: data.relationship,
          effectiveStart: data.effective_start,
          effectiveEnd: data.effective_end,
          isPrimary: data.is_primary,
          verificationStatus: data.verification_status,
          lastVerifiedAt: data.last_verified_at,
          source: data.source,
          rawFhir: data.raw_fhir,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          provider: {
            id: data.provider.id,
            name: data.provider.name,
            payerId: data.provider.payer_id,
            logoUrl: data.provider.logo_url,
            slug: data.provider.slug,
            isPopular: data.provider.is_popular,
          },
        };
        setPrimaryCoverage(mapped);
      }
    } catch (error) {
      console.error('Error loading primary coverage:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className={
          darkMode ? 'hv-surface-card p-6' : 'rounded-xl border border-stroke-subtle bg-surface-sunken p-6'
        }
      >
        <div className="animate-pulse">
          <div className={`h-4 rounded w-32 mb-4 ${
            darkMode ? 'bg-surface-sunken' : 'bg-surface-overlay'
          }`} />
          <div className={`h-8 rounded w-full ${
            darkMode ? 'bg-surface-sunken' : 'bg-surface-overlay'
          }`} />
        </div>
      </div>
    );
  }

  if (!primaryCoverage) {
    return (
      <div
        className={
          darkMode ? 'hv-surface-card p-6' : 'rounded-xl border border-stroke-subtle bg-surface-sunken p-6'
        }
      >
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className={`w-5 h-5 ${
            darkMode ? 'text-content-secondary' : 'text-content-secondary'
          }`} />
          <h3 className={`font-semibold ${
            darkMode ? 'text-white' : 'text-content-primary'
          }`}>
            Primary Insurance
          </h3>
        </div>
        <p className={`text-sm mb-4 ${
          darkMode ? 'text-content-secondary' : 'text-content-secondary'
        }`}>
          No primary insurance coverage on file
        </p>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Add Insurance Coverage
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={
        darkMode ? 'hv-surface-card p-6' : 'rounded-xl border border-stroke-subtle bg-surface-sunken p-6'
      }
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className={`w-5 h-5 ${
            darkMode ? 'text-content-secondary' : 'text-content-secondary'
          }`} />
          <h3 className={`font-semibold ${
            darkMode ? 'text-white' : 'text-content-primary'
          }`}>
            Primary Insurance
          </h3>
        </div>
        <StatusBadge status={primaryCoverage.verificationStatus} darkMode={darkMode} />
      </div>

      <div className="flex items-start gap-3 mb-4">
        {primaryCoverage.provider.logoUrl && (
          <img
            src={primaryCoverage.provider.logoUrl}
            alt={primaryCoverage.provider.name}
            className="w-10 h-10 rounded-lg"
          />
        )}
        <div>
          <h4 className={`font-semibold mb-1 ${
            darkMode ? 'text-white' : 'text-content-primary'
          }`}>
            {primaryCoverage.provider.name}
          </h4>
          <p className={`text-sm ${
            darkMode ? 'text-content-secondary' : 'text-content-secondary'
          }`}>
            {primaryCoverage.planName}
          </p>
        </div>
      </div>

      {primaryCoverage.groupNumber && (
        <div className="mb-3">
          <p className={`text-xs mb-1 ${
            darkMode ? 'text-content-secondary' : 'text-content-secondary'
          }`}>
            Group Number
          </p>
          <p className={`font-mono text-sm ${
            darkMode ? 'text-content-primary' : 'text-content-primary'
          }`}>
            {primaryCoverage.groupNumber}
          </p>
        </div>
      )}

      {onViewAll && (
        <button
          onClick={onViewAll}
          className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors mt-4"
        >
          View All Coverage
          <ExternalLink className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
