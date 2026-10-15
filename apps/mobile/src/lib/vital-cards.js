const PRESENTATION = {
  heart_rate: { icon: 'heart', tone: 'danger' },
  blood_pressure: { icon: 'pulse', tone: 'danger' },
  respiratory_rate: { icon: 'cloud', tone: 'info' },
  oxygen_saturation: { icon: 'water', tone: 'info' },
  body_temperature: { icon: 'thermometer', tone: 'warning' },
  weight: { icon: 'body', tone: 'accent' },
  blood_glucose: { icon: 'medkit', tone: 'signal' },
  steps: { icon: 'footsteps', tone: 'success' },
  sleep_duration: { icon: 'bed', tone: 'ai' },
  active_energy: { icon: 'flame', tone: 'signal' },
  workout_duration: { icon: 'barbell', tone: 'warning' },
};

export function vitalPresentation(metric) {
  return PRESENTATION[metric] ?? { icon: 'analytics', tone: 'accent' };
}

export function displayUnit(unit) {
  if (unit === 'Cel') return '°C';
  if (unit === '[degF]') return '°F';
  return unit || '';
}

export function formatMeasure(value) {
  if (!Number.isFinite(Number(value))) return '—';
  const rounded = Math.round(Number(value) * 100) / 100;
  return rounded.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export function durationParts(value, unit) {
  const minutes = unit === 'h' ? Number(value) * 60 : Number(value);
  if (!Number.isFinite(minutes)) return [{ value: '—', unit: 'min' }];
  const whole = Math.max(0, Math.round(minutes));
  const hours = Math.floor(whole / 60);
  const rest = whole % 60;
  if (hours > 0 && rest > 0) return [{ value: String(hours), unit: 'hr' }, { value: String(rest), unit: 'min' }];
  if (hours > 0) return [{ value: String(hours), unit: 'hr' }];
  return [{ value: String(rest), unit: 'min' }];
}

export function vitalFigure(row) {
  if (!row) return [];
  if (row.metric === 'sleep_duration' || row.metric === 'workout_duration') return durationParts(row.value ?? row.secondaryValue, row.unit);
  if (row.metric === 'steps') return [{ value: formatMeasure(row.value), unit: 'steps' }];
  const parts = [{ value: formatMeasure(row.value), unit: displayUnit(row.unit) }];
  if (row.secondary_value != null || row.secondaryValue != null) {
    parts.push({ value: formatMeasure(row.secondary_value ?? row.secondaryValue), unit: displayUnit(row.unit), paired: true });
  }
  return parts;
}

export function relativeVitalTime(value, now = new Date()) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  const sameDay = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
  if (sameDay) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString('en-US', sameYear
    ? { month: 'short', day: 'numeric' }
    : { month: 'short', day: 'numeric', year: 'numeric' });
}

export function groupVitals(rows) {
  const groups = [];
  const index = new Map();
  for (const row of rows ?? []) {
    if (!row?.metric) continue;
    let group = index.get(row.metric);
    if (!group) {
      group = { metric: row.metric, latest: row, readings: [] };
      index.set(row.metric, group);
      groups.push(group);
    }
    if (group.readings.length < 7) group.readings.push(row);
  }
  return groups.map((group) => ({ ...group, readings: group.readings.slice().reverse() }));
}

export function vitalBars(values) {
  const numbers = (values ?? []).map(Number).filter((value) => Number.isFinite(value));
  if (!numbers.length) return [];
  const max = Math.max(...numbers);
  const min = Math.min(...numbers);
  const span = max - min;
  return numbers.map((value) => (span === 0 ? 1 : 0.35 + 0.65 * ((value - min) / span)));
}
