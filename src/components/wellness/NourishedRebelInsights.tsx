import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, ExternalLink, History, Leaf, Loader2, MessageCircle, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { CHECK_IN_QUESTION_KEYS, type CheckInQuestionKey } from '../../../packages/wellness-contracts/src/index';
import { enrollInWellness, getWellnessHistory, getWellnessPartnerCta, getWellnessState, optOutWellness, saveWellnessAnswer, sendWellnessFeedback, snoozeWellness, trackWellnessEvent, type WellnessInsightRow, type WellnessState } from '../../lib/wellness-insights';

const questions: Record<CheckInQuestionKey, { title: string; prompt: string; placeholder: string }> = {
  sleep: { title: 'Sleep', prompt: 'How has your sleep felt lately?', placeholder: 'Think about duration, consistency, waking, and how rested you feel.' },
  meal_rhythm: { title: 'Meal rhythm', prompt: 'What does your usual meal rhythm look like?', placeholder: 'Meal timing, skipped meals, breakfast, or long gaps.' },
  energy_cravings: { title: 'Energy & cravings', prompt: 'How steady are your energy and cravings between meals?', placeholder: 'Share any crashes, strong cravings, or mood shifts.' },
  stress: { title: 'Stress', prompt: 'How has your stress load felt recently?', placeholder: 'What feels demanding, and what helps you recover?' },
  hydration: { title: 'Hydration', prompt: 'How consistently are you drinking fluids?', placeholder: 'A rough pattern is enough; exact amounts are optional.' },
  movement: { title: 'Movement', prompt: 'What kind of movement fits into your week?', placeholder: 'Walking, training, mobility, work activity, or recovery.' },
};

const statusStyle: Record<string, string> = {
  strong: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  needs_support: 'bg-amber-50 text-amber-900 border-amber-200',
  significant_opportunity: 'bg-orange-50 text-orange-900 border-orange-200',
};

