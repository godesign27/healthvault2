import { supabase } from '../supabase';

export type FhirConnectionMethod = 'direct_provider_connection' | 'epic_connection';

export interface StartFhirOAuthResult {
  strategy: FhirConnectionMethod;
  status: string;
  connectionId: string;
  launchUrl: string | null;
  message?: string;
  error?: string;
}

export interface FhirSyncResult {
  source: 'fhir' | 'scaffold';
  counts: {
    conditions: number;
    medications: number;
    allergies: number;
    immunizations: number;
    total: number;
    duplicates: number;
  };
  itemsByType: Record<string, unknown[]>;
  importJobId: string | null;
  message?: string;
  error?: string;
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

function functionsUrl(path: string): string {
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${path}`;
}

export async function startFhirOAuth(params: {
  providerOrganizationId: string;
  connectionMethod: FhirConnectionMethod;
  redirectAfter?: string;
}): Promise<StartFhirOAuthResult> {
  const res = await fetch(functionsUrl('fhir-oauth-start'), {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(params),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Failed to start OAuth (${res.status})`);
  }
  return body as StartFhirOAuthResult;
}

export async function syncFhirConnection(connectionId: string): Promise<FhirSyncResult> {
  const res = await fetch(functionsUrl('fhir-sync'), {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ connectionId }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Failed to sync records (${res.status})`);
  }
  return body as FhirSyncResult;
}

export function fhirOAuthRedirectUri(): string {
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fhir-oauth-callback`;
}
