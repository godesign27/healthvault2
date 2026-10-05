/** Calendar-only service dates must not be shifted into the viewer's timezone. */
export function formatRecordDate(value: string | null | undefined, empty = '—', locales?: string): string {
  if (!value) return empty;
  // Keep reduced-precision FHIR dates at their supplied precision.
  if (/^\d{4}(?:-\d{2})?$/.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return value;
    return date.toLocaleDateString(locales, { timeZone: 'UTC' });
  }
  // Timestamps represent instants and retain normal local-time display.
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(locales);
}