function InsightBody({ row, onAsk }: { row: WellnessInsightRow; onAsk: (id: string) => void }) {
  const insight = row.insight;
  const snapshotPoints = insight.snapshot.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((item) => item.trim()).filter(Boolean) ?? [insight.snapshot];
  const [feedback, setFeedback] = useState<string | null>(null);
  const openPartnerSite = () => {
    const popup = window.open('about:blank', '_blank', 'noopener,noreferrer');
    void getWellnessPartnerCta(crypto.randomUUID()).then(({ url }) => { if (popup) popup.location.href = url; else window.location.href = url; }).catch(() => { if (popup) popup.close(); });
  };
  const rate = async (rating: 'up' | 'down') => { await sendWellnessFeedback(row.id, 'headline', rating); setFeedback(rating); };
  return (
    <>
      <ul className="space-y-2 pl-5 text-base leading-7 text-content-secondary">
        {snapshotPoints.map((point) => <li key={point} className="list-disc pl-1 marker:text-action-primary">{point}</li>)}
      </ul>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {Object.entries(insight.pillars).map(([key, pillar]) => (
          <section key={key} className="rounded-xl border border-stroke-subtle bg-surface-raised p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold capitalize text-content-primary">{key.replace('_', ' ')}</h3>
              <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${statusStyle[pillar.status]}`}>{pillar.status.replace(/_/g, ' ')}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-content-secondary">{pillar.summary}</p>
            <p className="mt-3 border-l-2 border-action-primary pl-3 text-sm text-content-primary">{pillar.suggestions[0]}</p>
          </section>
        ))}
      </div>
      <div className="mt-5 rounded-xl bg-surface-sunken p-4"><p className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">Start here</p><ul className="mt-2 space-y-1 text-sm text-content-primary">{insight.startingPoints.map((item) => <li key={item}>• {item}</li>)}</ul></div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button onClick={() => onAsk(row.id)} className="inline-flex items-center gap-2 rounded-hv-button bg-action-primary px-4 py-2.5 text-sm font-semibold text-content-on-action hover:bg-action-primary-hover"><MessageCircle className="h-4 w-4" /> Ask me more</button>
        <button onClick={() => { void trackWellnessEvent('cta_clicked', { surface: 'insight' }); openPartnerSite(); }} className="inline-flex items-center gap-2 rounded-hv-button border border-stroke-default px-4 py-2.5 text-sm font-semibold text-content-primary hover:bg-action-secondary">Visit Nourished Rebel <ExternalLink className="h-4 w-4" /></button>
        <div className="ml-auto flex items-center gap-1" aria-label="Was this insight useful?">
          <button onClick={() => void rate('up')} aria-label="Helpful" className={`rounded-lg p-2 ${feedback === 'up' ? 'bg-emerald-50 text-emerald-700' : 'text-content-tertiary hover:bg-action-secondary'}`}><ThumbsUp className="h-4 w-4" /></button>
          <button onClick={() => void rate('down')} aria-label="Not helpful" className={`rounded-lg p-2 ${feedback === 'down' ? 'bg-red-50 text-red-700' : 'text-content-tertiary hover:bg-action-secondary'}`}><ThumbsDown className="h-4 w-4" /></button>
        </div>
      </div>
      <p className="mt-5 text-xs leading-5 text-content-tertiary">{insight.disclaimer} Generated {new Date(row.generated_at).toLocaleDateString()}.</p>
    </>
  );
}

export function NourishedRebelInsights({ compact = false, onAsk }: { compact?: boolean; onAsk: (insightId: string) => void }) {
  const [state, setState] = useState<WellnessState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<WellnessInsightRow[]>([]);
  const load = useCallback(async () => { try { setState(await getWellnessState()); setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load insights.'); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const nextQuestion = useMemo(() => CHECK_IN_QUESTION_KEYS.findIndex((key) => !state?.checkIn?.answers?.[key] && !state?.checkIn?.skipped_questions?.includes(key)), [state]);
  const openCheckIn = async () => {
    let current = state;
    if (!current?.enrollment?.active) current = await enrollInWellness();
    setState(current); setQuestionIndex(nextQuestion >= 0 ? nextQuestion : 0); setAnswer(''); setCheckInOpen(true);
    void trackWellnessEvent('check_in_started', { surface: compact ? 'dashboard' : 'wellness' });
  };
  const save = async (skipped = false) => { const key = CHECK_IN_QUESTION_KEYS[questionIndex]; if (!skipped && !answer.trim()) return; setSaving(true); try { const next = await saveWellnessAnswer(key, skipped ? null : answer.trim(), skipped); setState(next); const following = CHECK_IN_QUESTION_KEYS.findIndex((candidate, index) => index > questionIndex && !next.checkIn?.answers?.[candidate] && !next.checkIn?.skipped_questions?.includes(candidate)); if (following < 0) setCheckInOpen(false); else { setQuestionIndex(following); setAnswer(''); } } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save answer.'); } finally { setSaving(false); } };
  if (loading) return <div className="h-48 animate-pulse rounded-xl bg-surface-sunken" aria-label="Loading Nourished Rebel Insights" />;
  if (error && !state) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>;
  if (!state?.partner?.cloudEnabled || state.partner.status !== 'active') return null;
  if (compact && state.enrollment?.snoozed_until && new Date(state.enrollment.snoozed_until).getTime() > Date.now()) return null;
  const row = state.enrollment?.active ? state.latestInsight : null;
  return (
    <section className={`rounded-2xl border border-stroke-subtle bg-surface-raised ${compact ? 'p-5' : 'p-6'}`} aria-labelledby="nourished-rebel-title">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-action-primary"><Leaf className="h-4 w-4" /> Nourished Rebel · Wellness Insights</p><h2 id="nourished-rebel-title" className="mt-2 text-xl font-semibold text-content-primary">{row ? "Here's where things stand" : state.checkIn?.answered_count ? 'Pick up where you left off' : 'Your wellness insights are waiting'}</h2></div>{!compact && state.enrollment?.active && <button onClick={() => void optOutWellness().then(load)} className="text-xs font-medium text-content-tertiary hover:text-content-primary">Turn off insights</button>}</div>
      {row ? <InsightBody row={row} onAsk={onAsk} /> : <><p className="mt-3 max-w-2xl text-sm leading-6 text-content-secondary">Answer six short questions about sleep, meals, energy, stress, hydration, and movement. Every answer saves, and you can skip anything you’d rather not share.</p><div className="mt-4 flex flex-wrap items-center gap-3"><button onClick={() => void openCheckIn()} className="rounded-hv-button bg-action-primary px-4 py-2.5 text-sm font-semibold text-content-on-action">{state.checkIn?.answered_count ? `Resume · ${state.checkIn.answered_count} of 6 answered` : 'Start the 2-minute check-in'}</button>{compact && !state.enrollment?.active && <button onClick={() => void snoozeWellness().then(() => setState(null)).then(load)} className="px-3 py-2 text-sm font-semibold text-content-secondary">Remind me later</button>}</div><p className="mt-3 text-xs text-content-tertiary">Starting opts you in. You can turn this off at any time.</p></>}
      {!compact && row && <button onClick={() => void getWellnessHistory().then((result) => setHistory(result.items))} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-action-primary"><History className="h-4 w-4" /> View insight history</button>}
      {history.length > 0 && <div className="mt-4 border-t border-stroke-subtle pt-4"><h3 className="text-sm font-semibold text-content-primary">Previous insights</h3><div className="mt-2 space-y-2">{history.slice(1).map((item) => <button key={item.id} className="block w-full rounded-lg bg-surface-sunken p-3 text-left text-sm text-content-secondary">Version {item.version} · {new Date(item.generated_at).toLocaleDateString()} — {item.insight.snapshot}</button>)}</div></div>}
      {checkInOpen && <div className="fixed inset-0 z-[70] flex justify-end bg-black/40" role="dialog" aria-modal="true" aria-labelledby="check-in-title"><div className="flex h-full w-full max-w-lg flex-col bg-surface-raised p-6 shadow-xl"><div className="flex items-center justify-between"><button onClick={() => setCheckInOpen(false)} aria-label="Close check-in"><ChevronLeft className="h-5 w-5" /></button><span className="text-sm font-semibold text-content-secondary">{questionIndex + 1} of 6</span><button onClick={() => setCheckInOpen(false)} aria-label="Close check-in"><X className="h-5 w-5" /></button></div><div className="mt-8 h-1.5 overflow-hidden rounded-full bg-surface-sunken"><div className="h-full bg-action-primary transition-all" style={{ width: `${((questionIndex + 1) / 6) * 100}%` }} /></div><div className="flex flex-1 flex-col justify-center"><p className="text-xs font-semibold uppercase tracking-wider text-action-primary">{questions[CHECK_IN_QUESTION_KEYS[questionIndex]].title}</p><h2 id="check-in-title" className="mt-2 text-2xl font-semibold text-content-primary">{questions[CHECK_IN_QUESTION_KEYS[questionIndex]].prompt}</h2><textarea autoFocus rows={6} value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder={questions[CHECK_IN_QUESTION_KEYS[questionIndex]].placeholder} className="mt-6 w-full rounded-xl border border-stroke-default bg-surface-raised p-4 text-content-primary outline-none focus:border-action-primary" /><p className="mt-3 text-xs text-content-tertiary">Your answer saves when you continue. Wellness guidance only—not medical advice.</p></div><div className="flex items-center justify-between gap-3"><button onClick={() => void save(true)} disabled={saving} className="px-3 py-2 text-sm font-semibold text-content-secondary">Skip</button><button onClick={() => void save(false)} disabled={saving || !answer.trim()} className="inline-flex items-center gap-2 rounded-hv-button bg-action-primary px-5 py-2.5 text-sm font-semibold text-content-on-action disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save & continue</button></div></div></div>}
    </section>
  );
}
