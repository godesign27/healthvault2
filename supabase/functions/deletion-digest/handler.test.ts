import { createHandler, messageFor, type Claim, type Dependencies } from './handler.ts';
const assert = (v: unknown, message = 'Assertion failed') => { if (!v) throw new Error(message); };
const pending: Claim = { state:'send', run_key:'digest/2026-10-02', lease_token:'lease', pending_count:2, oldest_date:'2026-10-01', verification:false };
const request = (key = 'k'.repeat(72)) => new Request('https://test.invalid', {method:'POST',headers:{'x-deletion-monitor-key':key}});
function setup(claim: Claim = pending) {
  const sent: unknown[] = []; const receipts: unknown[] = [];
  const deps: Dependencies = { claim:async()=>claim, send:async(m,k)=>{sent.push({m,k});return 'mail-id';},
    finish:async(c,id,e)=>{receipts.push({id,e});} };
  return {deps,sent,receipts};
}
Deno.test('missing or invalid credential cannot claim/send', async()=>{
 const s=setup(); s.deps.claim=()=>{throw new Error('Must not call');};
 assert((await createHandler(s.deps)(request(''))).status===401); assert(s.sent.length===0);
});
Deno.test('wrong well-formed secret denied by database', async()=>{
 const s=setup({state:'unauthorized'}); assert((await createHandler(s.deps)(request())).status===401); assert(!s.sent.length);
});
Deno.test('empty, accepted, busy and outside schedule never send', async()=>{
 for(const state of ['empty','accepted','busy','outside_schedule','manual_review']) {
 const s=setup({state}); assert((await createHandler(s.deps)(request())).status===200); assert(!s.sent.length); }
});
Deno.test('pending uses stable idempotency key and only aggregate text', async()=>{
 const s=setup(); const res=await createHandler(s.deps)(request()); assert(res.status===200);
 assert(JSON.stringify(s.sent).includes('deletion-monitor/digest/2026-10-02'));
 const message=messageFor(pending); assert(message.text.includes('2 open')); assert(message.text.includes('2026-10-01'));
 assert(JSON.stringify(s.receipts)==='[{"id":"mail-id","e":null}]');
});
Deno.test('query failure is failure not empty success', async()=>{
 const s=setup(); s.deps.claim=async()=>{throw new Error('DB down');};
 assert((await createHandler(s.deps)(request())).status===503); assert(!s.sent.length); assert(!s.receipts.length);
});
Deno.test('send rejection or timeout never marks accepted', async()=>{
 const s=setup(); s.deps.send=async()=>{throw new Error('timeout');};
 assert((await createHandler(s.deps)(request())).status===503);
 assert(JSON.stringify(s.receipts)==='[{"id":null,"e":"send_failed"}]');
});
Deno.test('receipt failure returns failure; retry reuses identical key and payload', async()=>{
 const s=setup(); let failed=true; s.deps.finish=async()=>{if(failed) throw new Error('DB down');};
 const h=createHandler(s.deps); assert((await h(request())).status===503); failed=false;
 assert((await h(request())).status===200); assert(JSON.stringify(s.sent[0])===JSON.stringify(s.sent[1]));
});
Deno.test('malformed aggregate fails before send', async()=>{
 const s=setup({...pending,oldest_date:'patient-secret'});
 assert((await createHandler(s.deps)(request())).status===503); assert(!s.sent.length);
});
Deno.test('verification is clearly labeled and reports no fictitious pending requests', ()=>{
 const m=messageFor({...pending,verification:true}); assert(m.subject.includes('verification'));
 assert(m.text.includes('does not report a pending request')); assert(!m.text.includes('2 open'));
});
