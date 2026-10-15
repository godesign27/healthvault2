import { createRecoveryHandler, type RecoveryDeps } from './handler.ts';
const id = '11111111-1111-4111-8111-111111111111', path = `${id}/${id}`;
const assert = (value: unknown) => { if (!value) throw new Error('Assertion failed'); };
const req = () => new Request('https://test.invalid', { method: 'POST', headers: { 'x-upload-recovery-key': 'fixture' } });
function fixture() {
  let removes = 0, receipt: number[] = [];
  const deps: RecoveryDeps = {
    claim: async () => ({ state: 'run', lease: id, items: [{ id, storage_bucket: 'inbound-records', storage_path: path }] }),
    abandon: async () => ({ state: 'abandoned', storage_path: path }),
    remove: async () => { removes++; }, finish: async (_, checked, failed) => { receipt = [checked, failed]; },
  };
  return { deps, removed: () => removes, receipt: () => receipt };
}
Deno.test('anonymous/invalid scheduler credential denied before cleanup', async () => {
  const f = fixture(); f.deps.claim = async () => ({ state: 'unauthorized' });
  assert((await createRecoveryHandler(f.deps)(req())).status === 401); assert(f.removed() === 0);
});
Deno.test('committed file is never removed, including concurrent finalization', async () => {
  const f = fixture(); f.deps.abandon = async () => ({ state: 'committed' });
  assert((await createRecoveryHandler(f.deps)(req())).status === 200); assert(f.removed() === 0);
});
Deno.test('removal failure is counted and next invocation retries successfully', async () => {
  const f = fixture(); const remove = f.deps.remove;
  f.deps.remove = async () => { throw new Error('Storage unavailable'); };
  assert((await createRecoveryHandler(f.deps)(req())).status === 503); assert(f.receipt().join() === '1,1');
  f.deps.remove = remove;
  assert((await createRecoveryHandler(f.deps)(req())).status === 200); assert(f.removed() === 1); assert(f.receipt().join() === '1,0');
});
Deno.test('unknown abandon outcome does not remove bytes', async () => {
  const f = fixture(); f.deps.abandon = async () => { throw new Error('DB unavailable'); };
  assert((await createRecoveryHandler(f.deps)(req())).status === 503); assert(f.removed() === 0);
});
Deno.test('busy and disabled runs do no work', async () => {
  for (const state of ['busy', 'disabled']) {
    const f = fixture(); f.deps.claim = async () => ({ state });
    assert((await createRecoveryHandler(f.deps)(req())).status === 200); assert(f.removed() === 0); assert(f.receipt().length === 0);
  }
});
