import { MiniStat } from '../shared/mini-stat';
import { SectionHeader } from '../shared/section-header';
import { useGptInsights } from '../insights/use-gpt-insights';

export function UnmetNeedsDashboard() {
  const state = useGptInsights();
  if (state.status !== 'ready') return <div className="dashboard-message">{state.status === 'error' ? state.error : 'Loading unmet needs…'}</div>;
  const unmet = state.data.metrics.unmetNeeds;
  return <div className="section-dashboard"><SectionHeader eyebrow="Opportunity discovery" title="Explanation and follow-up needs are emerging" description="Rank privacy-safe clusters from unsupported, failed, rephrased, abandoned, and explicit request signals." />
    <section className="mini-stat-grid"><MiniStat label="Signals" value={String(unmet.totalSignals)} context="Across all cluster inputs" /><MiniStat label="Affected users" value={String(unmet.affectedUsers)} context="Privacy-safe unique count" /><MiniStat label="Growing clusters" value={String(unmet.growingClusters)} context="Positive period growth" /><MiniStat label="Reviewed" value={`${unmet.reviewedPercent}%`} context="Human review completed" /></section>
    <section className="opportunity-list"><div className="opportunity-heading"><div><p className="eyebrow">Advisory ranking</p><h3>Highest-evidence opportunities</h3></div><span>Score is advisory—not a roadmap decision</span></div>{unmet.clusters.map((cluster, index) => <article key={cluster.label}><span className="rank-number">{index + 1}</span><div><h4>{cluster.label}</h4><p>{cluster.dominantSignal} · {cluster.signals} signals · {cluster.users} users · {(cluster.confidence * 100).toFixed(0)}% confidence</p></div><div className="growth-label">+{cluster.growthPercent}%<small>growth</small></div><div className="score-label">{cluster.opportunityScore}<small>opportunity</small></div></article>)}</section>
    <section className="narrative-strip"><div><p className="eyebrow">Recommended investigation</p><h3>Test explanation boundaries before building advice</h3></div><p>Users appear to want help understanding changes in lab results. Research should distinguish safe explanation, record summarization, and requests for medical advice before defining a capability.</p></section>
  </div>;
}
