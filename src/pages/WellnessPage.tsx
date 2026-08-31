import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Apple,
  ChevronLeft,
  ChevronRight,
  Droplets,
  MessageCircle,
  Leaf,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Utensils,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Dialog } from '../components/ui/Dialog';
import { NourishedRebelInsights } from '../components/wellness/NourishedRebelInsights';
import { requestWellnessRefresh } from '../lib/wellness-insights';

export type WellnessTab = 'insights' | 'diet' | 'signals';
type MealFilter = 'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drink' | 'other';

type DietItem = { name?: string; amount?: string | null; notes?: string | null };
type DietEntry = {
  id: string;
  meal_type: Exclude<MealFilter, 'all'>;
  consumed_at: string;
  items: DietItem[] | null;
  water_ml: number | null;
  notes: string | null;
  source: string | null;
  confirmation_status: string | null;
};

type LifeSignal = {
  id: string;
  energy: number;
  sleep: number;
  mood: number;
  stress: number;
  pain: number;
  note: string | null;
  recorded_at: string;
  source: string | null;
  confirmation_status: string | null;
};

type EditForm = {
  mealType: DietEntry['meal_type'];
  consumedAt: string;
  items: string;
  waterMl: string;
  notes: string;
};

const mealFilters: MealFilter[] = ['all', 'breakfast', 'lunch', 'dinner', 'snack', 'drink', 'other'];
const DAY_MS = 86_400_000;

