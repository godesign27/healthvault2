import { requestFileFingerprint } from '../supabase/functions/record-request/fingerprint.ts';
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
async function req(path,{token=admin,method='GET',body,raw=false,timeoutMs=30000}={}){
 const r=await fetch(base+path,{method,headers:{apikey:anon,Authorization:`Bearer ${token}`,'Content-Type':raw?'image/png':'application/json',Prefer:'return=representation'},...(body===undefined?{}:{body:raw?body:JSON.stringify(body)}),signal:AbortSignal.timeout(timeoutMs)});
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
  const email=`hv-request-${run}-${label}@example.invalid`,password=randomBytes(32).toString('base64url');
  const c=await req('/auth/v1/admin/users',{method:'POST',body:{email,password,email_confirm:true,app_metadata:{account_control_test:run}}});ok(c,'create Auth');const u={id:c.data.id};users.push(u);
  const s=await req('/auth/v1/token?grant_type=password',{token:anon,method:'POST',body:{email,password}});ok(s,'sign in');u.token=s.data.access_token;
 }
 const [a,b]=users;
 const makeRequest=(u)=>seed('health_record_requests',{user_id:u.id,provider_name:'Synthetic provider',patient_name:'Synthetic patient',secure_token:randomUUID(),status:'sent',expires_at:new Date(Date.now()+3600000).toISOString()},u.id);
 const request=await makeRequest(a), bRequest=await makeRequest(b);
 const url=r=>`/functions/v1/record-request/${r.id}`;
 const submit=(r,files)=>req(url(r)+'/submit',{token:anon,method:'POST',body:{token:r.secure_token,files}});
 const good={fileName:'fixture.png',fileType:'png',contentType:'image/png',recordKind:'OTHER',base64:bytes.toString('base64')};
 ok(await req(url(request)+'?token='+request.secure_token,{token:anon}),'valid portal');
 ok(await req(url(request)+'?token=wrong',{token:anon}),'wrong token',403);
 ok(await req(url(request)+'/resend',{token:b.token,method:'POST',body:{}}),'foreign resend',404);
 ok(await req(url(request)+'/resend',{token:anon,method:'POST',body:{}}),'anonymous resend',401);
 pass('provider token validated; anonymous/foreign resend cannot rotate token or email');
 const oversizedControl=await req('/functions/v1/record-request',{token:a.token,method:'POST',body:{padding:'x'.repeat(65536)}});
 ok(oversizedControl,'oversized request metadata',413);assert.equal(oversizedControl.data.code,'request_body_rejected');
 // Opt in to the expensive gateway acceptance check; a 502 is a failed gate, not a pass.
 if(process.env.HV_TEST_LARGE_BODY === '1') {
 const oversized=await req(url(request)+'/submit',{token:anon,method:'POST',timeoutMs:120000,body:{token:request.secure_token,files:[],padding:'x'.repeat(42*1024*1024)}});
 ok(oversized,'oversized batch',413);assert.equal(oversized.data.code,'request_body_rejected');
 pass('42 MiB rejected with application 413 receipt, not a gateway error');
 }
 const malformed=await req(url(request)+'/submit',{token:anon,method:'POST',body:null});ok(malformed,'non-object body',400);
 const untouched=await req(`/rest/v1/inbound_upload_attempts?request_id=eq.${request.id}&select=id`);ok(untouched,'no upload attempts');assert.equal(untouched.data.length,0);
 pass('oversized control metadata and malformed upload rejected before writes');
 const partial=await submit(request,[good,{...good,base64:'invalid'},{...good,recordKind:'invalid_kind'}]);
 ok(partial,'partial submit',207);assert.equal(partial.data.success,false);assert.equal(partial.data.filesReceived,1);assert.equal(partial.data.filesFailed,2);
 assert.deepEqual(partial.data.saved.map(x=>x.index),[0]);
 const metadata=await req(`/rest/v1/record_request_files?request_id=eq.${request.id}&select=id`);ok(metadata,'file metadata');assert.equal(metadata.data.length,1);
 const status=await req(`/rest/v1/health_record_requests?id=eq.${request.id}&select=status`);ok(status,'partial request state');assert.equal(status.data[0].status,'sent');
 const objects=await req('/storage/v1/object/list/record-request-files',{method:'POST',body:{prefix:request.id,limit:100}});ok(objects,'partial object count');assert.equal(objects.data.length,1);
 const downloaded=await download(a,partial.data.saved[0].id);ok(downloaded,'protected request file');assert.deepEqual(downloaded.buffer,bytes);
 pass('partial failures remain visible; metadata transaction rolls back and rejected file is removed');
 const repeatedPartial=await submit(request,[good,{...good,base64:'invalid'}]);ok(repeatedPartial,'lost partial response replay',207);
 assert.equal(repeatedPartial.data.saved[0].id,partial.data.saved[0].id);
 assert.equal((await req(`/rest/v1/record_request_files?request_id=eq.${request.id}&select=id`)).data.length,1);
 const remaining={...good,fileName:'remaining.png'};
 const done=await submit(request,[remaining]);ok(done,'retry only remaining file');assert.equal(done.data.success,true);
 const complete=await req(`/rest/v1/health_record_requests?id=eq.${request.id}&select=status,submitted_at`);assert.equal(complete.data[0].status,'received');
 const replay=await submit(request,[remaining]);ok(replay,'completed receipt replay');assert.equal(replay.data.saved[0].id,done.data.saved[0].id);
 assert.equal((await req(`/rest/v1/health_record_requests?id=eq.${request.id}&select=submitted_at`)).data[0].submitted_at,complete.data[0].submitted_at);
 ok(await submit(request,[{...good,fileName:'new-after-completion.png'}]),'new file after completion',422);
 assert.equal((await req(`/rest/v1/record_request_files?request_id=eq.${request.id}&select=id`)).data.length,2);
 pass('partial and completed retries recover stable receipts without duplicate rows or completion timestamp changes');
 const racing=await makeRequest(a);
 const fingerprint=await requestFileFingerprint({kind:'other',title:'Other Records',file_name:good.fileName,file_type:'png',notes:null},bytes,'image/png');
 const reserve=(id,token=admin)=>req('/rest/v1/rpc/reserve_request_upload',{token,method:'POST',body:{p_request_id:racing.id,p_token:racing.secure_token,p_attempt_id:id,p_fingerprint:fingerprint}});
 for(const token of [anon,a.token])assert([401,403,404].includes((await reserve(randomUUID(),token)).status));
 const ids=[randomUUID(),randomUUID()];const reservations=await Promise.all(ids.map(id=>reserve(id)));
 for(const r of reservations)ok(r,'reserve');
 assert.deepEqual(reservations.map(r=>r.data.state).sort(),['busy','prepared']);
 const winner=ids[reservations.findIndex(r=>r.data.state==='prepared')];
 const busy=await submit(racing,[good]);ok(busy,'busy duplicate',422);assert.equal(busy.data.fileErrors[0].code,'reconciliation_required');
 assert.equal((await req(`/rest/v1/inbound_upload_attempts?request_id=eq.${racing.id}&select=id`)).data.length,1);
 ok(await req('/rest/v1/rpc/abandon_inbound_upload',{method:'POST',body:{p_attempt_id:winner}}),'abandon stalled attempt');
 const retried=await submit(racing,[good]);ok(retried,'retry abandoned file');assert.notEqual(retried.data.saved[0].id,winner);
 const old=(await req(`/rest/v1/inbound_upload_attempts?id=eq.${winner}&select=state,request_fingerprint`)).data[0];
 assert.equal(old.state,'abandoned');assert.equal(old.request_fingerprint,null);
 assert.equal((await req(`/rest/v1/record_request_files?request_id=eq.${racing.id}&select=id`)).data.length,1);
 pass('concurrent reservation has one owner; busy retry does not write; abandoned retry uses a fresh path; app roles denied');

 const originalExpiry=request.expires_at;
 ok(await req(`/rest/v1/health_record_requests?id=eq.${request.id}`,{method:'PATCH',body:{expires_at:new Date(Date.now()-1000).toISOString()}}),'expire fixture');
 ok(await submit(request,[remaining]),'expired receipt denied',410);
 ok(await req(`/rest/v1/health_record_requests?id=eq.${request.id}`,{method:'PATCH',body:{expires_at:originalExpiry,secure_token:randomUUID()}}),'rotate completed token');
 ok(await submit(request,[remaining]),'rotated receipt denied',403);
 ok(await req(`/rest/v1/health_record_requests?id=eq.${request.id}`,{method:'PATCH',body:{secure_token:request.secure_token}}),'restore fixture token');
 pass('completed receipts still require current unexpired token');
 const stagedRequest=await makeRequest(a);
 async function stage(r){const id=randomUUID(),path=`${r.id}/${id}`;
  await seed('inbound_upload_attempts',{id,user_id:r.user_id,request_id:r.id,storage_bucket:'record-request-files',storage_path:path},r.user_id);
  files.push({bucket:'record-request-files',path});ok(await req(`/storage/v1/object/record-request-files/${path}`,{method:'POST',raw:true,body:bytes}),'stage request file');return id;
 }
 const staged=await stage(stagedRequest);
 ok(await req(`/rest/v1/health_record_requests?id=eq.${stagedRequest.id}`,{method:'PATCH',body:{secure_token:randomUUID()}}),'rotate fixture token');
 const finalize=(id,r)=>req('/rest/v1/rpc/finalize_request_upload',{method:'POST',body:{p_attempt_id:id,p_token:r.secure_token,p_record:{kind:'other',title:'Synthetic',file_name:'fixture.png',file_type:'png',file_size_bytes:bytes.length}}});
 ok(await finalize(staged,stagedRequest),'rotated token cannot commit',403);
 const blockedRequest=await makeRequest(a),blockedId=await stage(blockedRequest);
 const deletion=await seed('account_deletion_requests',{user_id:a.id,confirmed:true,status:'reviewing'},a.id);
 ok(await req('/rest/v1/rpc/operator_block_reviewed_account',{method:'POST',body:{p_user_id:a.id,p_request_id:deletion.id}}),'block owner',204);
 ok(await finalize(blockedId,blockedRequest),'blocked upload cannot commit',403);
 ok(await req(url(blockedRequest)+'?token='+blockedRequest.secure_token,{token:anon}),'blocked portal',403);
 ok(await submit(blockedRequest,[good]),'blocked submit',403);
 ok(await submit(request,[remaining]),'blocked receipt replay',403);
 ok(await req(url(bRequest)+'?token='+bRequest.secure_token,{token:anon}),'other owner unaffected');
 pass('token rotation and account block reject staged finalization; foreign account remains available');
}finally{
 const failures=[];
 for(const u of users){
  const journal=await req(`/rest/v1/inbound_upload_attempts?user_id=eq.${u.id}&select=id,storage_path,storage_bucket`);
  if(journal.status!==200)failures.push('journal inventory');
  else for(const a of journal.data){
   if(!rows.some(x=>x.table==='inbound_upload_attempts'&&x.id===a.id))rows.push({table:'inbound_upload_attempts',id:a.id});
   if(a.storage_path&&!files.some(x=>x.path===a.storage_path))files.push({bucket:a.storage_bucket,path:a.storage_path});
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
 for(const r of rows.filter(x=>x.table==='health_record_requests')){try{ok(await req(`/rest/v1/record_request_files?request_id=eq.${r.id}`,{method:'DELETE'}),'cleanup request metadata');}catch{failures.push('request metadata');}}
 for(const r of [...rows].reverse()){try{ok(await req(`/rest/v1/${r.table}?id=eq.${r.id}`,{method:'DELETE'}),'cleanup row');}catch{failures.push(r.table);}}
 for(const u of users){try{
  if(u.token)await req('/auth/v1/logout?scope=global',{token:u.token,method:'POST'});
  const current=await req(`/auth/v1/admin/users/${u.id}`);ok(current,'verify fixture');assert.equal(current.data.app_metadata.account_control_test,run);
  ok(await req(`/auth/v1/admin/users/${u.id}`,{method:'DELETE'}),'cleanup Auth');
  ok(await req(`/rest/v1/account_erasure_blocks?user_id=eq.${u.id}`,{method:'DELETE'}),'cleanup block');
 }catch{failures.push('Auth');}}
 assert.deepEqual(failures,[],'Synthetic cleanup failed');pass('all synthetic accounts/files/rows cleaned');
}
console.log(JSON.stringify({result:'PASS',checks,scope:'Preview provider upload recovery and authorization'}));
