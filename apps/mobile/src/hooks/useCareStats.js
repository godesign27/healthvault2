import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useCareStats() {
  const [stats, setStats] = useState({
    labResults: 0,
    encounters: 0,
    medications: 0,
    claims: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setStats({ labResults: 0, encounters: 0, medications: 0, claims: 0 });
        return;
      }

      const uid = user.id;

      const [labs, enc, meds, clm] = await Promise.all([
        supabase
          .from('health_records')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', uid)
          .eq('kind', 'lab'),
        supabase
          .from('health_records')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', uid)
          .eq('kind', 'specialist_report'),
        supabase.from('medications').select('id', { count: 'exact', head: true }).eq('user_id', uid),
        supabase
          .from('health_records')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', uid)
          .eq('kind', 'other'),
      ]);

      setStats({
        labResults: labs.error ? 0 : labs.count ?? 0,
        encounters: enc.error ? 0 : enc.count ?? 0,
        medications: meds.error ? 0 : meds.count ?? 0,
        claims: clm.error ? 0 : clm.count ?? 0,
      });
    } catch (err) {
      console.error('[useCareStats]', err);
      setError(err?.message || 'Failed to load care stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { stats, loading, error, refetch: fetch };
}
