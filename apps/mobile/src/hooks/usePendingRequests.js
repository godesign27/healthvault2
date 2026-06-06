import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function usePendingRequests() {
  const [requests, setRequests] = useState([]);
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
        .from('health_record_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setRequests(data || []);
    } catch (err) {
      console.error('[usePendingRequests]', err);
      setError(err?.message || 'Failed to load requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return '1d ago';
    return `${days}d ago`;
  };

  const normalized = requests.map((r) => ({
    id: r.id,
    doctorName: r.doctor_name || r.provider_name || 'Unknown Provider',
    clinic: r.provider_name || r.clinic_name || '',
    providerEmail: r.provider_email || '',
    recordType: Array.isArray(r.record_types) ? r.record_types[0] : r.record_types || 'Records',
    recordTypes: Array.isArray(r.record_types) ? r.record_types : r.record_types ? [r.record_types] : [],
    sentAgo: timeAgo(r.created_at),
    status: r.status || 'pending',
    message: r.message || '',
    urgency: r.urgency || 'Routine',
    patientName: r.patient_name || '',
    expired: r.expires_at ? new Date(r.expires_at) < new Date() : false,
    timeline: {
      created: r.created_at ? new Date(r.created_at).toLocaleString() : null,
      emailSent: r.submitted_at
        ? new Date(r.submitted_at).toLocaleString()
        : r.created_at
          ? new Date(r.created_at).toLocaleString()
          : null,
      opened: r.opened_at ? new Date(r.opened_at).toLocaleString() : null,
      submitted: r.submitted_at ? new Date(r.submitted_at).toLocaleString() : null,
    },
  }));

  const activeCount = normalized.filter((r) => r.status === 'pending' || r.status === 'sent').length;

  return {
    requests: normalized,
    activeCount,
    loading,
    error,
    refetch: fetch,
  };
}
