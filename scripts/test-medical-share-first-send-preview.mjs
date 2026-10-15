// Requires temporary sink deployment and disposable fixture. No production project accepted.
import {readFileSync,statSync} from 'node:fs';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
const path=process.env.HV_SHARE_REPLAY_FIXTURE;assert(path);assert.equal(statSync(path).mode&0o077,0);
const f=JSON.parse(readFileSync(path,'utf8')),project='roeudwddxvniazwufdqf';
assert.equal(JSON.parse(Buffer.from(f.key.split('.')[1],'base64url')).ref,project);
assert(f.email.endsWith('@example.invalid'));
async function req(path,token,body){
 const r=await fetch(`https://${project}.supabase.co${path}`,{method:'POST',headers:{apikey:f.key,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(30000)});
 return {status:r.status,data:await r.json().catch(()=>null)};
}
const login=await req('/auth/v1/token?grant_type=password',f.key,{email:f.email,password:f.password});assert.equal(login.status,200);
const token=login.data.access_token;
try{
 const ready=await req('/functions/v1/share/__test_ready',token,{});assert.deepEqual(ready,{status:200,data:{sink:true,project}});
 for(const scenario of ['accepted','lost','server-error']){
  const requestId=randomUUID(),body={...f.body,requestId,recipient:{...f.body.recipient,email:`${scenario}@example.invalid`}};
  const replies=await Promise.all(Array.from({length:6},()=>req('/functions/v1/share',token,body)));
  assert(replies.every(r=>[200,202].includes(r.status)));
  const status=await req('/functions/v1/share/status',token,{requestId});
  assert.equal(status.status,scenario==='accepted'?200:202);
  if(scenario==='accepted')assert.equal(status.data.emailSent,true);else assert.deepEqual(status.data,{pending:true});
  const replay=await req('/functions/v1/share',token,body);assert.equal(replay.status,status.status);
  assert.equal((await req('/functions/v1/share',token,{...body,note:'changed'})).status,409);
  console.log(`PASS ${scenario}: six first calls, status, replay and payload conflict`);
 }
}finally{
 try {
 const cleanup=await req('/functions/v1/share/__test_cleanup',token,{});assert.equal(cleanup.status,200);
 assert.equal(cleanup.data.removed,6);
 for(const scenario of ['accepted','lost','server-error'])assert.equal(cleanup.data.dispatches.filter(d=>d.scenario===scenario).length,1,'Exactly one provider call per scenario');
 assert.equal(cleanup.data.claims.length,3);
 assert(cleanup.data.claims.every(c=>c.share_event_id&&c.email_attempt_started_at));
 const accepted=cleanup.data.claims.filter(c=>c.provider_accepted_at);assert.equal(accepted.length,1);
 assert.equal(accepted[0].provider_message_id,cleanup.data.dispatches.find(d=>d.scenario==='accepted').id);
 assert.equal(cleanup.data.claims.filter(c=>c.receipt).length,1);
 console.log('PASS independent sink counts: one dispatch per scenario; durable IDs/attempts/acceptance match; removed six storage objects');
 } finally {
 assert.equal((await req('/auth/v1/logout?scope=global',token,{})).status,204);
 }
}
