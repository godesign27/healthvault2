import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

function mapConnectionRow(row) {
  const specialty = row.ehr_source || row.specialty || '';
  const name = row.provider_name || specialty || 'Connected provider';
  const clinic = row.clinic_name || '';
  const addressParts = [row.city, row.state].filter(Boolean);
  const address = row.address || (addressParts.length ? addressParts.join(', ') : '');
  return {
    id: row.id,
    name,
    specialty,
    clinic,
    phone: row.phone || '',
    address,
    lastVisit: row.last_synced_at ? new Date(row.last_synced_at).toLocaleDateString() : null,
    network: row.in_network === false ? 'out' : 'in',
    role: row.provider_role || row.role || 'Primary',
    status: row.status || 'active',
  };
}

function isPrimaryish(p) {
  const s = `${p.specialty} ${p.name}`.toLowerCase();
  return (
    s.includes('primary') ||
    s.includes('family') ||
    s.includes('internal medicine') ||
    s.includes('general')
  );
}

export function useProviders() {
  const [careTeam, setCareTeam] = useState({ primaryCare: [], specialists: [], all: [] });
  const [directory, setDirectory] = useState([]);
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

      const { data: connections, error: connError } = await supabase
        .from('provider_connections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (connError) throw connError;

      const team = (connections || []).map((row) => mapConnectionRow(row));
      const primaryCare = team.filter((p) => isPrimaryish(p));
      const specialists = team.filter((p) => !primaryCare.find((pc) => pc.id === p.id));
      setCareTeam({ primaryCare, specialists, all: team });

      try {
        const dirData = await api.getProviders();
        const raw = Array.isArray(dirData) ? dirData : dirData?.data ?? [];
        const list = Array.isArray(raw) ? raw : raw.items || [];
        const normalized = list.map((p) => ({
          id: p.id,
          name: p.providerName || p.provider_name || p.name || '',
          specialty: p.ehrSource || p.ehr_source || p.specialty || '',
          clinic: p.clinic_name || p.organization || p.ehrSource || '',
          address: p.address || '',
          phone: p.phone || '',
          languages: Array.isArray(p.languages) ? p.languages.join(', ') : p.languages || null,
          accepting: p.accepting_patients ?? true,
          distance: p.distance != null ? `${p.distance} mi` : null,
          network: 'in',
        }));
        setDirectory(normalized);
      } catch (dirErr) {
        console.warn('[useProviders] directory fetch failed:', dirErr);
        setDirectory([]);
      }
    } catch (err) {
      console.error('[useProviders]', err);
      setError(err?.message || 'Failed to load providers');
      setCareTeam({ primaryCare: [], specialists: [], all: [] });
      setDirectory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { careTeam, directory, loading, error, refetch: fetch };
}
