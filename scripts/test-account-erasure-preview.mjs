// Preview-only rehearsal. Not a general-purpose production erasure command.
// Creates its own fixtures, blocks/erases A, proves B unchanged, cleans both.
import { readFileSync, statSync } from 'node:fs';
import { randomUUID, randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
const project='roeudwddxvniazwufdqf', base=`https://${project}.supabase.co`;
const keyFile=process.env.HV_PREVIEW_KEYS_FILE;
assert(keyFile); assert.equal(statSync(keyFile).mode & 0o077,0);
const keys=JSON.parse(readFileSync(keyFile,'utf8'));
const admin=keys.find(k=>k.name==='service_role')?.api_key, anon=keys.find(k=>k.name==='anon')?.api_key;
for(const key of [admin,anon]) assert.equal(JSON.parse(Buffer.from(key.split('.')[1],'base64url')).ref,project);
const run=randomUUID(), users=[], fixtures=[], files=[]; let checks=0; const limitations=[];
async function req(path,{token=admin,method='GET',body,raw=false}={}) {
 const r=await fetch(base+path,{method,headers:{apikey:anon,Authorization:`Bearer ${token}`,
   'Content-Type':raw?'application/pdf':'application/json',Prefer:'return=representation'},
   ...(body===undefined?{}:{body:raw?body:JSON.stringify(body)}),signal:AbortSignal.timeout(30000)});
 const text=await r.text(); let data;try{data=JSON.parse(text);}catch{data=null;}
 return {status:r.status,data,text};
}
function ok(r,label,status=200){assert.equal(r.status,status,`${label}: HTTP ${r.status}, code ${r.data?.code||r.data?.error_code||'none'}`);}
function pass(label){checks++;console.log(`PASS ${label}`);}
async function seed(table,row,user){row.id ||=randomUUID();fixtures.push({table,id:row.id,user});
 const r=await req(`/rest/v1/${table}`,{method:'POST',body:row});ok(r,`seed ${table}`,201);return row;}
async function rows(table,user){const ids=fixtures.filter(f=>f.table===table&&f.user===user.id).map(f=>f.id);
 return req(`/rest/v1/${table}?id=in.(${ids.join(',')})&select=id`);}
async function deleteRows(user){for(const f of fixtures.filter(f=>f.user===user.id).reverse())
 ok(await req(`/rest/v1/${f.table}?id=eq.${f.id}`,{method:'DELETE'}),`erase ${f.table}`);}
async function removeFile(user){ok(await req('/storage/v1/object/medical-form-uploads',{method:'DELETE',body:{prefixes:[user.path]}}),'remove bytes');}
async function eraseFixture(user,{failBeforeFile=false}={}){
 // Every destructive target must still be a synthetic identity created in this process.
 const current=await req(`/auth/v1/admin/users/${user.id}`);ok(current,'verify synthetic account');
 assert.equal(current.data.app_metadata.account_control_test,run);
 if(failBeforeFile)throw new Error('injected_storage_failure');
 await removeFile(user);await deleteRows(user);
 ok(await req(`/auth/v1/admin/users/${user.id}`,{method:'DELETE'}),'remove synthetic Auth');
}
try {
 for(const label of ['A','B']){
  const password=randomBytes(32).toString('base64url'),email=`hv-erasure-${run}-${label}@example.invalid`;
  const c=await req('/auth/v1/admin/users',{method:'POST',body:{email,password,email_confirm:true,app_metadata:{account_control_test:run}}});ok(c,'create synthetic Auth');
  const u={id:c.data.id,label};users.push(u);
  const s=await req('/auth/v1/token?grant_type=password',{token:anon,method:'POST',body:{email,password}});ok(s,'sign in');u.token=s.data.access_token;u.refresh=s.data.refresh_token;
  u.reauthenticate=async()=>{const r=await req('/auth/v1/token?grant_type=password',{token:anon,method:'POST',body:{email,password}});ok(r,'fresh session');return r.data.access_token;};
  await seed('user_profiles',{user_id:u.id,first_name:`Synthetic ${label}`,last_name:run},u.id);
  const patient=await seed('patient_profiles',{user_id:u.id,name:`Synthetic ${label} ${run}`},u.id);
  u.condition=await seed('conditions',{user_id:u.id,name:`Synthetic ${label} ${run}`,status:'Active'},u.id);
  await seed('health_records',{user_id:u.id,kind:'other',title:`Synthetic ${label} ${run}`},u.id);
  const form=await seed('form_responses',{patient_id:patient.id,template_id:'patient-reg',answers_json:{synthetic:label},status:'complete'},u.id);
  await seed('form_answer_proposals',{user_id:u.id,patient_id:patient.id,response_id:form.id,template_id:'patient-reg',template_version:'v2025.01',proposed_answers:{synthetic:label},expires_at:new Date(Date.now()+3600000).toISOString()},u.id);
  await seed('share_events',{patient_id:u.id,form_response_ids:[form.id],method:'SecureLink',recipient:{synthetic:true},status:'revoked',is_revoked:true},u.id);
  u.path=`${u.id}/${run}.pdf`;files.push(u);
  ok(await req(`/storage/v1/object/medical-form-uploads/${u.path}`,{token:u.token,method:'POST',body:`%PDF-1.4\nSynthetic ${label}\n%%EOF`,raw:true}),'upload synthetic file');
  await seed('medical_form_uploads',{user_id:u.id,patient_id:patient.id,title:'Synthetic',original_filename:'fixture.pdf',storage_path:u.path,mime_type:'application/pdf',size_bytes:28},u.id);
  const signed=await req(`/storage/v1/object/sign/medical-form-uploads/${u.path}`,{token:u.token,method:'POST',body:{expiresIn:600}});ok(signed,'sign URL');
  u.signedUrl=base+'/storage/v1'+signed.data.signedURL;
 }
 const [a,b]=users;
 const bBefore=await req('/functions/v1/account-export',{token:b.token,method:'POST',body:{}});ok(bBefore,'B export baseline');
 assert.equal(bBefore.data.tables.conditions.length,1);
 assert((await req(`/rest/v1/conditions?id=eq.${a.condition.id}&select=id`,{token:b.token})).data.length===0);
 pass('two accounts, private uploads, completed forms, proposals and row isolation');
 const request=await seed('account_deletion_requests',{user_id:a.id,confirmed:true,status:'requested'},a.id);
 const blockBody={p_user_id:a.id,p_request_id:request.id};
 assert((await req('/rest/v1/rpc/operator_block_reviewed_account',{token:a.token,method:'POST',body:blockBody})).status>=400);
 assert((await req('/rest/v1/rpc/operator_block_reviewed_account',{method:'POST',body:blockBody})).status>=400);
 ok(await req('/rest/v1/rpc/current_account_access_allowed',{token:a.token,method:'POST',body:{}}),'pending request still active');
 const before=await req(`/rest/v1/conditions?id=eq.${a.condition.id}&select=id`,{token:a.token});ok(before,'before revoke');assert.equal(before.data.length,1);
 ok(await req('/auth/v1/logout?scope=global',{token:a.token,method:'POST'}),'revoke sessions',204);
 const afterLogout=await req(`/rest/v1/conditions?id=eq.${a.condition.id}&select=id`,{token:a.token});ok(afterLogout,'old JWT after logout');
 assert.equal(afterLogout.data.length,1,'Re-evaluate platform behavior if logout now invalidates JWT');
 pass('observed old JWT still reads after global logout; unreviewed/client block refused');
 a.liveToken=await a.reauthenticate();
 ok(await req(`/rest/v1/account_deletion_requests?id=eq.${request.id}`,{method:'PATCH',body:{status:'reviewing'}}),'operator review');
 ok(await req('/rest/v1/rpc/operator_block_reviewed_account',{method:'POST',body:blockBody}),'operator block',204);
 ok(await req('/rest/v1/rpc/operator_block_reviewed_account',{method:'POST',body:blockBody}),'idempotent block',204);
 const access=await req('/rest/v1/rpc/current_account_access_allowed',{token:a.token,method:'POST',body:{}});ok(access,'access gate');assert.equal(access.data,false);
 for(const table of ['conditions','health_records','patient_profiles','form_responses','form_answer_proposals','share_events','medical_form_uploads']){
  const own=fixtures.find(f=>f.user===a.id&&f.table===table);
  const r=await req(`/rest/v1/${table}?id=eq.${own.id}&select=id`,{token:a.token});ok(r,`blocked ${table}`);assert.deepEqual(r.data,[]);
 }
 ok(await req('/rest/v1/conditions',{token:a.token,method:'POST',body:{user_id:a.id,name:'must not recreate'}}),'blocked write',403);
 ok(await req('/functions/v1/account-export',{token:a.liveToken,method:'POST',body:{}}),'blocked export',403);
 const blockedFile=await req(`/storage/v1/object/authenticated/medical-form-uploads/${a.path}`,{token:a.token});assert(blockedFile.status>=400);
 const blockedUpload=await req(`/storage/v1/object/medical-form-uploads/${a.id}/${run}-blocked.txt`,{token:a.token,method:'POST',body:'must not save',raw:true});assert(blockedUpload.status>=400);
 pass('reviewed block denies old JWT reads/writes/export and authenticated file access');
 // Storage URLs are independent bearer credentials: characterize, do not claim JWT revokes them.
 const bearerBefore=await fetch(a.signedUrl,{signal:AbortSignal.timeout(30000)});assert.equal(bearerBefore.status,200);await bearerBefore.arrayBuffer();
 pass('confirmed pre-issued signed URL survives account block (separate revocation gap)');
 ok(await req(`/auth/v1/admin/users/${a.id}`,{method:'PUT',body:{ban_duration:'876000h'}}),'ban synthetic account');
 const refreshed=await req('/auth/v1/token?grant_type=refresh_token',{token:anon,method:'POST',body:{refresh_token:a.refresh}});assert(refreshed.status>=400);
 await assert.rejects(eraseFixture(a,{failBeforeFile:true}),/injected_storage_failure/);
 assert.equal((await rows('conditions',a)).data.length,1);assert.equal((await req('/rest/v1/rpc/current_account_access_allowed',{token:a.token,method:'POST',body:{}})).data,false);
 pass('partial failure preserves data and access block; revoked refresh token rejected');
 await eraseFixture(a);
 const bearerAfter=await fetch(a.signedUrl,{signal:AbortSignal.timeout(30000)});
 const cacheEvidence={status:bearerAfter.status,cache:bearerAfter.headers.get('cf-cache-status'),cacheControl:bearerAfter.headers.get('cache-control')};
 await bearerAfter.arrayBuffer();
 if(bearerAfter.status<400){
   limitations.push('Signed URL remains readable immediately after byte deletion; immediate revocation gate FAILED');
   console.log('OBSERVED signed URL after deletion',JSON.stringify(cacheEvidence));
   const originCheck=await fetch(a.signedUrl+'&rehearsal='+randomUUID(),{signal:AbortSignal.timeout(30000)});
   console.log('OBSERVED uncached signed URL',originCheck.status);await originCheck.arrayBuffer();
 }

 for(const table of [...new Set(fixtures.filter(f=>f.user===a.id).map(f=>f.table))])assert.deepEqual((await rows(table,a)).data,[]);
 assert.deepEqual((await req(`/rest/v1/conditions?user_id=eq.${a.id}&select=id`,{token:a.token})).data,[]);
 ok(await req('/rest/v1/conditions',{token:a.token,method:'POST',body:{user_id:a.id,name:'must not recreate'}}),'deleted JWT write',403);
 const bAfter=await req('/functions/v1/account-export',{token:b.token,method:'POST',body:{}});ok(bAfter,'B export unchanged');assert.deepEqual(bAfter.data.tables,bBefore.data.tables);
 const bFile=await req(`/storage/v1/object/authenticated/medical-form-uploads/${b.path}`,{token:b.token});ok(bFile,'B file unaffected');assert.equal(bFile.text,'%PDF-1.4\nSynthetic B\n%%EOF');
 pass('A rows/Auth/storage entries removed; old JWT denied; B export and file unchanged');
}finally{
 const errors=[];
 for(const u of users){
  try{
   if(u.token)await req('/auth/v1/logout?scope=global',{token:u.liveToken||u.token,method:'POST'});
   if(u.path)await removeFile(u);await deleteRows(u);
   const current=await req(`/auth/v1/admin/users/${u.id}`);
   if(current.status===200){assert.equal(current.data.app_metadata.account_control_test,run);ok(await req(`/auth/v1/admin/users/${u.id}`,{method:'DELETE'}),'cleanup Auth');}
   else assert.equal(current.status,404);
   ok(await req(`/rest/v1/account_erasure_blocks?user_id=eq.${u.id}`,{method:'DELETE'}),'cleanup block');
  }catch{errors.push(u.label);}
 }
 assert.deepEqual(errors,[],'Synthetic cleanup failed; inspect only this run fixtures');
 pass('synthetic fixtures cleaned; no live account targeted');
}
console.log(JSON.stringify({result:limitations.length?'PARTIAL_WITH_FAILED_GATE':'PASS',checks,limitations,scope:'Preview JWT access block and exact synthetic fixture erasure; not full production erasure'}));

// Keep the release gate red even when the successful subchecks and cleanup pass.
process.exitCode = limitations.length ? 2 : 0;
