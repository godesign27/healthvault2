import {insuranceMemberIdFields} from '../../../packages/api-client/src/insurance-status';
import { useState, useCallback } from 'react';
import { Coverage, CoverageZ } from '../../schemas/insurance';
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
      });

      const { data, error: insertError } = await supabase
        .from('insurance_coverages')
        .insert({
          user_id: validatedCoverage.userId,
          provider_id: validatedCoverage.providerId,
          plan_name: validatedCoverage.planName,
          ...insuranceMemberIdFields(validatedCoverage.memberId),
          group_number: validatedCoverage.groupNumber || null,
          bin: validatedCoverage.bin || null,
          pcn: validatedCoverage.pcn || null,
          relationship: validatedCoverage.relationship,
          effective_start: validatedCoverage.effectiveStart,
          effective_end: validatedCoverage.effectiveEnd || null,
          is_primary: validatedCoverage.isPrimary,
          verification_status: 'needs_attention',
          source: validatedCoverage.source,
          raw_fhir: validatedCoverage.rawFhir || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

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
