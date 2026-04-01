import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface DesignToken {
  id: string;
  category: string;
  name: string;
  value: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Component {
  id: string;
  name: string;
  category: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface ComponentVariant {
  id: string;
  component_id: string;
  name: string;
  size: string;
  state: string;
  props: Record<string, any>;
  created_at: string;
}
