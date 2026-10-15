import assert from 'node:assert/strict';
import { durationParts, groupVitals, relativeVitalTime, vitalBars, vitalFigure, vitalPresentation } from '../apps/mobile/src/lib/vital-cards.js';

const now = new Date(2026, 9, 12, 12, 30);
assert.equal(relativeVitalTime('2026-10-12T17:21:00.000Z', now) === 'Date unavailable' ? 'bad' : 'ok', 'ok');
assert.match(relativeVitalTime(new Date(2026, 9, 12, 11, 21).toISOString(), now), /11:21/);
assert.equal(relativeVitalTime(new Date(2026, 9, 3, 8, 55).toISOString(), now), 'Oct 3');
assert.equal(relativeVitalTime(new Date(2019, 4, 28, 8, 54).toISOString(), now), 'May 28, 2019');

assert.deepEqual(durationParts(90, 'min'), [{ value: '1', unit: 'hr' }, { value: '30', unit: 'min' }]);
assert.deepEqual(vitalFigure({ metric: 'blood_pressure', value: 118, secondary_value: 76, unit: 'mmHg' }).map((part) => part.value), ['118', '76']);
assert.equal(vitalFigure({ metric: 'body_temperature', value: 37, unit: 'Cel' })[0].unit, '°C');
assert.equal(vitalFigure({ metric: 'steps', value: 3561, unit: 'count' })[0].value, '3,561');
assert.equal(vitalFigure({ metric: 'steps', value: 3561, unit: 'count' })[0].unit, 'steps');
assert.equal(vitalPresentation('sleep_duration').icon, 'bed');
assert.equal(vitalPresentation('active_energy').icon, 'flame');

const groups = groupVitals([
  { id: 'new', metric: 'heart_rate', value: 80, observed_at: '2026-10-12T15:00:00.000Z' },
  { id: 'old', metric: 'heart_rate', value: 70, observed_at: '2026-10-11T15:00:00.000Z' },
  { id: 'steps', metric: 'steps', value: 8400, observed_at: '2026-10-12T14:00:00.000Z' },
]);
assert.deepEqual(groups.map((group) => group.metric), ['heart_rate', 'steps']);
assert.equal(groups[0].latest.id, 'new');
assert.deepEqual(groups[0].readings.map((row) => row.id), ['old', 'new']);
assert.equal(vitalBars([10, 10])[0], 1);
assert.ok(vitalBars([1, 5])[0] < vitalBars([1, 5])[1]);
console.log('PASS vital cards: latest group, recent bars, duration, and Health-style dates');
