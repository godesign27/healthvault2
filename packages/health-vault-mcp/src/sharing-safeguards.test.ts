import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { createCondition } from './health-writes.ts';
import { createHealthShare } from './health-sharing.ts';

test('a matching condition is rejected before insert', async () => {
  let writes = 0;
  const db: any = { from: () => ({ select: () => ({ limit: async () => ({ data: [{ name: ' Test condition ', status: 'Active' }], error: null }) }), insert: () => writes++ }) };
  await assert.rejects(createCondition(db, 'fixture', { name: 'test CONDITION' }), /already exists/);
  assert.equal(writes, 0);
});

test('a share snapshots only the selected category and preserves expiration', async () => {
  const tables: string[] = []; let inserted: any;
  const db: any = { from(table) {
    tables.push(table);
    const result = { data: table === 'user_profiles' ? { first_name: 'Test' } : [{ name: 'Test condition' }], error: null };
    const q: any = { select: () => q, order: () => q, limit: async () => result, maybeSingle: async () => result };
    q.insert = async row => { inserted = row; return { error: null }; }; return q;
  } };
  const before = Date.now();
  await createHealthShare(db, 'fixture-owner', 'https://example.invalid', { recipientName: 'Test', categories: ['conditions'], expiresInDays: 2 });
  assert.deepEqual(tables, ['conditions', 'user_profiles', 'share_events']);
  assert.deepEqual(Object.keys(inserted.options.healthShare.snapshot), ['conditions']);
  assert.equal(inserted.patient_id, 'fixture-owner');
  assert.equal(inserted.is_revoked, false);
  assert.ok(Date.parse(inserted.expires_at) >= before + 2 * 86400000);
});

const source = readFileSync(new URL('../../../supabase/functions/share/index.ts', import.meta.url), 'utf8');
const script = stripTypeScriptTypes(source.replace(/^import .*;\n/gm, ''), { mode: 'transform' });
for (const [label, row, status] of [
  ['revoked', { is_revoked: true }, 403],
  ['expired', { expires_at: '2000-01-01T00:00:00Z' }, 410],
  ['wrong token', { share_token: 'expected-token' }, 403],
] as const) test(`public share handler rejects ${label} before fetching form data`, async () => {
  let handler: any; const reads: string[] = [];
  const db = { from(table) { reads.push(table); const q = { select: () => q, eq: () => q, single: async () => ({ data: row, error: null }) }; return q; } };
  vm.runInNewContext(script, { Deno: { env: { get: () => 'fixture' }, serve: fn => handler = fn }, createClient: () => db, Request, Response, URL, console });
  const response = await handler(new Request('https://example.invalid/share/fixture?token=wrong'));
  assert.equal(response.status, status);
  assert.deepEqual(reads, ['share_events']);
});
