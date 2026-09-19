import test from 'node:test';
import assert from 'node:assert/strict';
import { logDietEntries, logDietEntry, logLifeSignal } from './wellness.ts';

test('batch and single diet saves use the same atomic RPC and stable event identity', async () => {
  const calls: any[] = [];
  const db: any = { rpc: async (...args) => { calls.push(args); return { data: [{ id: 'existing' }], error: null }; } };
  const input = { consumedAt: '2026-09-19T13:00:00Z', mealType: 'breakfast' as const, items: [{ name: 'Test meal' }] };
  assert.deepEqual(await logDietEntries(db, 'ignored-owner', [input]), [{ id: 'existing' }]);
  assert.deepEqual(await logDietEntry(db, 'ignored-owner', input), { id: 'existing' });
  assert.deepEqual(calls[0], calls[1]);
  assert.equal(calls[0][0], 'confirm_wellness_entries');
  assert.equal(calls[0][1].p_entries[0].event_time, input.consumedAt);
  assert.equal('user_id' in calls[0][1].p_entries[0], false, 'RPC derives identity from auth.uid');
});

test('missing preview times fail before dispatch rather than becoming fresh events', async () => {
  let calls = 0;
  const db: any = { rpc: () => { calls++; } };
  await assert.rejects(logDietEntries(db, 'fixture', [{ mealType: 'breakfast', items: [{ name: 'Test' }] }]), /Reopen/);
  await assert.rejects(logLifeSignal(db, 'fixture', { energy: 3, sleep: 3, mood: 3, stress: 3, pain: 3 }), /Reopen/);
  assert.equal(calls, 0);
});

test('Life Signal preserves the preview timestamp and reports RPC failures', async () => {
  const input = { recordedAt: '2026-09-19T13:00:00Z', energy: 3, sleep: 3, mood: 3, stress: 3, pain: 3 };
  const db: any = { rpc: async (name, args) => {
    assert.equal(name, 'confirm_wellness_entries');
    assert.equal(args.p_kind, 'life_signal');
    assert.equal(args.p_entries[0].event_time, input.recordedAt);
    return { data: null, error: { message: 'rejected' } };
  } };
  await assert.rejects(logLifeSignal(db, 'fixture', input), /rejected/);
});