function localDateKey(iso: string) {
  const date = new Date(iso);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dateLabel(key: string) {
  const date = new Date(`${key}T12:00:00`);
  const today = localDateKey(new Date().toISOString());
  const yesterday = localDateKey(new Date(Date.now() - DAY_MS).toISOString());
  if (key === today) return 'Today';
  if (key === yesterday) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function displayTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function inputDateTime(iso: string) {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function sourceLabel(source: string | null) {
  if (source === 'chatgpt') return 'Added through ChatGPT';
  if (source === 'web') return 'Added in Health Vault';
  return 'User reported';
}

function Rating({ label, value, inverse = false }: { label: string; value: number; inverse?: boolean }) {
  const filled = inverse ? 6 - value : value;
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center justify-between gap-2 text-xs text-content-tertiary">
        <span>{label}</span>
        <span className="font-semibold text-content-primary">{value}/5</span>
      </div>
      <div className="flex gap-1" aria-label={`${label}: ${value} out of 5`}>
        {[1, 2, 3, 4, 5].map((step) => (
          <span
            key={step}
            className={`h-1.5 flex-1 rounded-full ${step <= filled ? 'bg-action-primary' : 'bg-surface-sunken'}`}
          />
        ))}
      </div>
    </div>
  );
}

interface WellnessPageProps {
  onOpenAssistant: (insightId?: string) => void;
  initialTab?: WellnessTab;
}

export function WellnessPage({ onOpenAssistant, initialTab = 'diet' }: WellnessPageProps) {
  const [tab, setTab] = useState<WellnessTab>(initialTab);
  const [mealFilter, setMealFilter] = useState<MealFilter>('all');
  const [dietEntries, setDietEntries] = useState<DietEntry[]>([]);
  const [lifeSignals, setLifeSignals] = useState<LifeSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<DietEntry | null>(null);
  const [deleting, setDeleting] = useState<DietEntry | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);

  const loadWellness = useCallback(async () => {
    setLoading(true);
    setError('');
    const since = new Date(Date.now() - 7 * DAY_MS).toISOString();
    const [{ data: diet, error: dietError }, { data: signals, error: signalError }] = await Promise.all([
      supabase
        .from('diet_log_entries')
        .select('id, meal_type, consumed_at, items, water_ml, notes, source, confirmation_status')
        .gte('consumed_at', since)
        .order('consumed_at', { ascending: false }),
      supabase
        .from('life_signal_entries')
        .select('id, energy, sleep, mood, stress, pain, note, recorded_at, source, confirmation_status')
        .gte('recorded_at', since)
        .order('recorded_at', { ascending: false }),
    ]);
    if (dietError || signalError) {
      setError(dietError?.message || signalError?.message || 'Unable to load wellness entries.');
    }
    setDietEntries((diet as DietEntry[] | null) ?? []);
    setLifeSignals((signals as LifeSignal[] | null) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadWellness();
  }, [loadWellness]);

  const filteredDiet = useMemo(
    () => dietEntries.filter((entry) => mealFilter === 'all' || entry.meal_type === mealFilter),
    [dietEntries, mealFilter],
  );

  const groupedDiet = useMemo(() => {
    const groups = new Map<string, DietEntry[]>();
    for (const entry of filteredDiet) {
      const key = localDateKey(entry.consumed_at);
      groups.set(key, [...(groups.get(key) ?? []), entry]);
    }
    return [...groups.entries()];
  }, [filteredDiet]);

  const totalWater = dietEntries.reduce((sum, entry) => sum + (entry.water_ml ?? 0), 0);
  const uniqueFoods = new Set(
    dietEntries.flatMap((entry) => (Array.isArray(entry.items) ? entry.items : []))
      .map((item) => item.name?.trim().toLowerCase())
      .filter(Boolean),
  ).size;

  const openEdit = (entry: DietEntry) => {
    setEditing(entry);
    setEditForm({
      mealType: entry.meal_type,
      consumedAt: inputDateTime(entry.consumed_at),
      items: (entry.items ?? []).map((item) => [item.name, item.amount].filter(Boolean).join(' — ')).join('\n'),
      waterMl: entry.water_ml ? String(entry.water_ml) : '',
      notes: entry.notes ?? '',
    });
  };

  const saveEdit = async () => {
    if (!editing || !editForm) return;
    const items = editForm.items.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
      const [name, amount] = line.split(/\s+[—-]\s+/, 2);
      return { name: name.trim(), amount: amount?.trim() || null, notes: null };
    });
    if (!items.length) {
      setError('Add at least one food or drink before saving.');
      return;
    }
    setSaving(true);
    const { error: updateError } = await supabase.from('diet_log_entries').update({
      meal_type: editForm.mealType,
      consumed_at: new Date(editForm.consumedAt).toISOString(),
      items,
      water_ml: editForm.waterMl ? Number(editForm.waterMl) : null,
      notes: editForm.notes.trim() || null,
      confirmation_status: 'confirmed',
    }).eq('id', editing.id);
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setEditing(null);
    setEditForm(null);
    void requestWellnessRefresh().catch(() => undefined);
    await loadWellness();
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    const { error: deleteError } = await supabase.from('diet_log_entries').delete().eq('id', deleting.id);
    setSaving(false);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setDeleting(null);
    void requestWellnessRefresh().catch(() => undefined);
    await loadWellness();
  };

  return (
    <div className="w-full p-6 pt-20 sm:p-8 lg:p-12 lg:pt-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-action-primary">Personal patterns</p>
            <h1 className="text-2xl font-bold text-content-primary">Wellness</h1>
            <p className="mt-1 max-w-2xl text-content-secondary">
              Review your user-reported meals and daily check-ins. These entries support reflection and do not replace clinical or nutrition advice.
            </p>
          </div>
          <button
            onClick={() => onOpenAssistant()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-hv-button bg-action-primary px-4 py-2.5 text-sm font-semibold text-content-on-action transition-colors hover:bg-action-primary-hover active:translate-y-px"
          >
            <Plus className="h-4 w-4" />
            {tab === 'insights' ? 'Ask about my insights' : tab === 'diet' ? 'Log a meal' : 'Start check-in'}
          </button>
        </div>

        <div className="mb-7 flex items-center gap-1 border-b border-stroke-subtle" role="tablist" aria-label="Wellness sections">
          <button
            role="tab"
            aria-selected={tab === 'diet'}
            onClick={() => setTab('diet')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${tab === 'diet' ? 'border-action-primary text-action-primary' : 'border-transparent text-content-secondary hover:text-content-primary'}`}
          >
            <Apple className="h-4 w-4" /> Diet Log
          </button>
          <button
            role="tab"
            aria-selected={tab === 'signals'}
            onClick={() => setTab('signals')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${tab === 'signals' ? 'border-action-primary text-action-primary' : 'border-transparent text-content-secondary hover:text-content-primary'}`}
          >
            <Activity className="h-4 w-4" /> Life Signals
          </button>
          <button
            role="tab"
            aria-selected={tab === 'insights'}
            onClick={() => setTab('insights')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${tab === 'insights' ? 'border-action-primary text-action-primary' : 'border-transparent text-content-secondary hover:text-content-primary'}`}
          >
            <Leaf className="h-4 w-4" /> Nourished Rebel Insights
          </button>
          {tab !== 'insights' && <button onClick={() => void loadWellness()} className="ml-auto rounded-lg p-2 text-content-tertiary transition-colors hover:bg-action-secondary hover:text-content-primary" aria-label="Refresh wellness entries">
            <RefreshCw className="h-4 w-4" />
          </button>}
        </div>

        {error && (
          <div role="alert" className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <span>{error}</span>
            <button onClick={() => setError('')} className="font-semibold text-blue-700 hover:text-blue-900">Dismiss</button>
          </div>
        )}

        {tab === 'insights' ? (
          <NourishedRebelInsights onAsk={(insightId) => onOpenAssistant(insightId)} />
        ) : loading ? (
          <div className="space-y-3" aria-label="Loading wellness entries">
            {[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl bg-surface-sunken" />)}
          </div>
        ) : tab === 'diet' ? (
          <>
            <div className="mb-6 grid grid-cols-1 divide-y divide-stroke-subtle rounded-xl border border-stroke-subtle bg-surface-raised sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="p-4"><p className="text-xs text-content-tertiary">Entries, past 7 days</p><p className="mt-1 text-2xl font-bold text-content-primary">{dietEntries.length}</p></div>
              <div className="p-4"><p className="text-xs text-content-tertiary">Foods and drinks recorded</p><p className="mt-1 text-2xl font-bold text-content-primary">{uniqueFoods}</p></div>
              <div className="p-4"><p className="text-xs text-content-tertiary">Logged water</p><p className="mt-1 text-2xl font-bold text-content-primary">{totalWater ? `${totalWater.toLocaleString()} mL` : 'Not logged'}</p></div>
            </div>

            <div className="mb-6 flex gap-2 overflow-x-auto pb-1" aria-label="Filter diet entries by meal type">
              {mealFilters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setMealFilter(filter)}
                  className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${mealFilter === filter ? 'border-action-primary bg-action-primary text-content-on-action' : 'border-stroke-default bg-surface-raised text-content-secondary hover:border-action-primary hover:text-action-primary'}`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {groupedDiet.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stroke-default px-6 py-14 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-action-primary-subtle"><Utensils className="h-5 w-5 text-action-primary" /></div>
                <h2 className="text-lg font-semibold text-content-primary">No meals logged yet</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-content-secondary">Tell the Health Vault assistant what you ate or drank. You will review the details before anything is saved.</p>
            <button onClick={() => onOpenAssistant()} className="mt-5 inline-flex items-center gap-2 font-semibold text-blue-700 hover:text-blue-900"><MessageCircle className="h-4 w-4" /> Log your first meal</button>
              </div>
            ) : (
              <div className="space-y-8">
                {groupedDiet.map(([date, entries]) => (
                  <section key={date}>
                    <div className="mb-3 flex items-baseline justify-between border-b border-stroke-subtle pb-2">
                      <h2 className="font-semibold text-content-primary">{dateLabel(date)}</h2>
                      <span className="text-xs text-content-tertiary">{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</span>
                    </div>
                    <div className="divide-y divide-stroke-subtle rounded-xl border border-stroke-subtle bg-surface-raised">
                      {entries.map((entry) => (
                        <article key={entry.id} className="group p-4 sm:p-5">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-action-primary-subtle"><Utensils className="h-4 w-4 text-action-primary" /></div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <h3 className="font-semibold capitalize text-content-primary">{entry.meal_type}</h3>
                                <span className="text-xs text-content-tertiary">{displayTime(entry.consumed_at)}</span>
                              </div>
                              <p className="mt-1 text-sm leading-6 text-content-secondary">
                                {(entry.items ?? []).map((item) => [item.name, item.amount].filter(Boolean).join(' — ')).join(', ') || 'No foods listed'}
                              </p>
                              {entry.notes && <p className="mt-1 text-sm text-content-tertiary">{entry.notes}</p>}
                              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-content-tertiary">
                                <span className="rounded-full bg-surface-sunken px-2 py-1">{sourceLabel(entry.source)}</span>
                                {entry.water_ml ? <span className="flex items-center gap-1"><Droplets className="h-3.5 w-3.5" /> {entry.water_ml} mL water</span> : null}
                                <span className="capitalize">{entry.confirmation_status ?? 'confirmed'}</span>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <button onClick={() => openEdit(entry)} className="rounded-lg p-2 text-blue-700 transition-colors hover:bg-blue-50 hover:text-blue-900" aria-label={`Edit ${entry.meal_type} entry`}><Pencil className="h-4 w-4" /></button>
                              <button onClick={() => setDeleting(entry)} className="rounded-lg p-2 text-content-tertiary transition-colors hover:bg-red-50 hover:text-red-700" aria-label={`Delete ${entry.meal_type} entry`}><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}

            {dietEntries.length > 0 && (
              <div className="mt-8 border-t border-stroke-subtle pt-5">
                <h2 className="text-sm font-semibold text-content-primary">Pattern notes</h2>
                <ul className="mt-2 space-y-1.5 text-sm leading-6 text-content-secondary">
                  <li>• Entries reflect only what you chose to report during the past seven days.</li>
                  {totalWater === 0 && <li>• No water amounts are currently recorded.</li>}
                  <li>• Health Vault can help summarize patterns, but it does not estimate unlogged nutrients or prescribe a medical diet.</li>
                </ul>
              </div>
            )}
          </>
        ) : lifeSignals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stroke-default px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-action-primary-subtle"><Activity className="h-5 w-5 text-action-primary" /></div>
            <h2 className="text-lg font-semibold text-content-primary">No Life Signals yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-content-secondary">A short daily check-in records energy, sleep, mood, stress, and pain on a 1–5 scale.</p>
            <button onClick={() => onOpenAssistant()} className="mt-5 inline-flex items-center gap-2 font-semibold text-blue-700 hover:text-blue-900"><MessageCircle className="h-4 w-4" /> Start your first check-in</button>
          </div>
        ) : (
          <div className="space-y-4">
            {lifeSignals.map((signal) => (
              <article key={signal.id} className="rounded-xl border border-stroke-subtle bg-surface-raised p-5">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-semibold text-content-primary">{new Date(signal.recorded_at).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h2>
                    <p className="text-xs text-content-tertiary">{displayTime(signal.recorded_at)} · {sourceLabel(signal.source)}</p>
                  </div>
                  <span className="rounded-full bg-surface-sunken px-2.5 py-1 text-xs capitalize text-content-secondary">{signal.confirmation_status ?? 'confirmed'}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                  <Rating label="Energy" value={signal.energy} />
                  <Rating label="Sleep" value={signal.sleep} />
                  <Rating label="Mood" value={signal.mood} />
                  <Rating label="Stress" value={signal.stress} inverse />
                  <Rating label="Pain" value={signal.pain} inverse />
                </div>
                {signal.note && <p className="mt-5 border-t border-stroke-subtle pt-4 text-sm leading-6 text-content-secondary">{signal.note}</p>}
              </article>
            ))}
          </div>
        )}

        {tab !== 'insights' && <div className="mt-10 flex items-center justify-between border-t border-stroke-subtle pt-5 text-xs text-content-tertiary">
          <span>Showing the most recent 7 days</span>
          <div className="flex items-center gap-1" aria-label="Date range navigation coming soon">
            <button disabled className="rounded p-1 opacity-40"><ChevronLeft className="h-4 w-4" /></button>
            <button disabled className="rounded p-1 opacity-40"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>}
      </div>

      <Dialog
        isOpen={Boolean(editing && editForm)}
        onClose={() => { setEditing(null); setEditForm(null); }}
        title="Review diet entry changes"
        size="medium"
        footerContent={(
          <>
            <button onClick={() => { setEditing(null); setEditForm(null); }} className="rounded-hv-button border border-stroke-default px-4 py-2 text-sm font-semibold text-content-secondary hover:bg-action-secondary">Cancel</button>
            <button onClick={() => void saveEdit()} disabled={saving} className="rounded-hv-button bg-action-primary px-4 py-2 text-sm font-semibold text-content-on-action hover:bg-action-primary-hover disabled:opacity-50">{saving ? 'Saving…' : 'Confirm changes'}</button>
          </>
        )}
      >
        {editForm && (
          <div className="space-y-4">
            <p className="text-sm text-content-secondary">Review the exact entry before saving. Changes remain private to your account.</p>
            <label className="block text-sm font-medium text-content-primary">Meal type
              <select value={editForm.mealType} onChange={(event) => setEditForm({ ...editForm, mealType: event.target.value as DietEntry['meal_type'] })} className="mt-1.5 w-full rounded-lg border border-stroke-default bg-surface-raised px-3 py-2 text-content-primary">
                {mealFilters.slice(1).map((meal) => <option key={meal} value={meal}>{meal}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-content-primary">Date and time
              <input type="datetime-local" value={editForm.consumedAt} onChange={(event) => setEditForm({ ...editForm, consumedAt: event.target.value })} className="mt-1.5 w-full rounded-lg border border-stroke-default bg-surface-raised px-3 py-2 text-content-primary" />
            </label>
            <label className="block text-sm font-medium text-content-primary">Foods and drinks <span className="font-normal text-content-tertiary">(one per line; use “—” before an amount)</span>
              <textarea rows={5} value={editForm.items} onChange={(event) => setEditForm({ ...editForm, items: event.target.value })} className="mt-1.5 w-full rounded-lg border border-stroke-default bg-surface-raised px-3 py-2 text-content-primary" />
            </label>
            <label className="block text-sm font-medium text-content-primary">Water, mL
              <input type="number" min="0" max="20000" value={editForm.waterMl} onChange={(event) => setEditForm({ ...editForm, waterMl: event.target.value })} className="mt-1.5 w-full rounded-lg border border-stroke-default bg-surface-raised px-3 py-2 text-content-primary" />
            </label>
            <label className="block text-sm font-medium text-content-primary">Notes
              <textarea rows={3} value={editForm.notes} onChange={(event) => setEditForm({ ...editForm, notes: event.target.value })} className="mt-1.5 w-full rounded-lg border border-stroke-default bg-surface-raised px-3 py-2 text-content-primary" />
            </label>
          </div>
        )}
      </Dialog>

      <Dialog
        isOpen={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete diet entry?"
        showIcon
        size="small"
        footerContent={(
          <>
            <button onClick={() => setDeleting(null)} className="rounded-hv-button border border-stroke-default px-4 py-2 text-sm font-semibold text-content-secondary hover:bg-action-secondary">Cancel</button>
            <button onClick={() => void confirmDelete()} disabled={saving} className="rounded-hv-button bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">{saving ? 'Deleting…' : 'Delete entry'}</button>
          </>
        )}
      >
        <p className="text-sm leading-6 text-content-secondary">This permanently removes the selected {deleting?.meal_type} entry from your Health Vault. This action cannot be undone.</p>
      </Dialog>
    </div>
  );
}
