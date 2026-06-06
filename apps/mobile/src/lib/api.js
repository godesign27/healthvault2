import { supabase } from './supabase';

function getBaseUrl() {
  const u = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  return u.replace(/\/$/, '');
}

function parseApiError(json) {
  if (!json) return 'Request failed';
  if (typeof json.error === 'string') return json.error;
  if (json.error?.message) return json.error.message;
  return 'Request failed';
}

async function fetchWithAuth(path, options = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${getBaseUrl()}/functions/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      'X-Platform': 'mobile',
      ...options.headers,
    },
  });

  if (res.status === 401) {
    await supabase.auth.refreshSession();
    throw new Error('Session expired — please try again');
  }

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(text || `Request failed: ${res.status}`);
  }

  if (!res.ok) {
    throw new Error(parseApiError(json) || `Request failed: ${res.status}`);
  }

  return json;
}

export const api = {
  getStats: () => fetchWithAuth('/vault-stats'),

  getRecords: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.kind) params.set('kind', filters.kind);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
    const query = params.toString();
    return fetchWithAuth(`/records${query ? `?${query}` : ''}`);
  },

  getRecord: (id) => fetchWithAuth(`/records/${id}`),

  getProviders: () => fetchWithAuth('/providers'),

  disconnectProvider: (id) => fetchWithAuth(`/providers/${id}`, { method: 'DELETE' }),
};
