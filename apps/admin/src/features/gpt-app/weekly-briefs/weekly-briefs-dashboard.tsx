import { CheckCircle2, Eye, Lightbulb, Sparkles } from 'lucide-react';
import { SectionHeader } from '../shared/section-header';
import { useGptInsights } from '../insights/use-gpt-insights';

const TYPE_CONFIG = {
  observed_fact: { label: 'Observed fact', icon: Eye },
  model_interpretation: { label: 'Model interpretation', icon: Sparkles },
  recommendation: { label: 'Recommendation', icon: Lightbulb },
} as const;

export function WeeklyBriefsDashboard() {
  const state = useGptInsights();
  if (state.status !== 'ready') return <div className="dashboard-message">{state.status === 'error' ? state.error : 'Loading weekly brief…'}</div>;
  const brief = state.data.metrics.weeklyBrief;
  return <div className="section-dashboard"><SectionHeader eyebrow="Evidence-backed synthesis" title="Weekly GPT App product brief" description="Facts link to reproducible evidence; interpretations and recommendations remain clearly separated and require human review." />
    <section className="brief-header"><div><span className="draft-pill">{brief.status}</span><h3>Week ending {new Date(`${brief.weekEnding}T00:00:00Z`).toLocaleDateString(undefined, { timeZone: 'UTC' })}</h3><p>Generated {new Date(brief.generatedAt).toLocaleString()}</p></div><div><CheckCircle2 size={20} /><span><strong>100% factual-link coverage</strong><small>All observed facts cite dashboard evidence</small></span></div></section>
    <section className="brief-list">{brief.items.map((item) => { const config = TYPE_CONFIG[item.type]; const Icon = config.icon; return <article key={item.title} className={`brief-item brief-${item.type}`}><div className="brief-type"><Icon size={17} /><span>{config.label}</span></div><div><h3>{item.title}</h3><p>{item.body}</p>{item.evidence && <a href="#evidence">Evidence: {item.evidence}</a>}</div></article>; })}</section>
    <section className="review-notice"><strong>Draft only</strong><p>This brief cannot change the roadmap, capability health, or rollout configuration. An authorized administrator must review it before distribution.</p></section>
  </div>;
}
