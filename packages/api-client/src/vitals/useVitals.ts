import { useCallback, useEffect, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { loadVitals, type VitalMeasurement } from './data';
export function useVitals(client: SupabaseClient) {
  const [rows, setRows] = useState<VitalMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const run = ++generation.current;
    setRows([]); setLoading(true); setError(null);
    try {
      const result = await loadVitals(client);
      if (run === generation.current) setRows(result);
    } catch {
      if (run === generation.current) setError('Unable to load measurements. Please try again.');
    } finally {
      if (run === generation.current) setLoading(false);
    }
  }, [client]);
  useEffect(() => { void refresh(); return () => { generation.current++; }; }, [refresh]);
  return { rows, loading, error, refresh };
}
