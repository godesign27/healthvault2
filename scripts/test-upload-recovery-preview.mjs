// Preview-only protected download acceptance. Creates/cleans only synthetic data.
import { readFileSync, statSync, writeFileSync, unlinkSync } from 'node:fs';
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
const fixtureFile='/tmp/hv-upload-recovery-fixture.json';
const mode=process.argv[2];
const save=f=>writeFileSync(fixtureFile,JSON.stringify(f),{mode:0o600});
if(mode==='setup'){
 const f={run,user:null,request:randomUUID(),attempts:[],baseline:new Date().toISOString()};save(f);
 const u=await req('/auth/v1/admin/users',{method:'POST',body:{email:`hv-recovery-${run}@example.invalid`,email_confirm:true,app_metadata:{account_control_test:run}}});ok(u,'fixture Auth');f.user=u.data.id;save(f);
 ok(await req('/rest/v1/health_record_requests',{method:'POST',body:{id:f.request,user_id:f.user,provider_name:'Synthetic recovery fixture'}}),'fixture request',201);
 for(const kind of ['stale','abandoned','committed','recent']){
  const id=randomUUID(),bucket=kind==='abandoned'?'record-request-files':'inbound-records',path=`${bucket==='inbound-records'?f.user:f.request}/${id}`;
  const a={id,bucket,path,kind};f.attempts.push(a);save(f);
  ok(await req('/rest/v1/inbound_upload_attempts',{method:'POST',body:{id,user_id:f.user,request_id:bucket==='inbound-records'?null:f.request,storage_bucket:bucket,storage_path:path,
   state:kind==='committed'?'committed':kind==='abandoned'?'abandoned':'prepared',created_at:new Date(Date.now()-(kind==='recent'?0:7200000)).toISOString()}}),'fixture attempt',201);
  ok(await req(`/storage/v1/object/${bucket}/${path}`,{method:'POST',raw:true,body:bytes}),'fixture bytes');
  if(kind==='committed')ok(await req('/rest/v1/health_records',{method:'POST',body:{id,user_id:f.user,kind:'other',title:'Synthetic saved file',preview_url:`hv-storage://${bucket}/${encodeURIComponent(path)}`}}),'fixture saved record',201);
 }
 ok(await req('/functions/v1/upload-recovery',{token:anon,method:'POST',body:{}}),'unsigned recovery',401);
 console.log('READY: synthetic stale, abandoned, committed and recent uploads seeded. Dispatch the preview recovery worker.');
}else{
 const f=JSON.parse(readFileSync(fixtureFile,'utf8'));assert.equal(statSync(fixtureFile).mode&0o077,0);
 if(mode==='check'){
  let finished=false;
  for(let i=0;i<12;i++){
   const s=await req('/rest/v1/upload_recovery_settings?select=last_finished_at,checked,failed');ok(s,'recovery receipt');
   if(s.data[0].last_finished_at>f.baseline){assert.equal(s.data[0].checked,2);assert.equal(s.data[0].failed,0);finished=true;break;}
   await new Promise(r=>setTimeout(r,2000));
  }
  assert(finished,'Worker receipt not observed');
  for(const a of f.attempts){
   const list=await req(`/storage/v1/object/list/${a.bucket}`,{method:'POST',body:{prefix:a.path.split('/')[0],limit:100}});ok(list,'file inventory');
   assert.equal(list.data.some(x=>x.name===a.id),['committed','recent'].includes(a.kind));
   const journal=await req(`/rest/v1/inbound_upload_attempts?id=eq.${a.id}&select=state`);ok(journal,'journal retained');
   assert.equal(journal.data[0].state,a.kind==='committed'?'committed':a.kind==='recent'?'prepared':'abandoned');
  }
  console.log('PASS worker removed stale/abandoned bytes, preserved committed/recent files and retained recovery journal');
 }else if(mode==='late'){
  const a=f.attempts.find(a=>a.kind==='abandoned');f.baseline=new Date().toISOString();save(f);
  ok(await req(`/storage/v1/object/${a.bucket}/${a.path}`,{method:'POST',raw:true,body:bytes}),'late arrival');
  console.log('READY: late-arriving synthetic upload recreated; dispatch recovery again.');
 }else if(mode==='cleanup'){
  if(f.user){const u=await req(`/auth/v1/admin/users/${f.user}`);ok(u,'verify fixture owner');assert.equal(u.data.app_metadata.account_control_test,f.run);}
  for(const a of f.attempts){
   ok(await req(`/storage/v1/object/${a.bucket}`,{method:'DELETE',body:{prefixes:[a.path]}}),'cleanup bytes');
   ok(await req(`/rest/v1/health_records?id=eq.${a.id}`,{method:'DELETE'}),'cleanup record');
   ok(await req(`/rest/v1/inbound_upload_attempts?id=eq.${a.id}`,{method:'DELETE'}),'cleanup journal');
  }
  ok(await req(`/rest/v1/health_record_requests?id=eq.${f.request}`,{method:'DELETE'}),'cleanup request');
  if(f.user)ok(await req(`/auth/v1/admin/users/${f.user}`,{method:'DELETE'}),'cleanup Auth');
  unlinkSync(fixtureFile);console.log('PASS recovery fixtures removed');
 }else throw new Error('Use setup, check, late or cleanup');
}
