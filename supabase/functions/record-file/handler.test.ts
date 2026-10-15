import { createFileHandler, FileAccessError, parseFileReference } from './handler.ts';
const assert=(x:unknown)=>{if(!x)throw new Error('Assertion failed');};
const id='11111111-1111-4111-8111-111111111111';
const file={userId:'user',recordId:id,bucket:'inbound-records',path:'user/fixture.pdf',type:'pdf'};
const req=(body:unknown={recordId:id},auth=true)=>new Request('https://test.invalid',{method:'POST',headers:auth?{Authorization:'Bearer synthetic'}:{},body:JSON.stringify(body)});
Deno.test('strict storage references accept own origin and internal locators; reject host and path tricks',()=>{
 const base='https://example.supabase.co';
 assert(parseFileReference('hv-storage://inbound-records/user%2Ffile.pdf',base).path==='user/file.pdf');
 assert(parseFileReference(base+'/storage/v1/object/sign/inbound-records/user/file.pdf?token=old',base).bucket==='inbound-records');
 for(const bad of ['https://evil.test/storage/v1/object/sign/inbound-records/user/file.pdf','hv-storage://public/user/file','hv-storage://inbound-records/user%2F..%2Fsecret','hv-storage://inbound-records/user%5Csecret',base+'/storage/v1/object/public/inbound-records/user/file.pdf']){
  let denied=false;try{parseFileReference(bad,base);}catch{denied=true;}assert(denied);
 }
});
Deno.test('anonymous and invalid requests cannot download',async()=>{
 let calls=0;const h=createFileHandler({authorize:async()=>{calls++;return file;},download:async()=>new Uint8Array()});
 assert((await h(req({},false))).status===401);assert((await h(req({recordId:'bad'}))).status===400);assert(calls===0);
});
Deno.test('all successes and errors prohibit caches; no redirect or storage URL',async()=>{
 const h=createFileHandler({authorize:async()=>file,download:async()=>new Uint8Array([1,2,3])});
 for(const r of [await h(req()),await h(req({},false))]){assert(r.headers.get('cache-control')?.includes('no-store'));assert(r.headers.get('cdn-cache-control')==='no-store');assert(!r.headers.has('location'));}
});
Deno.test('block during download denies bytes on recheck',async()=>{
 let calls=0;const h=createFileHandler({authorize:async()=>{if(++calls>1)throw new FileAccessError(403,'Blocked');return file;},download:async()=>new Uint8Array([1])});
 assert((await h(req())).status===403);
});
Deno.test('unlink/replacement during download denies bytes on recheck',async()=>{
 let calls=0;const h=createFileHandler({authorize:async()=>({...file,path:++calls>1?'user/replacement.pdf':file.path}),download:async()=>new Uint8Array([1])});
 assert((await h(req())).status===403);
});
Deno.test('foreign ownership and infrastructure errors fail closed',async()=>{
 for(const error of [new FileAccessError(404,'Not found'),new Error('DB down')]){
 let downloaded=false;const h=createFileHandler({authorize:async()=>{throw error;},download:async()=>{downloaded=true;return new Uint8Array();}});
 assert((await h(req())).status===(error instanceof FileAccessError?404:503));assert(!downloaded);
 }
});
