import type { SupabaseClient } from '@supabase/supabase-js';

export async function confirmHealthRecord(
  supabase: SupabaseClient,
  kind: 'conditions' | 'medications' | 'allergies' | 'health_records' | 'appointments',
  value: Record<string, unknown>,
) {
  // Ownership is derived from auth.uid() inside the invoker transaction.
  const { data, error } = await supabase.rpc('confirm_health_record', { p_kind: kind, p_value: value });
  if (error) throw new Error(`Unable to confirm this record: ${error.message}`);
  if (!data?.id) throw new Error('Save result could not be verified. Check Health Vault before retrying.');
  return data;
}
