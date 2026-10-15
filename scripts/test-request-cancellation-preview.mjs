// Isolated preview only; synthetic users, no emails, always remove fixtures.
import {readFileSync,statSync} from 'node:fs';
import {randomUUID,randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
const project='roeudwddxvniazwufdqf',base=`https://${project}.supabase.co`;
const keyFile=process.env.HV_PREVIEW_KEYS_FILE;assert(keyFile);assert.equal(statSync(keyFile).mode&0o077,0);
const keys=JSON.parse(readFileSync(keyFile,'utf8'));
const admin=keys.find(k=>k.name==='service_role')?.api_key,anon=keys.find(k=>k.name==='anon')?.api_key;
for(const key of [admin,anon])assert.equal(JSON.parse(Buffer.from(key.split('.')[1],'base64url')).ref,project);
const users=[],requests=[],uploads=[];
async function req(path,{token=admin,method='GET',body,raw=false}={}){
 const r=await fetch(base+path,{method,headers:{apikey:anon,Authorization:`Bearer ${token}`,'Content-Type':raw?'text/plain':'application/json',Prefer:'return=representation'},...(body===undefined?{}:{body:raw?body:JSON.stringify(body)}),signal:AbortSignal.timeout(30000)});
 return {status:r.status,data:await r.json().catch(()=>null)};
}
function ok(r,status=200){assert.equal(r.status,status,`Unexpected HTTP ${r.status}`);return r.data;}
try{
 for(let i=0;i<2;i++){
  const email=`hv-cancel-${randomUUID()}@example.invalid`,password=randomBytes(32).toString('base64url');
  const u=ok(await req('/auth/v1/admin/users',{method:'POST',body:{email,password,email_confirm:true}}));users.push(u);
  u.token=ok(await req('/auth/v1/token?grant_type=password',{token:anon,method:'POST',body:{email,password}})).access_token;
 }
 const [a,b]=users;
 async function seed(status='sent'){
  const r={id:randomUUID(),user_id:a.id,provider_name:'Synthetic cancellation provider',status,secure_token:randomUUID(),expires_at:new Date(Date.now()+3600000).toISOString()};
  requests.push(r);ok(await req('/rest/v1/health_record_requests',{method:'POST',body:r}),201);return r;
 }
 const r=await seed(),url=x=>`/functions/v1/record-request/${x.id}`;
 const cancel=(x,token=a.token)=>req(url(x)+'/cancel',{token,method:'POST'});
 ok(await cancel(r,b.token),404);ok(await cancel(r,anon),401);
 assert.equal(ok(await cancel(r)).status,'cancelled');assert.equal(ok(await cancel(r)).status,'cancelled');
 ok(await req(url(r)+'?token='+r.secure_token,{token:anon}),410);
 ok(await req(url(r)+'/resend',{token:a.token,method:'POST',body:{}}),409);
 const submitted=await req(url(r)+'/submit',{token:anon,method:'POST',body:{token:r.secure_token,files:[]}});
 assert([403,409,410].includes(submitted.status));
 ok(await req(`/rest/v1/health_record_requests?id=eq.${r.id}`,{token:a.token,method:'PATCH',body:{status:'sent'}}),400);
 const received=await seed('received');ok(await cancel(received),409);
 console.log('PASS authenticated cancellation, owner/anonymous refusal, retry, revoked portal/upload/resend and received preservation');
 // Race real database sessions. No email endpoint invoked by resend reservation.
 for(let i=0;i<8;i++){
  const race=await seed();
  const reserve=req('/rest/v1/rpc/transition_record_request',{method:'POST',body:{p_request_id:race.id,p_user_id:a.id,p_action:'resend',p_token:randomUUID()}});
  const results=await Promise.all([reserve,cancel(race)]);results.forEach(x=>ok(x));
  const row=ok(await req(`/rest/v1/health_record_requests?id=eq.${race.id}&select=status`));assert.equal(row[0].status,'cancelled');
 }
 console.log('PASS eight concurrent resend-transition/cancel races remain cancelled');
 // Stage real storage bytes, then race finalization against cancellation.
 for(const order of ['cancel-first','finalize-first',...Array(6).fill('concurrent')]){
  const race=await seed(),id=randomUUID(),path=`${race.id}/${id}`;
  uploads.push({id,path});
  ok(await req('/rest/v1/rpc/reserve_request_upload',{method:'POST',body:{p_request_id:race.id,p_token:race.secure_token,p_attempt_id:id,p_fingerprint:randomBytes(32).toString('hex')}}));
  ok(await req(`/storage/v1/object/record-request-files/${path}`,{method:'POST',raw:true,body:'Synthetic cancellation race fixture'}));
  const finalize=()=>req('/rest/v1/rpc/finalize_request_upload',{method:'POST',body:{p_attempt_id:id,p_token:race.secure_token,p_record:{file_name:'fixture.txt',file_type:'txt',file_size_bytes:35,kind:'other',title:'Synthetic race upload',notes:null}}});
  let result;
  if(order==='cancel-first'){ok(await cancel(race));result=await finalize();assert.equal(result.status,403);}
  else if(order==='finalize-first'){result=await finalize();ok(result);ok(await cancel(race));}
  else {const pair=await Promise.all([finalize(),cancel(race)]);result=pair[0];ok(pair[1]);assert([200,403].includes(result.status));}
  const state=ok(await req(`/rest/v1/inbound_upload_attempts?id=eq.${id}&select=state`))[0].state;
  assert.equal(state,result.status===200?'committed':'abandoned');
  assert.equal(ok(await req(`/rest/v1/health_records?id=eq.${id}&select=id`)).length,result.status===200?1:0);
  assert.equal(ok(await req(`/rest/v1/record_request_files?id=eq.${id}&select=id`)).length,result.status===200?1:0);
  assert.equal(ok(await req(`/rest/v1/health_record_requests?id=eq.${race.id}&select=status`))[0].status,'cancelled');
  const complete=await req('/rest/v1/rpc/complete_request_upload',{method:'POST',body:{p_request_id:race.id,p_token:race.secure_token,p_attempt_ids:[id]}});assert.equal(complete.status,403);
 }
 console.log('PASS cancel-first, finalize-first and six concurrent upload/cancel races; committed records preserved, late finalization/completion refused');
 const blocked=await seed();ok(await req(`/auth/v1/admin/users/${a.id}`,{method:'PUT',body:{ban_duration:'1h'}}));assert([401,403].includes((await cancel(blocked)).status),'Banned owner was not refused');
 assert.equal(ok(await req(`/rest/v1/health_record_requests?id=eq.${blocked.id}&select=status`))[0].status,'sent');
 console.log('PASS banned owner refused');
} finally {
 for(const u of uploads){
  ok(await req('/storage/v1/object/record-request-files',{method:'DELETE',body:{prefixes:[u.path]}}));
  for(const table of ['record_request_files','health_records','inbound_upload_attempts'])ok(await req(`/rest/v1/${table}?id=eq.${u.id}`,{method:'DELETE'}));
 }

 for(const r of requests)ok(await req(`/rest/v1/health_record_requests?id=eq.${r.id}`,{method:'DELETE'}));
 for(const u of users)ok(await req(`/auth/v1/admin/users/${u.id}`,{method:'DELETE'}));
 console.log('CLEANUP synthetic requests and users removed');
}
