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
 const oversizedKey=await req('/functions/v1/inbound-records/keys',{token:a.token,method:'POST',body:{name:'x'.repeat(65536)}});
 ok(oversizedKey,'oversized key metadata',413);assert.equal(oversizedKey.data.code,'request_body_rejected');
 pass('key metadata body is bounded before mutation');

 const forged=Buffer.from(JSON.stringify({alg:'none',typ:'JWT'})).toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:a.id,role:'authenticated',exp:4000000000})).toString('base64url')+'.forged';
 for(const method of ['GET','POST','DELETE']){
  const suffix=method==='DELETE'?'/'+randomUUID():'';
  ok(await req('/functions/v1/inbound-records/keys'+suffix,{token:forged,method,...(method==='POST'?{body:{name:'must not exist'}}:{})}),'forged management',401);
 }
 pass('forged JWT denied on all key-management routes');
 const k=await req('/functions/v1/inbound-records/keys',{token:a.token,method:'POST',body:{name:'Synthetic integration',organizationName:'Synthetic provider'}});ok(k,'create key',201);
 rows.push({table:'inbound_api_keys',id:k.data.id});a.key=k.data.key;
 if(process.env.HV_TEST_LARGE_BODY === '1') {
  const rejected=await req('/functions/v1/inbound-records',{token:a.key,method:'POST',timeoutMs:120000,body:{patientId:a.id,records:[],padding:'x'.repeat(42*1024*1024)}});
  ok(rejected,'oversized authenticated import',413);assert.equal(rejected.data.code,'request_body_rejected');
  const attempts=await req(`/rest/v1/inbound_upload_attempts?user_id=eq.${a.id}&select=id`);ok(attempts,'no attempts');assert.equal(attempts.data.length,0);
  pass('authenticated 42 MiB import rejected with application receipt and zero upload attempts');
 }

 const other=await req('/functions/v1/inbound-records/keys',{token:b.token});ok(other,'foreign key listing');assert.equal(other.data.keys.length,0);
 const payload=(patientId)=>({patientId,records:[{title:'Synthetic inbound fixture',kind:'other',fileType:'png',base64:bytes.toString('base64'),fileName:'fixture.png'}]});
 ok(await req('/functions/v1/inbound-records',{token:a.key,method:'POST',body:payload(b.id)}),'cross patient import',403);
 pass('verified key creation works; foreign key listing and cross-patient import isolated');
 const retryKey=randomUUID();
 ok(await req('/functions/v1/inbound-records',{token:a.key,method:'POST',body:payload(a.id),retryKey:null}),'missing retry key',400);
 const imported=await req('/functions/v1/inbound-records',{token:a.key,method:'POST',body:payload(a.id),retryKey});ok(imported,'own import');assert.equal(imported.data.received,1);
 const id=imported.data.records[0].id;rows.push({table:'health_records',id});
 const saved=await req(`/rest/v1/health_records?id=eq.${id}&select=preview_url`);ok(saved,'stored locator');assert(saved.data[0].preview_url.startsWith('hv-storage://inbound-records/'));
 const path=decodeURIComponent(saved.data[0].preview_url.slice('hv-storage://inbound-records/'.length));files.push({bucket:'inbound-records',path});
 const file=await download(a,id);ok(file,'protected imported file');assert.deepEqual(file.buffer,bytes);
 pass('actual inbound upload stores internal locator and protected endpoint returns exact bytes');
 const replay=await req('/functions/v1/inbound-records',{token:a.key,method:'POST',body:payload(a.id),retryKey});ok(replay,'same batch replay');assert.equal(replay.data.records[0].id,id);assert.equal(replay.data.importBatchId,imported.data.importBatchId);
 const changed=payload(a.id);changed.records[0].title='Changed payload';
 const conflict=await req('/functions/v1/inbound-records',{token:a.key,method:'POST',body:changed,retryKey});ok(conflict,'retry key conflict',409);assert.equal(conflict.data.code,'idempotency_conflict');
 assert.equal((await req(`/rest/v1/health_records?user_id=eq.${a.id}&select=id`)).data.length,1);
 pass('lost-response retry recovers same batch/record; changed payload conflicts before writes; missing key rejected');
 const original=payload(a.id).records[0];
 const partialKey=randomUUID(); const partialBody={patientId:a.id,records:[original,{...original,base64:'invalid'},{...original,kind:'invalid_kind'}]};
 const partial=await req('/functions/v1/inbound-records',{token:a.key,method:'POST',body:partialBody,retryKey:partialKey});
 ok(partial,'mixed batch',207);assert.equal(partial.data.success,false);assert.equal(partial.data.received,1);assert.equal(partial.data.failed,2);
 assert.deepEqual(partial.data.recordErrors.map(x=>[x.index,x.code]),[[1,'invalid_file'],[2,'save_failed']]);
 const attempts=await req(`/rest/v1/inbound_upload_attempts?user_id=eq.${a.id}&select=id,state,storage_path`);ok(attempts,'journal');
 assert.equal(attempts.data.filter(x=>x.state==='committed').length,2);
 assert.equal(attempts.data.filter(x=>x.state==='abandoned').length,1);
 const listing=await req('/storage/v1/object/list/inbound-records',{method:'POST',body:{prefix:a.id,limit:100}});ok(listing,'object count');assert.equal(listing.data.length,2);
 const partialReplay=await req('/functions/v1/inbound-records',{token:a.key,method:'POST',body:partialBody,retryKey:partialKey});ok(partialReplay,'partial retry',207);assert.equal(partialReplay.data.records[0].id,partial.data.records[0].id);
 assert.equal((await req(`/rest/v1/health_records?user_id=eq.${a.id}&select=id`)).data.length,2);
 pass('mixed batch retry preserves successful IDs and exact failures without duplicate records');
 for(const token of [anon,a.token]){
  const denied=await req('/rest/v1/inbound_upload_attempts',{token});assert([401,403].includes(denied.status));
  const rpc=await req('/rest/v1/rpc/finalize_inbound_upload',{token,method:'POST',body:{p_attempt_id:id,p_record:{}}});assert([401,403].includes(rpc.status));
 }
 const receipt=await req('/rest/v1/rpc/abandon_inbound_upload',{method:'POST',body:{p_attempt_id:id}});ok(receipt,'recover committed receipt');assert.equal(receipt.data.state,'committed');assert.equal(receipt.data.record.id,id);
 const again=await download(a,id);ok(again,'saved bytes retained');assert.deepEqual(again.buffer,bytes);
 pass('private journal/RPCs deny app roles; ambiguous-success recovery preserves committed file');
 const fhirKey=randomUUID();const fhirBody={patientId:a.id,resourceType:'Bundle',entry:[{resource:{resourceType:'DiagnosticReport',id:'synthetic-fhir',code:{text:'Synthetic lab'},effectiveDateTime:'2026-10-02'}}]};
 const fhir=await req('/functions/v1/inbound-records',{token:a.key,method:'POST',body:fhirBody,retryKey:fhirKey});ok(fhir,'fileless FHIR');
 const fhirReplay=await req('/functions/v1/inbound-records',{token:a.key,method:'POST',body:fhirBody,retryKey:fhirKey});ok(fhirReplay,'fileless FHIR replay');assert.equal(fhirReplay.data.records[0].id,fhir.data.records[0].id);
 const bKey=await req('/functions/v1/inbound-records/keys',{token:b.token,method:'POST',body:{name:'Synthetic B',organizationName:'Synthetic provider'}});ok(bKey,'B key',201);rows.push({table:'inbound_api_keys',id:bKey.data.id});
 const foreign=await req('/functions/v1/inbound-records',{token:bKey.data.key,method:'POST',body:payload(b.id),retryKey});ok(foreign,'same key different owner');assert.notEqual(foreign.data.records[0].id,id);assert.notEqual(foreign.data.importBatchId,imported.data.importBatchId);
 pass('fileless FHIR retries reuse receipts; identical retry key on another owner is isolated');
 const batch=await req('/rest/v1/rpc/reserve_inbound_batch',{method:'POST',body:{p_user_id:a.id,p_key_hash:'a'.repeat(64),p_payload_hash:'b'.repeat(64),p_count:1}});ok(batch,'reserve race batch');
 const reserve=(attempt,token=admin)=>req('/rest/v1/rpc/reserve_inbound_record',{token,method:'POST',body:{p_batch_id:batch.data.id,p_index:0,p_attempt_id:attempt,p_has_file:false}});
 for(const token of [anon,a.token])assert([401,403,404].includes((await reserve(randomUUID(),token)).status));
 const raceIds=[randomUUID(),randomUUID()];const race=await Promise.all(raceIds.map(id=>reserve(id)));race.forEach(r=>ok(r,'race reservation'));assert.deepEqual(race.map(r=>r.data.state).sort(),['busy','prepared']);
 const winner=raceIds[race.findIndex(r=>r.data.state==='prepared')];
 ok(await req('/rest/v1/rpc/abandon_inbound_upload',{method:'POST',body:{p_attempt_id:winner}}),'abandon old slot');
 const replacement=randomUUID();const fresh=await reserve(replacement);ok(fresh,'fresh slot');assert.equal(fresh.data.state,'prepared');
 const old=(await req(`/rest/v1/inbound_upload_attempts?id=eq.${winner}&select=state,inbound_batch_id`)).data[0];assert.equal(old.state,'abandoned');assert.equal(old.inbound_batch_id,null);
 pass('one concurrent writer per batch slot; abandoned slots retry on fresh attempts; app-role RPC denied');
 const stagedId=randomUUID(),stagedPath=`${a.id}/${stagedId}`;
 await seed('inbound_upload_attempts',{id:stagedId,user_id:a.id,storage_path:stagedPath},a.id);
 files.push({bucket:'inbound-records',path:stagedPath});
 ok(await req(`/storage/v1/object/inbound-records/${stagedPath}`,{method:'POST',raw:true,body:bytes}),'in-flight upload');
 const deletion=await seed('account_deletion_requests',{user_id:a.id,confirmed:true,status:'reviewing'},a.id);
 ok(await req('/rest/v1/rpc/operator_block_reviewed_account',{method:'POST',body:{p_user_id:a.id,p_request_id:deletion.id}}),'block owner',204);
 ok(await req('/functions/v1/inbound-records/keys',{token:a.token}),'blocked JWT',403);
 ok(await req('/functions/v1/inbound-records',{token:a.key,method:'POST',body:payload(a.id),retryKey}),'blocked API key',403);
 const deniedCommit=await req('/rest/v1/rpc/finalize_inbound_upload',{method:'POST',body:{p_attempt_id:stagedId,p_record:{kind:'other',title:'Must not save',file_type:'png',file_size_bytes:bytes.length}}});
 assert.equal(deniedCommit.status,403);assert.equal(deniedCommit.data.code,'42501');
 const abandoned=await req('/rest/v1/rpc/abandon_inbound_upload',{method:'POST',body:{p_attempt_id:stagedId}});ok(abandoned,'abandon blocked upload');assert.equal(abandoned.data.state,'abandoned');
 ok(await req('/storage/v1/object/inbound-records',{method:'DELETE',body:{prefixes:[stagedPath]}}),'remove blocked upload');
 pass('account block between upload and finalization prevents record commit');
 const remaining=await req(`/rest/v1/health_records?user_id=eq.${a.id}&select=id`);ok(remaining,'record count');assert.deepEqual(remaining.data.map(r=>r.id).sort(),[id,partial.data.records[0].id,fhir.data.records[0].id].sort());
 const bRows=await req(`/rest/v1/health_records?user_id=eq.${b.id}&select=id`);ok(bRows,'foreign count');assert.deepEqual(bRows.data.map(r=>r.id),[foreign.data.records[0].id]);
 pass('existing JWT and API key denied after account block; no new or foreign records');
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
console.log(JSON.stringify({result:'PASS',checks,scope:'Preview inbound authorization, protected delivery, failure compensation and block-before-finalization'}));
