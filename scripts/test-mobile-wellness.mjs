import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source = readFileSync('apps/mobile/src/lib/wellnessData.js', 'utf8');
const {loadWellness, saveDietEntry, removeDietEntry} = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const calls = [];
let failure = null;
let signedIn = true;
const client = {
  auth: {getUser: async () => ({data: {user: signedIn ? {id: 'owner'} : null}})},
  from(table) {
    const filters = [];
    let action = 'select';
    calls.push({table, filters, get action() { return action; }});
    const finish = () => Promise.resolve({data: [{id: table}], error: table === failure ? Error('Denied') : null});
    const q = {
      select() { action = 'select'; return q; },
      update(entry) { action = 'update'; filters.push(['entry', entry]); return q; },
      delete() { action = 'delete'; return q; },
      eq(...args) { filters.push(args); return q; },
      gte(...args) { filters.push(['gte', ...args]); return q; },
      lt(...args) { filters.push(['lt', ...args]); return q; },
      order() { return finish(); },
      then(resolve, reject) { return finish().then(resolve, reject); },
    };
    return q;
  },
};
const data = await loadWellness(client, '2026-10-06T00:00:00.000Z', '2026-10-13T00:00:00.000Z');
assert.deepEqual(calls.map((call) => call.table), ['diet_log_entries', 'life_signal_entries']);
assert.ok(calls.every((call) => call.filters.some((filter) => filter[0] === 'user_id' && filter[1] === 'owner')));
assert.ok(calls[0].filters.some((filter) => filter[0] === 'gte' && filter[1] === 'consumed_at'));
assert.ok(calls[0].filters.some((filter) => filter[0] === 'lt' && filter[1] === 'consumed_at'));
assert.equal(data.diet[0].id, 'diet_log_entries');
failure = 'life_signal_entries';
await assert.rejects(loadWellness(client, '2026-10-06T00:00:00.000Z', '2026-10-13T00:00:00.000Z'), /Denied/);
signedIn = false;
calls.length = 0;
await assert.rejects(loadWellness(client, 'a', 'b'), /Sign in/);
assert.equal(calls.length, 0);
signedIn = true;
failure = null;
calls.length = 0;
await saveDietEntry(client, 'meal-1', {meal_type: 'lunch', items: [{name: 'Soup'}]});
assert.equal(calls.at(-1).action, 'update');
assert.ok(calls.at(-1).filters.some((filter) => filter[0] === 'id' && filter[1] === 'meal-1'));
assert.ok(calls.at(-1).filters.some((filter) => filter[0] === 'user_id' && filter[1] === 'owner'));
await removeDietEntry(client, 'meal-1');
assert.equal(calls.at(-1).action, 'delete');
assert.ok(calls.at(-1).filters.some((filter) => filter[0] === 'user_id' && filter[1] === 'owner'));
const screen = readFileSync('apps/mobile/src/screens/WellnessScreen.js', 'utf8');
assert.match(screen, /Previous 7 days/);
assert.match(screen, /Next 7 days/);
assert.match(screen, /shiftWellnessEnd/);
assert.doesNotMatch(screen, /coming soon/i);
assert.match(screen, /NoticeBanner/);
assert.match(screen, /out of 5/);
assert.match(screen, />Meals</);
assert.match(screen, /inverse/);
assert.match(screen, /Show latest meals/);
assert.match(readFileSync('apps/mobile/src/lib/wellnessData.js', 'utf8'), /latestDietMoment/);
console.log('PASS wellness: owner-scoped week query, meal save and remove, phone date arrows');
