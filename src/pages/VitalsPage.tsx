import { useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { PopupMenu } from '../components/ui/PopupMenu';
import { Dialog } from '../components/ui/Dialog';
import { useResultToast } from '../hooks/useResultToast';
import { mutateVital, type VitalDraft } from '../lib/vitalActions';
import { supabase } from '../lib/supabase';
import { useVitals } from '../../packages/api-client/src/vitals/useVitals';
import { vitalDate, vitalLabel, vitalValue, vitalsHistoryLimit, type VitalMeasurement } from '../../packages/api-client/src/vitals/data';

function inputDateTime(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : '';
}

export function VitalsPage() {
  const { rows, loading, error, refresh } = useVitals(supabase);
  const { notify, feedback } = useResultToast();
  const [editing, setEditing] = useState<VitalMeasurement | null>(null);
  const [removing, setRemoving] = useState<VitalMeasurement | null>(null);
  const [draft, setDraft] = useState<VitalDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const actionLock = useRef(false);
  const openEdit = (row: VitalMeasurement) => {
    setEditing(row);
    setDraft({ value: String(row.value), secondaryValue: row.secondary_value == null ? '' : String(row.secondary_value), unit: row.unit, observedAt: inputDateTime(row.observed_at) });
  };
  const act = async (action: 'save' | 'remove') => {
    const row = action === 'save' ? editing : removing;
    if (!row || actionLock.current) return;
    actionLock.current = true;
    setBusy(true);
    try {
      await mutateVital(supabase, row, action, draft ?? undefined);
      setEditing(null); setRemoving(null); setDraft(null);
      notify(action === 'save' ? 'Measurement saved.' : 'Measurement removed.');
      await refresh();
    } catch (failure) {
      notify(failure instanceof Error ? failure.message : 'Could not update the measurement. Please try again.', 'error');
    } finally { actionLock.current = false; setBusy(false); }
  };
  const closeEdit = () => { if (!busy) { setEditing(null); setDraft(null); } };
  const inputClass = 'mt-1 min-h-12 w-full rounded-lg border border-stroke-default bg-surface-raised px-3 text-content-primary';
  return <section className="w-full p-6 sm:p-8 lg:p-12 text-content-primary" aria-labelledby="vitals-title">
    {feedback}
    <h1 id="vitals-title" className="text-2xl font-bold">Vitals</h1>
    <p className="mt-2 text-content-secondary">Latest {vitalsHistoryLimit} readings</p>
    <button type="button" disabled={loading || busy} onClick={() => void refresh()} className="my-6 min-h-12 rounded-xl border border-stroke-default px-4 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hv-color-border-focus)] disabled:opacity-50">{loading ? 'Loading…' : 'Refresh'}</button>
    {loading && <p role="status">Loading measurements…</p>}
    {error && <p role="alert">{error}</p>}
    {!loading && !error && !rows.length && <p role="status">No saved measurements yet. Measurements saved through Health Vault will appear here.</p>}
    {!loading && !error && <ul className="space-y-4 max-w-3xl">{rows.map(row => <li key={row.id} className="rounded-2xl border border-stroke-default bg-surface-raised p-4 sm:p-6 break-words">
      <div className="flex items-start justify-between gap-3"><h2 className="text-lg font-semibold">{vitalLabel(row.metric)}</h2>
        <PopupMenu align="end" trigger={<button type="button" disabled={busy} className="min-h-12 rounded-lg px-3 text-content-secondary hover:bg-surface-sunken" aria-label={`More options for ${vitalLabel(row.metric)} recorded ${vitalDate(row.observed_at)}`}><MoreHorizontal className="h-5 w-5" aria-hidden="true" /></button>}
          items={[{ label: 'Edit measurement', disabled: busy, onClick: () => openEdit(row) }, { label: 'Remove measurement', disabled: busy, onClick: () => setRemoving(row) }]} />
      </div>
      <p className="mt-2 text-xl font-semibold">{vitalValue(row)}</p>
      <p className="mt-2 text-content-secondary">{vitalDate(row.observed_at)}</p>
      <p className="mt-1 text-content-secondary">Source: {row.source_name}{row.device_name ? ` · ${row.device_name}` : ''}</p>
    </li>)}</ul>}
    {editing && draft && <Dialog isOpen onClose={closeEdit} title={`Edit ${vitalLabel(editing.metric)}`} footerContent={<>
      <button type="button" disabled={busy} className="min-h-12 px-4" onClick={closeEdit}>Cancel</button>
      <button type="submit" form="edit-vital-reading" disabled={busy} className="min-h-12 rounded-lg bg-action-primary px-4 text-content-on-action">{busy ? 'Saving…' : 'Save measurement'}</button>
    </>}><form id="edit-vital-reading" className="space-y-4" onSubmit={event => { event.preventDefault(); void act('save'); }}>
      <p className="text-sm text-content-secondary">Update this saved reading. Its metric, source, and device remain the same.</p>
      <label className="block text-content-primary">Reading<input required type="number" step="any" value={draft.value} disabled={busy} onChange={event => setDraft({ ...draft, value: event.target.value })} className={inputClass} /></label>
      {editing.secondary_value != null && <label className="block text-content-primary">Second reading<input required type="number" step="any" value={draft.secondaryValue} disabled={busy} onChange={event => setDraft({ ...draft, secondaryValue: event.target.value })} className={inputClass} /></label>}
      <label className="block text-content-primary">Unit<input required value={draft.unit} disabled={busy} onChange={event => setDraft({ ...draft, unit: event.target.value })} className={inputClass} /></label>
      <label className="block text-content-primary">Date and time<input required type="datetime-local" value={draft.observedAt} disabled={busy} onChange={event => setDraft({ ...draft, observedAt: event.target.value })} className={inputClass} /></label>
    </form></Dialog>}
    {removing && <Dialog isOpen onClose={() => { if (!busy) setRemoving(null); }} title="Remove this measurement?" footerContent={<>
      <button type="button" disabled={busy} className="min-h-12 px-4" onClick={() => setRemoving(null)}>Keep measurement</button>
      <button type="button" disabled={busy} className="min-h-12 rounded-lg bg-action-primary px-4 text-content-on-action" onClick={() => void act('remove')}>{busy ? 'Removing…' : 'Remove measurement'}</button>
    </>}><p className="text-content-secondary">Remove {vitalLabel(removing.metric)} ({vitalValue(removing)}) recorded {vitalDate(removing.observed_at)} from your saved measurements?</p></Dialog>}
  </section>;
}
