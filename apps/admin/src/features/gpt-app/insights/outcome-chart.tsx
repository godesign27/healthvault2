import type { GptOutcomeSummary } from '@health-vault/analytics-contracts';

interface OutcomeChartProps { outcomes: GptOutcomeSummary }

const OUTCOME_CONFIG = [
  ['success', 'Success'], ['partialSuccess', 'Partial'], ['failure', 'Failure'],
  ['abandoned', 'Abandoned'], ['unsupported', 'Unsupported'], ['unknown', 'Unknown'],
] as const;

export function OutcomeChart({ outcomes }: OutcomeChartProps) {
  const total = Object.values(outcomes).reduce((sum, value) => sum + value, 0);
  return (
    <section className="chart-card">
      <div className="chart-heading"><div><p className="eyebrow">Outcomes</p><h3>Most tasks reach a successful outcome</h3></div></div>
      <div className="outcome-bar" role="img" aria-label="Task outcome composition">
        {OUTCOME_CONFIG.map(([key, label]) => <span key={key} className={`outcome-${key}`} style={{ width: `${(outcomes[key] / total) * 100}%` }} title={`${label}: ${outcomes[key]}`} />)}
      </div>
      <ul className="outcome-list">{OUTCOME_CONFIG.map(([key, label]) => <li key={key}><span className={`outcome-dot outcome-${key}`} /><span>{label}</span><strong>{((outcomes[key] / total) * 100).toFixed(1)}%</strong></li>)}</ul>
    </section>
  );
}
