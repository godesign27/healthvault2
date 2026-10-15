import { readJsonObject, RequestBodyError } from './body.ts';
const assert = (v: unknown) => { if (!v) throw new Error('Assertion failed'); };
const encoder = new TextEncoder();
function request(parts: string[], headers: Record<string,string> = {}) {
  let canceled = false;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) { const part = parts.shift(); if (part === undefined) controller.close(); else controller.enqueue(encoder.encode(part)); },
    cancel() { canceled = true; },
  });
  return { req: new Request('https://fixture.invalid', { method: 'POST', body, headers }), canceled: () => canceled };
}
async function rejects(req: Request, limit: number, status: number, timeout = 30000) {
  try { await readJsonObject(req, limit, timeout); } catch(e) { assert(e instanceof RequestBodyError && e.status === status); return; }
  throw new Error('Expected rejection');
}
Deno.test('accepts JSON exactly at byte limit including split unicode', async () => {
  const bytes=encoder.encode('{"value":"é"}');
  const body=new ReadableStream<Uint8Array>({ start(c){ for(const b of bytes)c.enqueue(new Uint8Array([b]));c.close(); } });
  const result=await readJsonObject(new Request('https://fixture.invalid',{method:'POST',body}),bytes.length);
  assert(result.value === 'é');
});
Deno.test('rejects declared oversize without parsing its contents', async () => {
  const f=request(['not json'],{'content-length':'1000'});await rejects(f.req,10,413);assert(!f.canceled());await f.req.body?.cancel();
});
Deno.test('enforces actual bytes with absent or dishonest length while draining rejected input', async () => {
  for(const headers of [{},{'content-length':'2'}] as Record<string,string>[]){
    const f=request(['{"x":"','0123456789','more','"}'], headers);
    await rejects(f.req,10,413);assert(!f.canceled());
  }
});
Deno.test('rejects malformed JSON, non-object roots and invalid UTF8', async () => {
  for(const value of ['','{','null','[]','42'])await rejects(request([value]).req,100,400);
  await rejects(new Request('https://fixture.invalid',{method:'POST',body:new Uint8Array([255])}),100,400);
});
Deno.test('slow sender times out and is canceled', async () => {
  let canceled=false;
  const body=new ReadableStream<Uint8Array>({cancel(){canceled=true;}});
  await rejects(new Request('https://fixture.invalid',{method:'POST',body}),100,408,5);assert(canceled);
});

Deno.test('oversized endless sender still hits the absolute deadline', async () => {
  let canceled=false, sent=false;
  const body=new ReadableStream<Uint8Array>({pull(c){if(!sent){sent=true;c.enqueue(new Uint8Array(101));}},cancel(){canceled=true;}});
  await rejects(new Request('https://fixture.invalid',{method:'POST',body}),100,408,5);assert(canceled);
});
