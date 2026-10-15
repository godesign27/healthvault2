import type { SupabaseClient } from '@supabase/supabase-js';
export interface VitalMeasurement {
  id: string; metric: string; value: number; secondary_value: number | null;
  unit: string; observed_at: string; source_name: string; device_name: string | null;
}
export const vitalsHistoryLimit = 100;
export async function loadVitals(client: SupabaseClient): Promise<VitalMeasurement[]> {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error('Sign in to load your measurements.');
  const result = await client.from('vital_measurements')
    .select('id, metric, value, secondary_value, unit, observed_at, source_name, device_name')
    .eq('user_id', data.user.id).order('observed_at', { ascending: false })
    .order('id', { ascending: false }).limit(vitalsHistoryLimit);
  if (result.error) throw new Error('Unable to load measurements. Please try again.');
  return result.data ?? [];
}
export function vitalLabel(metric: string) {
  const label = metric.replace(/_/g, ' ');
  return label.charAt(0).toUpperCase() + label.slice(1);
}
export function vitalValue(row: VitalMeasurement) {
  const unit = row.unit === 'Cel' ? '°C' : row.unit === '[degF]' ? '°F' : row.unit;
  return `${row.value}${row.secondary_value == null ? '' : ` / ${row.secondary_value}`} ${unit}`;
}
export function vitalDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  });
}
