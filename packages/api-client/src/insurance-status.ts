/** Stored workflow flags are not insurer eligibility evidence. */
export function insuranceStatus(status: string | null | undefined) {
  switch (status) {
    case 'saved': case 'connected': case 'verified': return { label: 'Saved', tone: 'info' } as const;
    case 'missing_member_id': return { label: 'Member ID needed', tone: 'warning' } as const;
    case 'verifying': return { label: 'Not verified', tone: 'info' } as const;
    case 'expired': return { label: 'End date passed', tone: 'warning' } as const;
    case 'expiring': return { label: 'Ending soon', tone: 'warning' } as const;
    default: return { label: 'Needs review', tone: 'warning' } as const;
  }
}
export const insuranceVerificationNotice = 'Saved information only. Health Vault has not checked benefits or eligibility with your insurer.';
export function insuranceDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match) {
    const [, y, m, d] = match.map(Number);
    const date = new Date(y, m - 1, d, 12);
    return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date : null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
export function coverageEndState(value: string | null | undefined, now = new Date()): 'expired' | 'expiring' | null {
  const end = insuranceDate(value);
  if (!end) return null;
  const calendarDay = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const days = (calendarDay(end) - calendarDay(now)) / 86400000;
  return days < 0 ? 'expired' : days <= 30 ? 'expiring' : null;
}
export function formatInsuranceDate(value: string | null | undefined) {
  return insuranceDate(value)?.toLocaleDateString() ?? 'Date not recorded';
}

/** Display only an explicitly supplied member ID, never a legacy hash column. */
export function displayInsuranceMemberId(value: string | null | undefined): string {
  const id = value?.trim();
  return id ? `••••${id.slice(-4)}` : 'Not available';
}

/** New writes identify their storage field explicitly; never duplicate IDs into legacy storage. */
export function insuranceMemberIdFields(value: string | null | undefined) {
  return {member_id: value?.trim() || null, member_id_hash: ''};
}

/** Card status describes stored fields, never legacy insurer-verification flags. */
export function insuranceCoverageStatus(coverage: {memberId?: string | null; effectiveEnd?: string | null}, now = new Date()) {
  return coverageEndState(coverage.effectiveEnd, now) || (coverage.memberId?.trim() ? 'saved' : 'missing_member_id');
}

/** Stable insurer initials for cards without depending on remote logo assets. */
export function insuranceProviderInitials(name: string | null | undefined) {
  const words = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  return (words.length > 1 ? words.slice(0, 2).map(word => Array.from(word)[0]).join('') : Array.from(words[0] ?? '').slice(0, 2).join('')).toLocaleUpperCase() || 'IN';
}
