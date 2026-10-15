import type { SupabaseClient } from '@supabase/supabase-js';
import type { VitalMeasurement } from '../../packages/api-client/src/vitals/data';

export type VitalDraft = { value: string; secondaryValue: string; unit: string; observedAt: string };
export function validateVitalDraft(draft: VitalDraft, paired: boolean) {
  const value = Number(draft.value);
  const secondaryValue = draft.secondaryValue.trim() ? Number(draft.secondaryValue) : null;
  const observed = new Date(draft.observedAt);
  if (!draft.value.trim() || !Number.isFinite(value)) throw new Error('Enter a valid numeric reading.');
  if ((paired && secondaryValue == null) || (secondaryValue != null && !Number.isFinite(secondaryValue))) throw new Error('Enter a valid second reading.');
  if (!draft.unit.trim()) throw new Error('Enter the measurement unit.');
  if (!Number.isFinite(observed.getTime())) throw new Error('Enter a valid measurement date and time.');
  return { value, secondary_value: secondaryValue, unit: draft.unit.trim(), observed_at: observed.toISOString() };
}

/** Existing owner-scoped table writes only; metric and import provenance stay unchanged. */
export async function mutateVital(client: SupabaseClient, row: VitalMeasurement, action: 'save' | 'remove', draft?: VitalDraft) {
  const values = action === 'save' && draft ? validateVitalDraft(draft, row.secondary_value != null) : undefined;
  if (action === 'save' && !values) throw new Error('Review the reading before saving.');
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth.user) throw new Error('Sign in before changing a measurement.');
  const table = client.from('vital_measurements');
  const mutation = action === 'remove' ? table.delete() : table.update(values!);
  const { data, error } = await mutation.eq('user_id', auth.user.id).eq('id', row.id).select('id').maybeSingle();
  if (error || data?.id !== row.id) throw new Error(action === 'remove' ? 'Could not remove the measurement. Please try again.' : 'Could not save the measurement. Please try again.');
}
