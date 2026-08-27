import { supabase } from '../supabase';

export interface EhrConnection {
  id: string;
  ehrSource: string | null;
  ehrPatientId: string | null;
  providerName: string;
  status: string;
  lastSyncedAt: string | null;
}

export interface SyncStatusResult {
  lastSyncedAt: string | null;
  status: 'synced' | 'pending' | 'inactive' | 'no_connections';
  connections: Array<{
    id: string;
    ehrSource: string | null;
    providerName: string;
    status: string;
    lastSyncedAt: string | null;
  }>;
}

async function authHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
  return {
    Authorization: `Bearer ${token}`,
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  };
}

export async function listEhrConnections(): Promise<EhrConnection[]> {
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/providers`, {
    headers: await authHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to load connections (${res.status})`);
  }
  return res.json();
}

export async function getSyncStatus(): Promise<SyncStatusResult> {
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-status`, {
    headers: await authHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to load sync status (${res.status})`);
  }
  return res.json();
}

export async function disconnectEhrConnection(connectionId: string): Promise<void> {
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/providers/${connectionId}`,
    { method: 'DELETE', headers: await authHeaders() },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to disconnect (${res.status})`);
  }
}

export { syncFhirConnection } from './fhir-oauth-api';
