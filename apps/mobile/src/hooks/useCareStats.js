import { useState, useEffect, useCallback, useRef } from 'react';
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

  const generation = useRef(0);
  const fetch = useCallback(async () => {
    const run = ++generation.current;
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user }, error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
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
        supabase.from('encounters').select('id', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('medications').select('id', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('claims').select('id', { count: 'exact', head: true }).eq('user_id', uid),
      ]);

      for (const result of [labs, enc, meds, clm]) if (result.error) throw result.error;
      if (run !== generation.current) return;
      setStats({
        labResults: labs.count ?? 0,
        encounters: enc.count ?? 0,
        medications: meds.count ?? 0,
        claims: clm.count ?? 0,
      });
    } catch (err) {
      if (run !== generation.current) return;
      setError(err?.message || 'Failed to load care stats');
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
