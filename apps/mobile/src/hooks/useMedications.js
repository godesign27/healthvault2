import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Loads from `medications` (medical profile) — not health_records, since
 * health_records.kind does not include medication in this schema.
 */
export function useMedications() {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error: fetchError } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const normalized = (data || []).map((r) => {
        const ended = r.end_date && new Date(r.end_date) < new Date();
        return {
          id: r.id,
          name: r.name || 'Unknown Medication',
          status: ended ? 'Inactive' : 'Active',
          dosage: r.dosage || '',
          frequency: r.frequency || '',
          instructions: [r.dosage, r.frequency].filter(Boolean).join(' · ') || r.notes || '',
          prescribing_doctor: r.prescribed_by || '',
          condition: null,
          date: r.start_date || r.created_at,
        };
      });

      setMedications(normalized);
    } catch (err) {
      console.error('[useMedications]', err);
      setError(err?.message || 'Failed to load medications');
      setMedications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { medications, loading, error, refetch: fetch };
}
