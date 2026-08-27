import type { GptIntentSummary } from '@health-vault/analytics-contracts';

interface IntentChartProps { intents: readonly GptIntentSummary[] }

export function IntentChart({ intents }: IntentChartProps) {
  const maxTasks = Math.max(...intents.map((intent) => intent.tasks), 1);
  return (
    <section className="chart-card">
      <div className="chart-heading"><div><p className="eyebrow">Demand</p><h3>Health snapshot leads user demand</h3></div></div>
      <div className="intent-bars">{intents.map((intent) => <div className="intent-row" key={intent.intent}><div><span>{intent.intent}</span><strong>{intent.tasks}</strong></div><div className="intent-track"><span style={{ width: `${(intent.tasks / maxTasks) * 100}%` }} /></div><small>{intent.users} users · {intent.successRate}% success · +{intent.changePercent}%</small></div>)}</div>
      <details className="data-table-toggle"><summary>View data table</summary><table><thead><tr><th>Intent</th><th>Tasks</th><th>Users</th><th>Success</th><th>Change</th></tr></thead><tbody>{intents.map((intent) => <tr key={intent.intent}><td>{intent.intent}</td><td>{intent.tasks}</td><td>{intent.users}</td><td>{intent.successRate}%</td><td>+{intent.changePercent}%</td></tr>)}</tbody></table></details>
    </section>
  );
}
