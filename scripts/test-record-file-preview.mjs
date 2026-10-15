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
try{
 for(const label of ['A','B']){
  const email=`hv-file-${run}-${label}@example.invalid`,password=randomBytes(32).toString('base64url');
  const c=await req('/auth/v1/admin/users',{method:'POST',body:{email,password,email_confirm:true,app_metadata:{account_control_test:run}}});ok(c,'create Auth');const u={id:c.data.id};users.push(u);
  const s=await req('/auth/v1/token?grant_type=password',{token:anon,method:'POST',body:{email,password}});ok(s,'sign in');u.token=s.data.access_token;
  u.records=[];
  for(const bucket of ['medical-form-uploads','record-request-files']){
   const request=bucket==='record-request-files'?await seed('health_record_requests',{user_id:u.id,provider_name:'Synthetic provider',status:'received'},u.id):null;
   const path=`${request?.id||u.id}/${run}.png`;files.push({bucket,path});
   ok(await req(`/storage/v1/object/${bucket}/${path}`,{method:'POST',raw:true,body:bytes}),'upload');
   if(request)await seed('record_request_files',{request_id:request.id,file_name:'synthetic.png',file_type:'png',storage_path:path},u.id);
   const ref=`hv-storage://${bucket}/${encodeURIComponent(path)}`;
   const record=await seed('health_records',{user_id:u.id,kind:'other',title:'Synthetic protected file',file_type:'png',preview_url:ref},u.id);
   u.records.push({id:record.id,ref,bucket,path});
  }
 }
 const [a,b]=users;
 for(const u of users)for(const r of u.records){const d=await download(u,r.id);ok(d,'owner file');assert.deepEqual(d.buffer,bytes);assert(d.cache?.includes('no-store'));assert.equal(d.cdn,'no-store');assert.equal(d.location,null);}
 pass('both owners read exact bytes from private and request-file paths; no-store and no redirect');
 ok(await req('/functions/v1/record-file',{token:anon,method:'POST',body:{recordId:a.records[0].id}}),'anonymous',401);
 for(const r of a.records)ok(await download(b,r.id),'foreign record',404);
 pass('anonymous and cross-account requests denied');
 for(let i=0;i<2;i++){
  ok(await setRef(a.records[i].id,b.records[i].ref),'forge owned metadata');
  ok(await download(a,a.records[i].id),'foreign object on owned row',404);
  ok(await setRef(a.records[i].id,a.records[i].ref),'restore reference');
 }
 pass('owned-row pointer tampering cannot fetch another owner file, including request-file join');
 const signed=await req(`/storage/v1/object/sign/${a.records[0].bucket}/${a.records[0].path}`,{method:'POST',body:{expiresIn:600}});ok(signed,'legacy signed URL');
 ok(await setRef(a.records[0].id,base+'/storage/v1'+signed.data.signedURL),'legacy reference');
 ok(await download(a,a.records[0].id),'legacy safely proxied');
 pass('existing signed URL supported internally without exposing it to the caller');
 ok(await setRef(b.records[0].id,null),'unlink file');
 ok(await download(b,b.records[0].id),'revoked warmed file',404);
 ok(await setRef(b.records[0].id,b.records[0].ref),'restore fixture');
 pass('unlink immediately denies a previously downloaded protected file even while object exists');
 const deletion=await seed('account_deletion_requests',{user_id:a.id,confirmed:true,status:'reviewing'},a.id);
 ok(await req('/rest/v1/rpc/operator_block_reviewed_account',{method:'POST',body:{p_user_id:a.id,p_request_id:deletion.id}}),'reviewed account block',204);
 for(const r of a.records)ok(await download(a,r.id),'blocked warmed file',403);
 for(const r of b.records){const d=await download(b,r.id);ok(d,'B unaffected');assert.deepEqual(d.buffer,bytes);}
 pass('account block immediately denies warmed endpoint for both file kinds; B unchanged');
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
console.log(JSON.stringify({result:'PASS',checks,scope:'Protected record-file requests only; previously issued direct Storage URLs and downloaded copies remain separate'}));
