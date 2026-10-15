import {readFileSync,writeFileSync,unlinkSync,existsSync,statSync} from 'node:fs';
import {randomUUID,randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
const project='roeudwddxvniazwufdqf',base=`https://${project}.supabase.co`,file='tests/real-upload-browser/session.local';
const keyFile=process.env.HV_PREVIEW_KEYS_FILE;assert(keyFile);assert.equal(statSync(keyFile).mode&0o077,0);
const keys=JSON.parse(readFileSync(keyFile,'utf8')),admin=keys.find(k=>k.name==='service_role').api_key,anon=keys.find(k=>k.name==='anon').api_key;
for(const k of [admin,anon])assert.equal(JSON.parse(Buffer.from(k.split('.')[1],'base64url')).ref,project);
async function req(path,method='GET',body,token=admin,raw=false){
 const r=await fetch(base+path,{method,headers:{apikey:anon,Authorization:`Bearer ${token}`,'Content-Type':raw?'image/png':'application/json'},...(body===undefined?{}:{body:raw?body:JSON.stringify(body)}),signal:AbortSignal.timeout(30000)});
 if(!r.ok)throw Error(`Fixture ${method} HTTP ${r.status}`);const t=await r.text();return t?JSON.parse(t):null;
}
const mode=process.argv[2];
if(mode==='serve'){
 const {spawn}=await import('node:child_process');const child=spawn('node_modules/.bin/vite',['--config','tests/real-upload-browser/vite.config.ts'],{stdio:'inherit',env:{...process.env,VITE_SUPABASE_URL:'http://127.0.0.1:5178',VITE_SUPABASE_ANON_KEY:anon}});
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));child.on('exit',code=>process.exit(code??0));
}else if(mode==='cleanup'||mode==='block'){
 const f=JSON.parse(readFileSync(file,'utf8'));assert.equal(f.project,project);
 const user=await req(`/auth/v1/admin/users/${f.user}`);assert.equal(user.app_metadata.account_control_test,f.run);
 if(mode==='block'){
  await req('/rest/v1/account_deletion_requests','POST',{id:f.deletion,user_id:f.user,confirmed:true,status:'reviewing'});
  await req('/rest/v1/rpc/operator_block_reviewed_account','POST',{p_user_id:f.user,p_request_id:f.deletion});console.log('Synthetic browser account blocked');
 }else{
  const attempts=await req(`/rest/v1/inbound_upload_attempts?user_id=eq.${f.user}&select=storage_path`);
  for(const a of attempts)if(a.storage_path)await req('/storage/v1/object/inbound-records','DELETE',{prefixes:[a.storage_path]});
  await req(`/rest/v1/health_records?user_id=eq.${f.user}`,'DELETE');
  await req(`/rest/v1/inbound_upload_attempts?user_id=eq.${f.user}`,'DELETE');
  await req(`/rest/v1/inbound_import_batches?user_id=eq.${f.user}`,'DELETE');
  await req(`/rest/v1/account_deletion_requests?id=eq.${f.deletion}`,'DELETE');
  if(f.session)await req('/auth/v1/logout?scope=global','POST',undefined,f.session.access_token);
  await req(`/auth/v1/admin/users/${f.user}`,'DELETE');
  await req(`/rest/v1/account_erasure_blocks?user_id=eq.${f.user}`,'DELETE');unlinkSync(file);console.log('Browser fixtures removed');
 }
}else{
 assert(!existsSync(file));const run=randomUUID(),email=`hv-file-browser-${run}@example.invalid`,password=randomBytes(32).toString('base64url');
 const user=await req('/auth/v1/admin/users','POST',{email,password,email_confirm:true,app_metadata:{account_control_test:run}});
 const f={project,run,user:user.id,record:randomUUID(),deletion:randomUUID(),path:`${user.id}/${run}.png`};writeFileSync(file,JSON.stringify(f),{mode:0o600,flag:'wx'});
 const auth=await req('/auth/v1/token?grant_type=password','POST',{email,password},anon);f.session={access_token:auth.access_token,refresh_token:auth.refresh_token};writeFileSync(file,JSON.stringify(f),{mode:0o600});console.log('Synthetic browser fixture ready');
}
