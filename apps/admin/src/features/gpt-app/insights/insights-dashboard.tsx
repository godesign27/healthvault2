import { AlertTriangle, Clock3, HelpCircle } from 'lucide-react';
import { StatePanel } from '../../../components/state-panel';
import { ActivityChart } from './activity-chart';
import { IntentChart } from './intent-chart';
import { MetricCard } from './metric-card';
import { OutcomeChart } from './outcome-chart';
import { useGptInsights } from './use-gpt-insights';

function formatDateRange(start: string, end: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  return `${formatter.format(new Date(start))}–${formatter.format(new Date(end))}`;
}

export function InsightsDashboard() {
  const state = useGptInsights();
  if (state.status === 'loading') return <div className="dashboard-message">Loading metric snapshot…</div>;
  if (state.status === 'error') return <StatePanel title="Insights unavailable" description={state.error} />;

  const { metrics } = state.data;
  return (
    <div className="insights-dashboard">
      <div className="snapshot-banner"><div><span className={`data-status data-status-${state.data.dataStatus}`}>{state.data.dataStatus} data</span><strong>{formatDateRange(state.data.periodStart, state.data.periodEnd)}</strong><span>Compared with the previous seven days</span></div><div><span>Updated</span><strong>{new Date(state.data.generatedAt).toLocaleString()}</strong></div></div>
      {state.data.dataStatus === 'synthetic' && <div className="synthetic-notice"><AlertTriangle size={18} /><p><strong>Deterministic test fixture.</strong> These values validate dashboard behavior and do not represent real HealthVault users.</p></div>}
      <section className="metric-grid" aria-label="Key GPT App metrics">
        <MetricCard label="Active users" value={metrics.activeUsers.toLocaleString()} change={`+${metrics.activeUsersChangePercent}%`} definition="Unique privacy-safe users with at least one meaningful GPT task in the selected period." />
        <MetricCard label="Meaningful tasks" value={metrics.meaningfulTasks.toLocaleString()} change={`+${metrics.meaningfulTasksChangePercent}%`} definition="User-initiated requests with a classified intent and requested outcome. Internal model and tool calls are excluded." />
        <MetricCard label="Success rate" value={`${metrics.successRate}%`} change={`+${metrics.successRateChangePoints} pts`} definition="Successful tasks divided by supported tasks with a known outcome." />
        <MetricCard label="Tasks per active user" value={metrics.tasksPerActiveUser.toFixed(1)} change={`+${metrics.tasksPerActiveUserChangePercent}%`} definition="Meaningful GPT tasks divided by active users in the selected period." />
      </section>
      <ActivityChart points={metrics.activity} />
      <div className="chart-grid-layout"><OutcomeChart outcomes={metrics.outcomes} /><IntentChart intents={metrics.topIntents} /></div>
      <section className="attention-card"><div><p className="eyebrow">Needs attention</p><h3>Quality signals to watch before live rollout</h3></div><ul><li><Clock3 size={19} /><span><strong>{(metrics.p95LatencyMs / 1000).toFixed(2)}s p95 latency</strong><small>Target is under 3 seconds</small></span></li><li><HelpCircle size={19} /><span><strong>{metrics.unknownOutcomeRate}% unknown outcomes</strong><small>Release gate is below 10%</small></span></li><li><AlertTriangle size={19} /><span><strong>{metrics.unsupportedRate}% unsupported</strong><small>Review fastest-growing unmet needs</small></span></li></ul></section>
      <footer className="snapshot-footer">Source: {state.data.sourceVersion} · Snapshot v{state.data.snapshotVersion} · Definitions available on each metric</footer>
    </div>
  );
}
