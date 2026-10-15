import { uploadNeedsReview } from '../src/lib/records/upload-result.ts';
const assert = (v: unknown) => { if (!v) throw new Error('Assertion failed'); };
Deno.test('missing receipts and server/proxy timeouts block immediate retry', () => {
  for (const status of [200,207,408,409,500,502,504]) {
    assert(uploadNeedsReview(status, {}));
    assert(uploadNeedsReview(status, {error:'Unknown result'}));
  }
});
Deno.test('known pre-save rejection leaves selection editable', () => {
  assert(!uploadNeedsReview(408,{code:'request_body_rejected',error:'Read timeout'}));
  assert(!uploadNeedsReview(413,{error:'Too large'}));
  assert(!uploadNeedsReview(403,{error:'Invalid token'}));
});
Deno.test('partial receipt permits remaining-file retry only when outcome is settled', () => {
  const receipt={success:false,saved:[{index:0,id:'fixture'}],fileErrors:[{index:1,code:'invalid_file'}],completionPending:false};
  assert(!uploadNeedsReview(207,receipt));
  assert(uploadNeedsReview(207,{...receipt,completionPending:true}));
  assert(uploadNeedsReview(207,{...receipt,fileErrors:[{index:1,code:'reconciliation_required'}]}));
});
