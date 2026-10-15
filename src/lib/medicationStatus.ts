/** Local calendar cutoff shared by saved date-only medications and count queries. */
export function medicationEndDateCutoff(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/** Date-only prescriptions remain active through their local calendar end date. */
export function hasMedicationEnded(endDate: string | null | undefined, now = new Date()): boolean {
  if (!endDate) return false;
  if (/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    const parsed = new Date(`${endDate}T00:00:00Z`);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== endDate) return false;
    return endDate < medicationEndDateCutoff(now);
  }
  const end = new Date(endDate).getTime();
  return Number.isFinite(end) && end < now.getTime();
}
