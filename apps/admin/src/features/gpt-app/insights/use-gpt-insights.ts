import type { GptInsightsSnapshot } from '@health-vault/analytics-contracts';
import { useEffect, useState } from 'react';
import { getGptInsightsSnapshot } from './insights-data';

type InsightsState =
  | { status: 'loading'; data: null; error: null }
  | { status: 'ready'; data: GptInsightsSnapshot; error: null }
  | { status: 'error'; data: null; error: string };

export function useGptInsights(): InsightsState {
  const [state, setState] = useState<InsightsState>({ status: 'loading', data: null, error: null });

  useEffect(() => {
    let isActive = true;
    void getGptInsightsSnapshot()
      .then((data) => {
        if (isActive) setState({ status: 'ready', data, error: null });
      })
      .catch((error: unknown) => {
        if (isActive) {
          setState({
            status: 'error',
            data: null,
            error: error instanceof Error ? error.message : 'Unable to load GPT App insights.',
          });
        }
      });
    return () => { isActive = false; };
  }, []);

  return state;
}
