// Calendar dates are not UTC instants: preserve the provider's recorded day.
export function parseCareDate(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = new Date(day ? `${value}T12:00:00` : value);
  if (!Number.isFinite(date.getTime())) return null;
  if (day && (date.getFullYear() !== Number(day[1]) || date.getMonth() + 1 !== Number(day[2]) || date.getDate() !== Number(day[3]))) return null;
  return date;
}
export function formatCareDate(value) {
  return parseCareDate(value)?.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) ?? 'Date not recorded';
}
