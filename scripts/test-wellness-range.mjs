import assert from 'node:assert/strict';
import {
  currentWellnessEnd,
  formatWellnessRange,
  isCurrentWellnessWindow,
  shiftWellnessEnd,
  wellnessBounds,
  wellnessEndContaining,
} from '../packages/api-client/src/wellness-range.ts';

const now = new Date(2026, 9, 12, 15, 30);
const end = currentWellnessEnd(now);
assert.equal(end.getFullYear(), 2026);
assert.equal(end.getMonth(), 9);
assert.equal(end.getDate(), 13);
assert.equal(end.getHours(), 0);
assert.equal(isCurrentWellnessWindow(end, now), true);

const current = wellnessBounds(end);
assert.equal(current.start.getDate(), 6);
assert.equal(current.end.getDate(), 13);
assert.equal(formatWellnessRange(current.start, current.end), 'Oct 6 – Oct 12, 2026');

const earlier = shiftWellnessEnd(end, 'earlier', now);
assert.equal(earlier.getDate(), 6);
assert.equal(isCurrentWellnessWindow(earlier, now), false);
const earlierBounds = wellnessBounds(earlier);
assert.equal(formatWellnessRange(earlierBounds.start, earlierBounds.end), 'Sep 29 – Oct 5, 2026');

const forward = shiftWellnessEnd(earlier, 'later', now);
assert.equal(forward.getTime(), end.getTime());
const stayed = shiftWellnessEnd(end, 'later', now);
assert.equal(stayed.getTime(), end.getTime());

const yearBoundary = wellnessBounds(new Date(2026, 0, 3));
assert.equal(formatWellnessRange(yearBoundary.start, yearBoundary.end), 'Dec 27, 2025 – Jan 2, 2026');

const containing = wellnessEndContaining(new Date(2026, 8, 19, 7), now);
const containingBounds = wellnessBounds(containing);
assert.equal(formatWellnessRange(containingBounds.start, containingBounds.end), 'Sep 15 – Sep 21, 2026');
assert.equal(wellnessEndContaining(now, now).getTime(), end.getTime());
console.log('PASS wellness range: seven local days, earlier week, next stops at today');
