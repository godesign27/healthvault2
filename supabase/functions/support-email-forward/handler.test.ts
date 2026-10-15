import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHandler, type Dependencies } from './handler.ts';
const id = '11111111-1111-4111-8111-111111111111';
function setup(overrides: Partial<Dependencies> = {}) {
  const calls: string[] = [];
  const deps: Dependencies = {
    verify: JSON.parse,
    receipt: async () => { calls.push('receipt'); return { first_attempt_at: new Date().toISOString(), forwarded_id: null }; },
    forward: async (_, key) => { calls.push(key); return '22222222-2222-4222-8222-222222222222'; },
    complete: async () => { calls.push('complete'); }, ...overrides,
  };
  return { handler: createHandler(deps), calls };
}
function request(to = ['team@healthvault.me'], type = 'email.received') {
  return new Request('https://example.test', { method: 'POST', body: JSON.stringify({ type, data: { email_id: id, to } }) });
}
test('rejects unsigned events before reading or forwarding mail', async () => {
  const {handler,calls}=setup({verify:()=>{throw Error('bad signature');}});
  assert.equal((await handler(request())).status,401); assert.deepEqual(calls,[]);
});
test('ignores other addresses, aliases, and event types', async () => {
  const {handler,calls}=setup();
  for (const to of [['other@healthvault.me'],['team@other.test'],['team+tag@healthvault.me']]) assert.equal((await handler(request(to))).status,200);
  await handler(request(['team@healthvault.me'],'email.delivered')); assert.deepEqual(calls,[]);
});
test('forwards only configured address with stable idempotency key', async () => {
  const {handler,calls}=setup(); assert.equal((await handler(request(['TEAM@healthvault.me']))).status,200);
  assert.deepEqual(calls,['receipt',`support-forward/${id}`,'complete']);
});
test('completed deliveries never resend even on later replay', async () => {
  const {handler,calls}=setup({receipt:async()=>({first_attempt_at:'2000-01-01T00:00:00Z',forwarded_id:id})});
  assert.equal((await handler(request())).status,200); assert.deepEqual(calls,[]);
});
test('ambiguous old delivery stops before API idempotency expires', async () => {
  const {handler,calls}=setup({receipt:async()=>({first_attempt_at:'2000-01-01T00:00:00Z',forwarded_id:null})});
  assert.equal((await handler(request())).status,503); assert.deepEqual(calls,[]);
});
test('failed sends return retryable error and never record completion', async () => {
  const {handler,calls}=setup({forward:async()=>{throw Error('timeout');}});
  assert.equal((await handler(request())).status,503); assert.deepEqual(calls,['receipt']);
});
test('receipt failures stop all forwarding', async () => {
  const {handler,calls}=setup({receipt:async()=>{throw Error('unavailable');}});
  assert.equal((await handler(request())).status,503); assert.deepEqual(calls,[]);
});
test('oversized requests and GET cannot send', async () => {
  const {handler,calls}=setup();
  assert.equal((await handler(new Request('https://example.test'))).status,405);
  assert.equal((await handler(new Request('https://example.test',{method:'POST',body:'x'.repeat(262145)}))).status,413);
  assert.deepEqual(calls,[]);
});
