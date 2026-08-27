import type { GptActivityPoint } from '@health-vault/analytics-contracts';

interface ActivityChartProps { points: readonly GptActivityPoint[] }

const WIDTH = 720;
const HEIGHT = 220;
const PADDING = 28;

function getCoordinates(values: readonly number[], maxValue: number): string {
  const width = WIDTH - PADDING * 2;
  const height = HEIGHT - PADDING * 2;
  return values.map((value, index) => {
    const x = PADDING + (index / Math.max(values.length - 1, 1)) * width;
    const y = HEIGHT - PADDING - (value / maxValue) * height;
    return `${x},${y}`;
  }).join(' ');
}

export function ActivityChart({ points }: ActivityChartProps) {
  const maxValue = Math.max(...points.flatMap((point) => [point.activeUsers, point.meaningfulTasks]), 1);
  const taskPoints = getCoordinates(points.map((point) => point.meaningfulTasks), maxValue);
  const userPoints = getCoordinates(points.map((point) => point.activeUsers), maxValue);
  const firstDate = points[0]?.date ?? '';
  const lastDate = points[points.length - 1]?.date ?? '';

  return (
    <section className="chart-card chart-card-wide">
      <div className="chart-heading"><div><p className="eyebrow">Usage</p><h3>Meaningful tasks are growing faster than active users</h3></div><div className="chart-legend"><span className="legend-tasks">Tasks</span><span className="legend-users">Active users</span></div></div>
      <svg className="line-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-labelledby="activity-title activity-description">
        <title id="activity-title">Daily GPT App activity</title>
        <desc id="activity-description">Meaningful tasks and active users increase throughout the synthetic seven-day fixture.</desc>
        {[0.25, 0.5, 0.75, 1].map((ratio) => <line key={ratio} x1={PADDING} y1={HEIGHT - PADDING - ratio * (HEIGHT - PADDING * 2)} x2={WIDTH - PADDING} y2={HEIGHT - PADDING - ratio * (HEIGHT - PADDING * 2)} className="chart-grid" />)}
        <polyline points={taskPoints} className="chart-line chart-line-tasks" />
        <polyline points={userPoints} className="chart-line chart-line-users" />
        <text x={PADDING} y={HEIGHT - 5}>{firstDate.slice(5)}</text>
        <text x={WIDTH - PADDING} y={HEIGHT - 5} textAnchor="end">{lastDate.slice(5)}</text>
      </svg>
      <details className="data-table-toggle"><summary>View data table</summary><table><thead><tr><th>Date</th><th>Active users</th><th>Meaningful tasks</th></tr></thead><tbody>{points.map((point) => <tr key={point.date}><td>{point.date}</td><td>{point.activeUsers}</td><td>{point.meaningfulTasks}</td></tr>)}</tbody></table></details>
    </section>
  );
}
