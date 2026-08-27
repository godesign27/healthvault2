import { MiniStat } from '../shared/mini-stat';
import { SectionHeader } from '../shared/section-header';
import { useGptInsights } from '../insights/use-gpt-insights';

export function InteractionsDashboard() {
  const state = useGptInsights();
  if (state.status !== 'ready') return <div className="dashboard-message">{state.status === 'error' ? state.error : 'Loading interaction narrative…'}</div>;
  const data = state.data.metrics.interactions;
  const max = Math.max(...data.failureReasons.map((reason) => reason.tasks), 1);
  return <div className="section-dashboard"><SectionHeader eyebrow="Interaction quality" title="Rephrasing is the clearest friction signal" description="Separate user-visible task outcomes from internal model and tool activity." />
    <section className="mini-stat-grid five"><MiniStat label="Correction rate" value={`${data.correctionRate}%`} context="User changed prior information" /><MiniStat label="Rephrase rate" value={`${data.rephraseRate}%`} context="Repeated intent, new wording" /><MiniStat label="Abandonment" value={`${data.abandonmentRate}%`} context="Stopped before completion" /><MiniStat label="Tool failure" value={`${data.toolFailureRate}%`} context="Capability execution errors" /><MiniStat label="Explicit feedback" value={`${data.explicitFeedbackRate}%`} context="Tasks with a rating" /></section>
    <div className="narrative-grid"><section className="chart-card"><p className="eyebrow">Ranked failures</p><h3>Unavailable sources affect the most users</h3><div className="ranked-bars">{data.failureReasons.map((reason) => <div key={reason.reason}><div><span>{reason.reason}</span><strong>{reason.tasks}</strong></div><div className="rank-track"><span style={{ width: `${reason.tasks / max * 100}%` }} /></div><small>{reason.users} users · {reason.changePercent > 0 ? '+' : ''}{reason.changePercent}%</small></div>)}</div></section>
      <section className="narrative-card"><p className="eyebrow">Investigation</p><h3>Fix source visibility before tuning language</h3><p>Rephrasing is elevated, but the largest failure category is unavailable source data. The product should make missing prerequisites visible before a task begins, then measure whether repeat attempts fall.</p><ul className="plain-list"><li>Inspect source type and capability combinations</li><li>Confirm failures are not classifier artifacts</li><li>Compare correction rate after prerequisite messaging</li></ul></section></div>
  </div>;
}
