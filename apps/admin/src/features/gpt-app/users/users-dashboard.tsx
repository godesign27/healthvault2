import { SectionHeader } from '../shared/section-header';
import { MiniStat } from '../shared/mini-stat';
import { useGptInsights } from '../insights/use-gpt-insights';

export function UsersDashboard() {
  const state = useGptInsights();
  if (state.status === 'loading') return <div className="dashboard-message">Loading user narrative…</div>;
  if (state.status === 'error') return <div className="inline-error">{state.error}</div>;
  const users = state.data.metrics.users;
  const maxUsers = Math.max(...users.activationFunnel.map((stage) => stage.users), 1);
  return <div className="section-dashboard"><SectionHeader eyebrow="Activation & retention" title="Users reach value, then struggle to return" description="Follow users from account creation through activation and sustained engagement without exposing health content." />
    <section className="mini-stat-grid"><MiniStat label="New users" value={String(users.newUsers)} context="This seven-day period" /><MiniStat label="Activation rate" value={`${users.activationRate}%`} context="First task completed" /><MiniStat label="Engaged users" value={String(users.engagedUsers)} context="Returned within 7 days" /><MiniStat label="At risk" value={String(users.atRiskUsers)} context="Previously active, now declining" /></section>
    <div className="narrative-grid"><section className="chart-card"><p className="eyebrow">Activation funnel</p><h3>The largest loss happens after first-task success</h3><div className="funnel-list">{users.activationFunnel.map((stage) => <div key={stage.stage}><div><span>{stage.stage}</span><strong>{stage.users} · {stage.conversionRate}%</strong></div><div className="funnel-track"><span style={{ width: `${stage.users / maxUsers * 100}%` }} /></div></div>)}</div></section>
      <section className="narrative-card"><p className="eyebrow">What this means</p><h3>Activation is not the same as habit</h3><p>Most pilot users reach a first successful task, but the return rate falls to 50%. The next investigation should compare completed intent, source availability, and follow-up prompts for users who did and did not return.</p><div className="narrative-callout"><strong>29 returning users</strong><span>Users who came back after a dormant period</span></div></section></div>
    <section className="table-card"><div><p className="eyebrow">Cohorts</p><h3>Internal pilot users show the strongest repeat behavior</h3></div><div className="responsive-table"><table><thead><tr><th>Cohort</th><th>Users</th><th>Activated</th><th>Engaged 30d</th><th>Tasks/user</th></tr></thead><tbody>{users.cohorts.map((cohort) => <tr key={cohort.cohort}><td>{cohort.cohort}</td><td>{cohort.users}</td><td>{cohort.activated}</td><td>{cohort.engaged30d}</td><td>{cohort.tasksPerUser}</td></tr>)}</tbody></table></div></section>
  </div>;
}
