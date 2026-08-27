import { MiniStat } from '../shared/mini-stat';
import { SectionHeader } from '../shared/section-header';
import { useGptInsights } from '../insights/use-gpt-insights';

export function CapabilitiesDashboard() {
  const state = useGptInsights();
  if (state.status !== 'ready') return <div className="dashboard-message">{state.status === 'error' ? state.error : 'Loading capability health…'}</div>;
  const health = state.data.metrics.capabilityHealth;
  return <div className="section-dashboard"><SectionHeader eyebrow="Capability health" title="Two workflows need attention before expansion" description="Compare adoption, outcome quality, latency, and dominant failure modes for every released GPT capability." />
    <section className="mini-stat-grid"><MiniStat label="Tracked capabilities" value={String(health.capabilities.length)} context="Versioned GPT workflows" /><MiniStat label="Healthy" value={String(health.healthy)} context="Meeting pilot thresholds" /><MiniStat label="Degraded" value={String(health.degraded)} context="Action required" /><MiniStat label="Unavailable" value={String(health.unavailable)} context="Emergency state" /></section>
    <section className="table-card"><div><p className="eyebrow">Operational health</p><h3>Medical Forms and Add Information miss pilot thresholds</h3></div><div className="responsive-table"><table><thead><tr><th>Capability</th><th>Health</th><th>Requests</th><th>Users</th><th>Success</th><th>p95 latency</th><th>Top failure</th></tr></thead><tbody>{health.capabilities.map((capability) => <tr key={capability.id}><td><strong>{capability.name}</strong><small>{capability.id}</small></td><td><span className={`health-pill health-${capability.status}`}>{capability.status.replace('_', ' ')}</span></td><td>{capability.requests}</td><td>{capability.users}</td><td>{capability.successRate}%</td><td>{(capability.p95LatencyMs / 1000).toFixed(2)}s</td><td>{capability.topFailure}</td></tr>)}</tbody></table></div></section>
    <section className="narrative-strip"><div><p className="eyebrow">Recommended action</p><h3>Hold rollout increases for degraded capabilities</h3></div><p>Review validation and confirmation failures before changing rollout percentages. Health status is advisory until live metric reconciliation and authorization tests pass.</p></section>
  </div>;
}
