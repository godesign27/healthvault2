import {HealthVaultClient,HealthVaultImportClient,ImportRequestError} from '/tmp/hv-client/client.mjs';
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
async function req(path,{token=admin,method='GET',body,raw=false,timeoutMs=30000,retryKey=randomUUID()}={}){
 const r=await fetch(base+path,{method,headers:{apikey:anon,Authorization:`Bearer ${token}`,'Content-Type':raw?'image/png':'application/json',...(retryKey?{'Idempotency-Key':retryKey}:{}),Prefer:'return=representation'},...(body===undefined?{}:{body:raw?body:JSON.stringify(body)}),signal:AbortSignal.timeout(timeoutMs)});
 const buffer=Buffer.from(await r.arrayBuffer());let data;try{data=JSON.parse(buffer.toString());}catch{data=null;}
 return {status:r.status,data,buffer,cache:r.headers.get('cache-control'),cdn:r.headers.get('cdn-cache-control'),location:r.headers.get('location')};
}
function ok(r,label,status=200){assert.equal(r.status,status,`${label}: HTTP ${r.status}, code ${r.data?.code||'none'}`);}
function pass(label){checks++;console.log(`PASS ${label}`);}
async function seed(table,body,user){body.id ||=randomUUID();rows.push({table,id:body.id,user});const r=await req(`/rest/v1/${table}`,{method:'POST',body});ok(r,`seed ${table}`,201);return body;}
const download=(u,id)=>req('/functions/v1/record-file',{token:u.token,method:'POST',body:{recordId:id}});
const setRef=(id,ref)=>req(`/rest/v1/health_records?id=eq.${id}`,{method:'PATCH',body:{preview_url:ref}});
try{
 for(const label of ['A','B']){
  const email=`hv-inbound-${run}-${label}@example.invalid`,password=randomBytes(32).toString('base64url');
  const c=await req('/auth/v1/admin/users',{method:'POST',body:{email,password,email_confirm:true,app_metadata:{account_control_test:run}}});ok(c,'create Auth');const u={id:c.data.id};users.push(u);
  const s=await req('/auth/v1/token?grant_type=password',{token:anon,method:'POST',body:{email,password}});ok(s,'sign in');u.token=s.data.access_token;
 }
 const [a,b]=users;
 const client=u=>new HealthVaultClient({supabaseUrl:base,supabaseAnonKey:anon,getAccessToken:async()=>u.token});
 const params={file:new Blob([bytes],{type:'image/png'}),fileName:'fixture.png',kind:'other',idempotencyKey:randomUUID()};
 const personal=await client(a).uploadRecord(params);
 const replay=await client(a).uploadRecord(params);assert.equal(replay.recordId,personal.recordId);assert.equal(replay.importBatchId,personal.importBatchId);
 const stored=(await req(`/rest/v1/health_records?id=eq.${personal.recordId}&select=source,user_id,file_size_bytes,preview_url`)).data[0];
 assert.equal(stored.source,'uploaded');assert.equal(stored.user_id,a.id);assert.equal(stored.file_size_bytes,bytes.length);assert.equal(personal.previewUrl,null);
 const downloaded=await download(a,personal.recordId);ok(downloaded,'protected personal file');assert.deepEqual(downloaded.buffer,bytes);
 await assert.rejects(client(a).uploadRecord({...params,title:'Changed'}),e=>e instanceof ImportRequestError&&e.status===409);
 pass('real shared client uploads owned file, recovers receipt, labels source uploaded and uses protected delivery');
 const raw={patientId:b.id,records:[{kind:'other',title:'Foreign attempt',base64:bytes.toString('base64'),fileType:'png'}]};
 ok(await req('/functions/v1/inbound-records/upload',{token:a.token,method:'POST',body:raw}),'foreign personal upload',403);
 for(const token of [anon,'not-a-jwt'])ok(await req('/functions/v1/inbound-records/upload',{token,method:'POST',body:raw}),'unauthorized personal upload',401);
 const key=await req('/functions/v1/inbound-records/keys',{token:a.token,method:'POST',body:{name:'Client test',organizationName:'Synthetic integration'}});ok(key,'integration key',201);rows.push({table:'inbound_api_keys',id:key.data.id});
 ok(await req('/functions/v1/inbound-records/upload',{token:key.data.key,method:'POST',body:raw}),'API key cannot impersonate app session',401);
 pass('personal route denies anonymous/forged JWT, foreign Vault and integration-key substitution');
 const integration=new HealthVaultImportClient({supabaseUrl:base,supabaseAnonKey:anon,getApiKey:async()=>key.data.key});
 const batch={patientId:a.id,records:[{title:'Integration record',kind:'other',base64:bytes.toString('base64'),fileType:'png'}]},retryKey=randomUUID();
 const imported=await integration.importRecords(batch,retryKey),again=await integration.importRecords(batch,retryKey);
 assert.equal(imported.success,true);assert.equal(again.records[0].id,imported.records[0].id);
 assert.equal((await req(`/rest/v1/health_records?id=eq.${imported.records[0].id}&select=source`)).data[0].source,'connected');
 const partial=await integration.importRecords({patientId:a.id,records:[{...batch.records[0],base64:'invalid'}]},randomUUID());assert.equal(partial.success,false);assert.equal(partial.failed,1);
 pass('real integration client imports/replays with connected provenance and preserves failed-item receipt');
 const deletion=await seed('account_deletion_requests',{user_id:a.id,confirmed:true,status:'reviewing'},a.id);
 ok(await req('/rest/v1/rpc/operator_block_reviewed_account',{method:'POST',body:{p_user_id:a.id,p_request_id:deletion.id}}),'block account',204);
 await assert.rejects(client(a).uploadRecord(params),e=>e.status===403);
 const other=await client(b).uploadRecord({...params,idempotencyKey:randomUUID()});assert.notEqual(other.recordId,personal.recordId);
 pass('blocked session cannot replay or upload; second owner remains functional');
}finally{
 const failures=[];
 for(const u of users){
  const journal=await req(`/rest/v1/inbound_upload_attempts?user_id=eq.${u.id}&select=id,storage_path`);
  if(journal.status!==200)failures.push('journal inventory');
  else for(const a of journal.data){
   if(!rows.some(x=>x.table==='inbound_upload_attempts'&&x.id===a.id))rows.push({table:'inbound_upload_attempts',id:a.id});
   if(a.storage_path&&!files.some(x=>x.path===a.storage_path))files.push({bucket:'inbound-records',path:a.storage_path});
  }
  const found=await req(`/rest/v1/health_records?user_id=eq.${u.id}&select=id,preview_url`);
  if(found.status!==200){failures.push('fixture inventory');continue;}
  for(const r of found.data){
   if(!rows.some(x=>x.table==='health_records'&&x.id===r.id))rows.push({table:'health_records',id:r.id});
   if(r.preview_url?.startsWith('hv-storage://inbound-records/')){
    const path=decodeURIComponent(r.preview_url.slice('hv-storage://inbound-records/'.length));
    if(!files.some(x=>x.path===path))files.push({bucket:'inbound-records',path});
   }
  }
 }

 for(const f of files){try{ok(await req(`/storage/v1/object/${f.bucket}`,{method:'DELETE',body:{prefixes:[f.path]}}),'cleanup file');}catch{failures.push('file');}}
 for(const r of [...rows].reverse()){try{ok(await req(`/rest/v1/${r.table}?id=eq.${r.id}`,{method:'DELETE'}),'cleanup row');}catch{failures.push(r.table);}}
 for(const u of users){try{
  ok(await req(`/rest/v1/inbound_import_batches?user_id=eq.${u.id}`,{method:'DELETE'}),'cleanup batches');
  if(u.token)await req('/auth/v1/logout?scope=global',{token:u.token,method:'POST'});
  const current=await req(`/auth/v1/admin/users/${u.id}`);ok(current,'verify fixture');assert.equal(current.data.app_metadata.account_control_test,run);
  ok(await req(`/auth/v1/admin/users/${u.id}`,{method:'DELETE'}),'cleanup Auth');
  ok(await req(`/rest/v1/account_erasure_blocks?user_id=eq.${u.id}`,{method:'DELETE'}),'cleanup block');
 }catch{failures.push('Auth');}}
 assert.deepEqual(failures,[],'Synthetic cleanup failed');pass('all synthetic accounts/files/rows cleaned');
}
console.log(JSON.stringify({result:'PASS',checks,scope:'Real shared clients against preview only'}));
