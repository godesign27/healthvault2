import { uploadRetryKey } from '../src/lib/records/upload-retry.ts';
const assert = (value: unknown) => { if (!value) throw Error('Assertion failed'); };
const bytes = (value: string) => new TextEncoder().encode(value).buffer;
function storage(values = new Map<string,string>()) {
  return {getItem: (key:string) => values.get(key) ?? null, setItem: (key:string,value:string) => {values.set(key,value);}};
}
Deno.test('same upload recovers its key after a new storage wrapper', async () => {
  const values = new Map<string,string>();
  const first = await uploadRetryKey('owner', bytes('private document'), ['private.txt','OTHER'], storage(values));
  assert(first === await uploadRetryKey('owner', bytes('private document'), ['private.txt','OTHER'], storage(values)));
  assert(!JSON.stringify([...values]).includes('private'));
});
Deno.test('owner, bytes and metadata distinguish upload operations', async () => {
  const saved = storage();
  const keys = await Promise.all([
    uploadRetryKey('one', bytes('a'), ['a.txt'], saved),
    uploadRetryKey('two', bytes('a'), ['a.txt'], saved),
    uploadRetryKey('one', bytes('b'), ['a.txt'], saved),
    uploadRetryKey('one', bytes('a'), ['b.txt'], saved),
  ]);
  assert(new Set(keys).size === 4);
});
Deno.test('unavailable or silently dropped storage fails before returning a key', async () => {
  for (const saved of [
    {getItem:()=>null,setItem:()=>{throw Error('Storage denied');}},
    {getItem:()=>null,setItem:()=>{}},
  ]) {
    let rejected=false;
    try { await uploadRetryKey('owner',bytes('a'),[],saved); } catch { rejected=true; }
    assert(rejected);
  }
});
