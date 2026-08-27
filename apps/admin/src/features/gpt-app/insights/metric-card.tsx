interface MetricCardProps {
  label: string;
  value: string;
  change: string;
  definition: string;
}

export function MetricCard({ label, value, change, definition }: MetricCardProps) {
  const isPositive = change.startsWith('+');
  return (
    <article className="metric-card">
      <div className="metric-card-heading"><span>{label}</span><button className="info-button" type="button" title={definition} aria-label={`${label} definition: ${definition}`}>i</button></div>
      <strong>{value}</strong>
      <p><span className={isPositive ? 'change-positive' : 'change-neutral'}>{change}</span> vs previous period</p>
    </article>
  );
}
