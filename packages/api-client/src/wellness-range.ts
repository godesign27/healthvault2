const WINDOW_DAYS = 7;

export function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addLocalDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Exclusive end of the window that includes today. */
export function currentWellnessEnd(now = new Date()) {
  return addLocalDays(startOfLocalDay(now), 1);
}

export function wellnessBounds(endExclusive: Date, days = WINDOW_DAYS) {
  return { start: addLocalDays(endExclusive, -days), end: new Date(endExclusive) };
}

export function isCurrentWellnessWindow(endExclusive: Date, now = new Date()) {
  return endExclusive.getTime() >= currentWellnessEnd(now).getTime();
}

export function shiftWellnessEnd(endExclusive: Date, direction: 'earlier' | 'later', now = new Date()) {
  switch (direction) {
    case 'earlier':
      return addLocalDays(endExclusive, -WINDOW_DAYS);
    case 'later': {
      const latest = currentWellnessEnd(now);
      const next = addLocalDays(endExclusive, WINDOW_DAYS);
      return next.getTime() > latest.getTime() ? latest : next;
    }
    default: {
      const unreachable: never = direction;
      return unreachable;
    }
  }
}

function formatDay(date: Date, withYear: boolean) {
  return date.toLocaleDateString('en-US', withYear
    ? { month: 'short', day: 'numeric', year: 'numeric' }
    : { month: 'short', day: 'numeric' });
}

/** The seven-day window, aligned with today, that contains this moment. */
export function wellnessEndContaining(moment: Date, now = new Date()) {
  const latest = currentWellnessEnd(now);
  if (!(moment instanceof Date) || Number.isNaN(moment.getTime()) || moment.getTime() >= latest.getTime()) return latest;
  let end = latest;
  for (let step = 0; step < 520 && wellnessBounds(end).start.getTime() > moment.getTime(); step += 1) {
    end = addLocalDays(end, -WINDOW_DAYS);
  }
  return end;
}

export function formatWellnessRange(start: Date, endExclusive: Date) {
  const lastIncluded = addLocalDays(endExclusive, -1);
  const sameYear = start.getFullYear() === lastIncluded.getFullYear();
  return `${formatDay(start, !sameYear)} – ${formatDay(lastIncluded, true)}`;
}
