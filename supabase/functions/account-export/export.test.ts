import test from 'node:test';
import assert from 'node:assert/strict';
import { collectAccountExport, EXPORT_TABLES } from './export.ts';
const owner = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
function db(seed: Record<string, any[]> = {}, fail?: string, corrupt = false) {
  const queries: any[] = [];
  return { queries, from(table: string) {
    let field: string; let owners: string[]; let columns: string;
    const q = {
      select(c: string) { columns = c; return q; },
      in(f: string, o: string[]) { field = f; owners = o; return q; }, order() { return q; },
      async range(start: number, end: number) {
        queries.push({ table, field, owners, columns });
        const rows = (seed[table] || []).filter(r => corrupt || owners.includes(r[field]));
        return { data: rows.slice(start, end + 1), count: rows.length, error: table === fail ? { message: 'private database details' } : null };
      },
    }; return q;
  } };
}
test('exports only owner rows, includes every page, and follows owner patient IDs for forms/shares', async () => {
  const client = db({
    conditions: [...Array.from({ length: 501 }, (_, i) => ({ id: String(i), user_id: owner, name: 'Synthetic', secret_token: 'excluded' })), { id: 'other', user_id: other }],
    patient_profiles: [{ id: 'patient-a', user_id: owner }, { id: 'patient-b', user_id: other }],
    form_responses: [{ id: 'form-a', patient_id: 'patient-a', answers_json: { first_name: 'Synthetic' } }, { id: 'form-b', patient_id: 'patient-b' }],
    share_events: [{ id: 'share-a', patient_id: owner, share_token: 'excluded' }, { id: 'share-b', patient_id: 'patient-a' }, { id: 'share-c', patient_id: other }],
  });
  const result = await collectAccountExport(client, owner);
  assert.equal(result.counts.conditions, 501); assert.equal(result.counts.form_responses, 1); assert.equal(result.counts.share_events, 2);
  assert.doesNotMatch(JSON.stringify(result), /excluded|patient-b|form-b|share-c/);
  assert.equal(result.tables.form_responses[0].id, 'form-a');
  assert.equal(client.queries.filter(q => q.table === 'conditions').length, 3);
  assert.ok(client.queries.every(q => q.owners.includes(owner) || q.table === 'form_responses'));
  assert.ok(result.exclusions.some(s => s.includes('Original uploaded files')));
});
test('rejects errors rather than returning a partial or apparently empty export', async () => {
  await assert.rejects(collectAccountExport(db({}, 'medications'), owner), /Unable to export medications/);
});
test('defense in depth rejects foreign rows even if the database filter fails', async () => {
  await assert.rejects(collectAccountExport(db({ conditions: [{ id: 'x', user_id: other }] }, undefined, true), owner), /ownership check failed/);
});
test('no authentication, credential tables or credential columns are exported', async () => {
  await assert.rejects(collectAccountExport(db(), ''), /Authentication required/);
  assert.doesNotMatch(JSON.stringify(EXPORT_TABLES), /access_token|refresh_token|secure_token|share_token|code_verifier|password/);
});
test('zero patient profiles never results in an unfiltered form query', async () => {
  const client = db({ form_responses: [{ id: 'foreign', patient_id: 'foreign' }] });
  const result = await collectAccountExport(client, owner);
  assert.deepEqual(result.tables.form_responses, []);
  assert.equal(client.queries.some(q => q.table === 'form_responses'), false);
});
