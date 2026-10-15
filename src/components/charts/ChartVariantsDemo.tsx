import { useState } from 'react';
import { TrendChart, type ChartVariant } from './TrendChart';
import { chartOrder, chartSeed } from './chartPolicy';

/** Design-system examples only: seeded synthetic values, never patient data. */
export function ChartVariantsDemo() {
  const [grayscale, setGrayscale] = useState(false);
  const [replay, setReplay] = useState(0);
  const labels = chartSeed[0].map((_, index) => `Period ${index + 1}`);
  const series = chartOrder.slice(0, 6).map((key, index) => ({ key, label: key, values: chartSeed[index] }));
  return <section aria-label="Chart variants" className="space-y-6">
    <h2 className="text-xl font-semibold">Chart variants</h2>
    <p>Base, Signal and AI context treatments with synthetic reference data. Series colors, order, dashes and markers stay consistent. Textures add another visual cue.</p>
    <div className="hv-chart-demo-controls">
      <label><input type="checkbox" checked={grayscale} onChange={event => setGrayscale(event.target.checked)} /> Grayscale check</label>
      <button type="button" className="rounded-lg border border-stroke-default px-4" onClick={() => setReplay(value => value + 1)}>Replay entrance</button>
    </div>
    <p className="text-content-secondary">Grayscale checks color-independent cues; it is not a clinical color-vision simulation. Entrance motion runs once and respects reduced motion. Exact values are always available in each table.</p>
    <div className={`${grayscale ? 'hv-chart-demo-gray' : ''} space-y-6`}>
      {(['light', 'dark'] as const).flatMap(mode => (['base', 'signal', 'ai'] as ChartVariant[]).map(variant => <TrendChart
        key={`${mode}-${variant}-${replay}`} mode={mode} variant={variant} textures animate
        title={`${variant === 'ai' ? 'AI' : variant.charAt(0).toUpperCase() + variant.slice(1)} reference — ${mode}`}
        labels={labels} series={series}
      />))}
    </div>
  </section>;
}
