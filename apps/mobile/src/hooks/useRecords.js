import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../lib/api';

export function useRecords(filters = {}) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  const generation = useRef(0);
  const fetch = useCallback(async (overrides = {}) => {
    const run = ++generation.current;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getRecords({ ...filters, ...overrides });
      // Response shape: { data: { items, total, page, pageSize } }
      // or { items, total } directly — handle both
      const result = data?.data || data;
      if (run === generation.current) {
        setRecords(result?.items || result || []);
        setTotal(result?.total || 0);
      }
      return true;
    } catch (err) {
      if (run === generation.current) setError(err.message);
      return false;
    } finally {
      if (run === generation.current) setLoading(false);
    }
  }, [filters.kind, filters.page, filters.pageSize]);

  useEffect(() => {
    fetch();
    return () => { generation.current++; };
  }, [fetch]);

  return { records, loading, error, total, refetch: fetch };
}
