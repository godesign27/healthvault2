import { supabase } from '../lib/supabase';
import { useVitals } from '../../packages/api-client/src/vitals/useVitals';
import { vitalDate, vitalLabel, vitalValue, vitalsHistoryLimit } from '../../packages/api-client/src/vitals/data';
export function VitalsPage() {
  const { rows, loading, error, refresh } = useVitals(supabase);
  return <section className="w-full p-6 sm:p-8 lg:p-12 text-content-primary" aria-labelledby="vitals-title">
    <h1 id="vitals-title" className="text-2xl font-bold">Vitals</h1>
    <p className="mt-2 text-content-secondary">Latest {vitalsHistoryLimit} readings</p>
    <button type="button" disabled={loading} onClick={() => void refresh()} className="my-6 min-h-12 rounded-xl border border-stroke-default px-4 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hv-color-border-focus)] disabled:opacity-50">{loading ? 'Loading…' : 'Refresh'}</button>
    {loading && <p role="status">Loading measurements…</p>}
    {error && <p role="alert">{error}</p>}
    {!loading && !error && !rows.length && <p role="status">No saved measurements yet. Measurements saved through Health Vault will appear here.</p>}
    {!loading && !error && <ul className="space-y-4 max-w-3xl">{rows.map(row => <li key={row.id} className="rounded-2xl border border-stroke-default bg-surface-raised p-4 sm:p-6 break-words">
      <h2 className="text-lg font-semibold">{vitalLabel(row.metric)}</h2>
      <p className="mt-2 text-xl font-semibold">{vitalValue(row)}</p>
      <p className="mt-2 text-content-secondary">{vitalDate(row.observed_at)}</p>
      <p className="mt-1 text-content-secondary">Source: {row.source_name}{row.device_name ? ` · ${row.device_name}` : ''}</p>
    </li>)}</ul>}
  </section>;
}
