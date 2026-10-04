import {useState, useEffect, useCallback, useRef} from 'react';
import {supabase} from '../lib/supabase';
import {loadInsurance} from '../lib/insuranceData';
export function useInsuranceData() {
  const [data, setData] = useState({coverages: [], userId: null});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const generation = useRef(0);
  const refetch = useCallback(async () => {
    const run = ++generation.current;
    setData({coverages: [], userId: null}); setLoading(true); setError(null);
    try {
      const result = await loadInsurance(supabase);
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
      // Invalidate immediately; defer Supabase reads until outside its auth callback.
      generation.current++;
      setData({coverages: [], userId: null}); setLoading(true); setError(null);
      Promise.resolve().then(() => {if (active) void refetch();});
    });
    void refetch();
    return () => {active = false; generation.current++; subscription.unsubscribe();};
  }, [refetch]);
  return {...data, loading, error, refetch};
}
