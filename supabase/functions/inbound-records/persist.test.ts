import { persistImport, type ImportStore } from './persist.ts';
const user = '11111111-1111-4111-8111-111111111111';
const record = { title: 'Synthetic', kind: 'other' };
const saved = { id: 'fixture', ...record };
const assert = (condition: unknown) => { if (!condition) throw new Error('Assertion failed'); };
function fixture(fail: string | null = null, committed = false) {
  const calls: string[] = [];
  const step = async (name: string) => { calls.push(name); if (fail === name) throw new Error('Injected failure'); };
  const store: ImportStore = {
    authorize: () => step('authorize'), prepare: () => step('prepare'), upload: () => step('upload'),
    finalize: async () => { await step('finalize'); return saved; },
    abandon: async () => { await step('abandon'); return committed
      ? { state: 'committed', record: saved } : { state: 'abandoned', storage_path: `${user}/fixture` }; },
    remove: () => step('remove'),
  };
  return { store, calls };
}
Deno.test('invalid/empty base64 causes no storage or database mutation', async () => {
  for (const input of ['', 'not base64', 42, 'YQ=']) {
    const f = fixture(); const r = await persistImport(f.store, user, record, input, 'image/png');
    assert('error' in r && r.error === 'invalid_file'); assert(f.calls.length === 0);
  }
});
Deno.test('journal precedes upload and successful receipt follows commit only', async () => {
  const f = fixture(); const r = await persistImport(f.store, user, record, 'YQ==', 'image/png');
  assert('saved' in r); assert(f.calls.join() === 'authorize,prepare,upload,finalize');
});
Deno.test('failed journal prevents upload', async () => {
  const f = fixture('prepare'); const r = await persistImport(f.store, user, record, 'YQ==', 'image/png');
  assert('error' in r); assert(f.calls.join() === 'authorize,prepare');
});
Deno.test('upload and metadata failure abandon then remove; never report a saved record', async () => {
  for (const failure of ['upload', 'finalize']) {
    const f = fixture(failure); const r = await persistImport(f.store, user, record, 'YQ==', 'image/png');
    assert('error' in r && r.error === 'save_failed'); assert(f.calls.slice(-2).join() === 'abandon,remove');
    if (failure === 'upload') assert(!f.calls.includes('finalize'));
  }
});
Deno.test('lost commit response recovers receipt without deleting the saved file', async () => {
  const f = fixture('finalize', true); const r = await persistImport(f.store, user, record, 'YQ==', 'image/png');
  assert('saved' in r); assert(!f.calls.includes('remove'));
});
Deno.test('uncertain commit and cleanup failure explicitly require reconciliation', async () => {
  for (const failure of ['abandon', 'remove']) {
    const f = fixture(failure); f.store.finalize = async () => { throw new Error('Ambiguous response'); };
    const r = await persistImport(f.store, user, record, 'YQ==', 'image/png');
    assert('error' in r && r.error === 'reconciliation_required' && r.attemptId);
    if (failure === 'abandon') assert(!f.calls.includes('remove'));
  }
});

Deno.test('multi-megabyte valid base64 stays within supported validation limits', async () => {
  const f = fixture();
  const r = await persistImport(f.store, user, record, btoa('a'.repeat(2 * 1024 * 1024)), 'application/pdf');
  assert('saved' in r);
});
Deno.test('replayed committed reservation returns receipt without upload or compensation', async () => {
 const f=fixture(); f.store.prepare=async()=>({state:'committed',record:saved});
 const r=await persistImport(f.store,user,record,'YQ==','image/png');
 assert('saved' in r && r.saved.id===saved.id);assert(f.calls.join()==='authorize');
});
Deno.test('concurrent prepared reservation cannot upload, finalize or abandon another worker', async () => {
 const f=fixture();f.store.prepare=async()=>({state:'busy',attemptId:'existing'});
 const r=await persistImport(f.store,user,record,'YQ==','image/png');
 assert('error' in r && r.error==='reconciliation_required' && r.attemptId==='existing');
 assert(f.calls.join()==='authorize');
});
