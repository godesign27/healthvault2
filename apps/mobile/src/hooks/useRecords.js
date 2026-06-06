import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export function useRecords(filters = {}) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getRecords(filters);
      // Response shape: { data: { items, total, page, pageSize } }
      // or { items, total } directly — handle both
      const result = data?.data || data;
      setRecords(result?.items || result || []);
      setTotal(result?.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters.kind, filters.page, filters.pageSize]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { records, loading, error, total, refetch: fetch };
}
