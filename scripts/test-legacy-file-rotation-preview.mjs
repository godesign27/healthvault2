// Preview-only protected download acceptance. Creates/cleans only synthetic data.
import { readFileSync, statSync } from 'node:fs';
import { randomUUID, randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
const project='roeudwddxvniazwufdqf',base=`https://${project}.supabase.co`;
const keyFile=process.env.HV_PREVIEW_KEYS_FILE;assert(keyFile);assert.equal(statSync(keyFile).mode&0o077,0);
const keys=JSON.parse(readFileSync(keyFile,'utf8'));
const admin=keys.find(k=>k.name==='service_role')?.api_key,anon=keys.find(k=>k.name==='anon')?.api_key;
for(const key of [admin,anon])assert.equal(JSON.parse(Buffer.from(key.split('.')[1],'base64url')).ref,project);
const run=randomUUID(),users=[],rows=[],files=[];let checks=0;
const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j3ioAAAAASUVORK5CYII=','base64');
async function req(path,{token=admin,method='GET',body,raw=false}={}){
 const r=await fetch(base+path,{method,headers:{apikey:anon,Authorization:`Bearer ${token}`,'Content-Type':raw?'image/png':'application/json',Prefer:'return=representation'},...(body===undefined?{}:{body:raw?body:JSON.stringify(body)}),signal:AbortSignal.timeout(30000)});
 const buffer=Buffer.from(await r.arrayBuffer());let data;try{data=JSON.parse(buffer.toString());}catch{data=null;}
 return {status:r.status,data,buffer,cache:r.headers.get('cache-control'),cdn:r.headers.get('cdn-cache-control'),location:r.headers.get('location')};
}
function ok(r,label,status=200){assert.equal(r.status,status,`${label}: HTTP ${r.status}, code ${r.data?.code||'none'}`);}
function pass(label){checks++;console.log(`PASS ${label}`);}
async function seed(table,body,user){body.id ||=randomUUID();rows.push({table,id:body.id,user});const r=await req(`/rest/v1/${table}`,{method:'POST',body});ok(r,`seed ${table}`,201);return body;}
const download=(u,id)=>req('/functions/v1/record-file',{token:u.token,method:'POST',body:{recordId:id}});
const setRef=(id,ref)=>req(`/rest/v1/health_records?id=eq.${id}`,{method:'PATCH',body:{preview_url:ref}});
let retired=false,purgeStatus=null;
try{
 for(const label of ['A','B']){
  const email=`hv-rotation-${run}-${label}@example.invalid`,password=randomBytes(32).toString('base64url');
  const c=await req('/auth/v1/admin/users',{method:'POST',body:{email,password,email_confirm:true,app_metadata:{account_control_test:run}}});ok(c,'create Auth');const u={id:c.data.id};users.push(u);
  const s=await req('/auth/v1/token?grant_type=password',{token:anon,method:'POST',body:{email,password}});ok(s,'sign in');u.token=s.data.access_token;
  u.path=`${u.id}/${run}-original.png`;files.push({bucket:'medical-form-uploads',path:u.path});
  ok(await req(`/storage/v1/object/medical-form-uploads/${u.path}`,{method:'POST',raw:true,body:bytes}),'upload');
  const signed=await req(`/storage/v1/object/sign/medical-form-uploads/${u.path}`,{method:'POST',body:{expiresIn:3600}});ok(signed,'sign');
  u.url=base+'/storage/v1'+signed.data.signedURL;
  u.record=await seed('health_records',{user_id:u.id,kind:'other',title:'Synthetic rotation file',file_type:'png',preview_url:u.url},u.id);
 }
 async function probe(u){const r=await fetch(u.url,{signal:AbortSignal.timeout(30000)});const b=Buffer.from(await r.arrayBuffer());return {status:r.status,bytes:b,cache:r.headers.get('cf-cache-status')};}
 const [a,b]=users;
 for(const u of users){for(let i=0;i<2;i++){const p=await probe(u);assert.equal(p.status,200);assert.deepEqual(p.bytes,bytes);}}
 pass('legacy links warmed for both disposable owners');
 const newPath=`${a.id}/${randomUUID()}.png`;files.push({bucket:'medical-form-uploads',path:newPath});
 ok(await req(`/storage/v1/object/medical-form-uploads/${newPath}`,{method:'POST',raw:true,body:bytes}),'upload replacement');
 const replacement=await req(`/storage/v1/object/authenticated/medical-form-uploads/${newPath}`);ok(replacement,'verify replacement');assert.deepEqual(replacement.buffer,bytes);
 const switched=await req(`/rest/v1/health_records?id=eq.${a.record.id}&preview_url=eq.${encodeURIComponent(a.url)}`,{method:'PATCH',body:{preview_url:`hv-storage://medical-form-uploads/${encodeURIComponent(newPath)}`}});ok(switched,'conditional pointer replacement');assert.equal(switched.data.length,1);
 const d=await download(a,a.record.id);ok(d,'protected replacement');assert.deepEqual(d.buffer,bytes);assert(d.cache.includes('no-store'));
 pass('replacement bytes verified before conditional reference update; protected download verified before original deletion');
 ok(await req('/storage/v1/object/medical-form-uploads',{method:'DELETE',body:{prefixes:[a.path]}}),'remove synthetic original');
 const purge=await req(`/storage/v1/cdn/medical-form-uploads/${a.path}`,{method:'DELETE',body:{}});purgeStatus=purge.status;
 console.log(JSON.stringify({step:'exact-object CDN purge',status:purgeStatus,code:purge.data?.code||purge.data?.error||null}));
 const started=Date.now();
 for(let i=0;i<10;i++){
  const p=await probe(a);console.log(JSON.stringify({step:'old link probe',elapsedSeconds:Math.round((Date.now()-started)/1000),status:p.status,cache:p.cache}));
  if([400,404,410].includes(p.status)){retired=true;break;}
  assert.equal(p.status,200,'unexpected old link response');
  if(i<9)await new Promise(r=>setTimeout(r,10000));
 }
 const current=await download(a,a.record.id);ok(current,'new link survives retirement');assert.deepEqual(current.buffer,bytes);
 const other=await probe(b);assert.equal(other.status,200);assert.deepEqual(other.bytes,bytes);
 pass('replacement remains accessible and other owner remains unchanged');
}finally{
 const failures=[];
 for(const f of files){try{ok(await req(`/storage/v1/object/${f.bucket}`,{method:'DELETE',body:{prefixes:[f.path]}}),'cleanup file');}catch{failures.push('file');}}
 for(const r of [...rows].reverse()){try{ok(await req(`/rest/v1/${r.table}?id=eq.${r.id}`,{method:'DELETE'}),'cleanup row');}catch{failures.push(r.table);}}
 for(const u of users){try{
  if(u.token)await req('/auth/v1/logout?scope=global',{token:u.token,method:'POST'});
  const current=await req(`/auth/v1/admin/users/${u.id}`);ok(current,'verify fixture');assert.equal(current.data.app_metadata.account_control_test,run);
  ok(await req(`/auth/v1/admin/users/${u.id}`,{method:'DELETE'}),'cleanup Auth');
  ok(await req(`/rest/v1/account_erasure_blocks?user_id=eq.${u.id}`,{method:'DELETE'}),'cleanup block');
 }catch{failures.push('Auth');}}
 assert.deepEqual(failures,[],'Synthetic cleanup failed');pass('all synthetic accounts/files/rows cleaned');
}
console.log(JSON.stringify({result:retired?'PASS_OBSERVED_LOCATION':'LEGACY_CACHE_GATE_OPEN',purgeStatus,checks,scope:'Synthetic medical-form-uploads files only; no global cache or downloaded-copy revocation claim'}));
if(!retired)process.exitCode=2;
