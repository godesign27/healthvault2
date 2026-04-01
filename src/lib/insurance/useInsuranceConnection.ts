import { useState, useCallback } from 'react';
import { Coverage, CoverageZ, hashMemberId } from '../../schemas/insurance';
import { InsuranceAnalytics } from './analytics';
import { supabase } from '../supabase';

type ConnectionState = 'idle' | 'connecting' | 'verifying' | 'success' | 'failure';

interface UseInsuranceConnectionReturn {
  state: ConnectionState;
  error: string | null;
  connect: (coverage: Partial<Coverage>) => Promise<void>;
  reset: () => void;
}

export function useInsuranceConnection(userId: string): UseInsuranceConnectionReturn {
  const [state, setState] = useState<ConnectionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [analytics] = useState(() => new InsuranceAnalytics());

  const connect = useCallback(async (coverageData: Partial<Coverage>) => {
    try {
      setState('connecting');
      setError(null);

      const validatedCoverage = CoverageZ.parse({
        ...coverageData,
        userId,
        memberIdHash: coverageData.memberId ? hashMemberId(coverageData.memberId) : undefined,
      });

      const { data, error: insertError } = await supabase
        .from('insurance_coverages')
        .insert({
          user_id: validatedCoverage.userId,
          provider_id: validatedCoverage.providerId,
          plan_name: validatedCoverage.planName,
          member_id_hash: validatedCoverage.memberIdHash,
          group_number: validatedCoverage.groupNumber || null,
          bin: validatedCoverage.bin || null,
          pcn: validatedCoverage.pcn || null,
          relationship: validatedCoverage.relationship,
          effective_start: validatedCoverage.effectiveStart,
          effective_end: validatedCoverage.effectiveEnd || null,
          is_primary: validatedCoverage.isPrimary,
          verification_status: 'verifying',
          source: validatedCoverage.source,
          raw_fhir: validatedCoverage.rawFhir || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setState('verifying');

      await new Promise(resolve => setTimeout(resolve, 1500));

      const { error: updateError } = await supabase
        .from('insurance_coverages')
        .update({
          verification_status: 'connected',
          last_verified_at: new Date().toISOString(),
        })
        .eq('id', data.id);

      if (updateError) throw updateError;

      await supabase.from('audit_events').insert({
        user_id: userId,
        entity: 'insurance_coverage',
        action: 'create',
        metadata: {
          coverage_id: data.id,
          provider_id: validatedCoverage.providerId,
          source: validatedCoverage.source,
        },
      });

      analytics.trackConnectSuccess(
        validatedCoverage.providerId,
        validatedCoverage.source
      );

      setState('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect insurance';
      setError(errorMessage);
      setState('failure');

      if (coverageData.providerId && coverageData.source) {
        analytics.trackConnectFailed(
          coverageData.providerId,
          coverageData.source,
          errorMessage
        );
      }
    }
  }, [userId, analytics]);

  const reset = useCallback(() => {
    setState('idle');
    setError(null);
  }, []);

  return {
    state,
    error,
    connect,
    reset,
  };
}
