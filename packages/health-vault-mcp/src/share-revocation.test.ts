import test from 'node:test';
import assert from 'node:assert/strict';
import { revokeHealthShare } from './health-sharing.ts';

function client(result) {
  const filters = [];
  const chain = {
    update: () => chain,
    eq: (field, value) => { filters.push([field,value]); return chain; },
    select: () => chain,
    maybeSingle: async () => result,
  };
  return { supabase: { from: () => chain } as any, filters };
}
test('inaccessible, missing, or revoked share has a non-disclosing error', async () => {
  const c = client({ data: null, error: null });
  await assert.rejects(revokeHealthShare(c.supabase,'fixture'), /not found, is already revoked, or is unavailable/);
  assert.deepEqual(c.filters, [['id','fixture'],['is_revoked',false]]);
});
test('confirmed revocation returns the server result', async () => {
  const data = { id: 'fixture', status: 'revoked', revoked_at: '2026-10-02T00:00:00Z' };
  assert.deepEqual(await revokeHealthShare(client({data,error:null}).supabase,'fixture'), data);
});
test('backend errors never claim a successful revocation', async () => {
  await assert.rejects(revokeHealthShare(client({ data:null,error:{message:'unavailable'} }).supabase,'fixture'), /Unable to revoke/);
});
