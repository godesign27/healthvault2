import { supabase } from '../supabase';

export async function loadRecordFile(recordId: string, signal: AbortSignal): Promise<Blob> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Please sign in to open this file.');
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/record-file`, {
    method: 'POST', signal, cache: 'no-store', credentials: 'omit',
    headers: { Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ recordId }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'This file is not available. Please try again.');
  }
  return response.blob();
}
