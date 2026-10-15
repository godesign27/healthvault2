const METRICS = new Set([
  'heart_rate', 'blood_pressure', 'respiratory_rate', 'oxygen_saturation', 'body_temperature',
  'weight', 'blood_glucose', 'steps', 'sleep_duration', 'active_energy', 'workout_duration',
]);

// The same measurements the Health Vault GPT reviews from Apple Health, capped to one import.
export function appleHealthVitals(samples) {
  const vitals = [];
  const seen = new Set();
  for (const sample of samples ?? []) {
    if (!METRICS.has(sample?.metric)) continue;
    if (typeof sample.value !== 'number' || !Number.isFinite(sample.value)) continue;
    if (typeof sample.unit !== 'string' || !sample.unit.trim()) continue;
    const observed = new Date(sample.observedAt);
    if (!sample.observedAt || Number.isNaN(observed.getTime())) continue;
    const vital = { metric: sample.metric, value: sample.value, unit: sample.unit.trim(), observedAt: observed.toISOString() };
    if (sample.metric === 'blood_pressure') {
      if (typeof sample.secondaryValue !== 'number' || !Number.isFinite(sample.secondaryValue)) continue;
      vital.secondaryValue = sample.secondaryValue;
    } else if (sample.secondaryValue != null) {
      continue;
    }
    if (sample.sourceRecordId) vital.sourceRecordId = String(sample.sourceRecordId).slice(0, 240);
    const deviceName = typeof sample.deviceName === 'string' ? sample.deviceName.trim() : '';
    if (deviceName) vital.deviceName = deviceName.slice(0, 160);
    const key = `${vital.metric}|${vital.observedAt}|${vital.value}|${vital.secondaryValue ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    vitals.push(vital);
    if (vitals.length === 100) break;
  }
  return vitals;
}

export function buildAppleHealthImport(samples, idempotencyKey) {
  const vitals = appleHealthVitals(samples);
  if (!vitals.length) return null;
  return {
    sourceKind: 'chatgpt_health_apple_health',
    sourceName: 'Apple Health',
    idempotencyKey,
    vitals,
  };
}
