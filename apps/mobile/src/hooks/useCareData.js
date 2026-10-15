import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { loadCareData } from '../lib/careData';
const empty = { appointments: [], encounters: [], claims: [] };
export function useCareData() {
  const [data, setData] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const generation = useRef(0);
  const refetch = useCallback(async () => {
    const run = ++generation.current;
    setLoading(true); setError(null); setData(empty);
    try {
      const result = await loadCareData(supabase);
      if (run === generation.current) setData(result);
      return true;
    } catch (err) {
      if (run === generation.current) setError(err?.message || 'Unable to load care records.');
      return false;
    } finally {
      if (run === generation.current) setLoading(false);
    }
  }, []);
  useEffect(() => { refetch(); return () => { generation.current++; }; }, [refetch]);
  return { ...data, loading, error, refetch };
}
