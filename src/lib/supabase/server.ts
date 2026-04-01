import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function createServerClient(serviceRoleKey?: string): SupabaseClient {
  const key = serviceRoleKey || supabaseAnonKey;
  if (!supabaseUrl || !key) {
    throw new Error('Missing Supabase connection parameters');
  }
  return createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createAuthenticatedClient(accessToken: string): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase connection parameters');
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
