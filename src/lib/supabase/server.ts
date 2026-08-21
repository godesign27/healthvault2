import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function createSupabaseServerClient(): SupabaseClient {
  // Compatibility wrapper for existing browser tools. This is intentionally
  // the shared user-scoped client so Row Level Security always applies.
  return supabase;
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
