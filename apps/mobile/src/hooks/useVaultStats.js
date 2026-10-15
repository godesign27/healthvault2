import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../lib/api';

export function useVaultStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const generation = useRef(0);
  const fetch = useCallback(async (overrides = {}) => {
    const run = ++generation.current;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getStats();
      // Edge Function returns { data: VaultStats } or the stats directly
      if (run === generation.current) setStats(data?.data || data);
      return true;
    } catch (err) {
      if (run === generation.current) setError(err.message);
      return false;
    } finally {
      if (run === generation.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    return () => { generation.current++; };
  }, [fetch]);

  return { stats, loading, error, refetch: fetch };
}
