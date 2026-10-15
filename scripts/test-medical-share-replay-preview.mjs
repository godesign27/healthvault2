// Preview only. Fixture must have an already reserved claim: this tests replay, not a new send.
// SQL setup/cleanup is performed separately; no production credentials are accepted.
import {readFileSync,statSync} from 'node:fs';
import assert from 'node:assert/strict';
const file=process.env.HV_SHARE_REPLAY_FIXTURE;assert(file);
assert.equal(statSync(file).mode&0o077,0);
const f=JSON.parse(readFileSync(file,'utf8')),project='roeudwddxvniazwufdqf';
assert.equal(JSON.parse(Buffer.from(f.key.split('.')[1],'base64url')).ref,project);
assert(f.email.endsWith('@example.invalid'));assert.equal(f.body.recipient.email,'nobody@example.invalid');
async function req(path,token,body){
 const r=await fetch(`https://${project}.supabase.co${path}`,{method:body===undefined?'GET':'POST',headers:{apikey:f.key,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(30000)});
 return {status:r.status,data:await r.json().catch(()=>null)};
}
const login=await req('/auth/v1/token?grant_type=password',f.key,{email:f.email,password:f.password});assert.equal(login.status,200);
const token=login.data.access_token;
try{
 const history=async()=>{const r=await req(`/rest/v1/share_events?patient_id=eq.${f.owner}&select=id,is_revoked`,token);assert.equal(r.status,200);return r.data;};
 const before=await history();assert.equal(before.length,1);assert.equal(before[0].id,f.share);
 const requests=await Promise.all(Array.from({length:6},()=>req('/functions/v1/share',token,{...f.body,requestId:f.request})));
 for(const r of requests){assert.equal(r.status,process.argv.includes('--receipt')?200:202);if(r.status===202)assert.deepEqual(r.data,{pending:true});else{assert.equal(r.data.id,f.share);assert.equal(r.data.requestId,f.request);assert.equal(r.data.shareUrl,undefined);}}
 assert.equal((await req('/functions/v1/share',token,{...f.body,requestId:f.request,note:'changed'})).status,409);
 assert.deepEqual(await history(),before,'Replays must not create new share events');
 const status=await req('/functions/v1/share/status',token,{requestId:f.request});
 assert.equal(status.status,process.argv.includes('--receipt')?200:202);
 if(status.status===202)assert.deepEqual(status.data,{pending:true});
 else {assert.equal(status.data.id,f.share);assert.equal(status.data.requestId,f.request);}
 for(const key of ['share_event_id','email_attempt_started_at','provider_message_id','provider_accepted_at'])assert.equal(status.data[key],undefined);
 assert.equal((await req('/rest/v1/medical_share_requests?select=*',token)).status,403);

 if(process.argv.includes('--revoke')){
  assert.equal((await req(`/functions/v1/share/${f.share}/revoke`,f.key,{})).status,401);
  const revoked=await req(`/functions/v1/share/${f.share}/revoke`,token,{});assert.equal(revoked.status,200);assert.equal(revoked.data.success,true);
  assert.equal((await history())[0].is_revoked,true);
  const opened=await req(`/functions/v1/share/${f.share}?token=${f.token}`,f.key);assert.equal(opened.status,403);assert.equal(opened.data.error,'Share revoked');
 }
 console.log('PASS six concurrent seeded replays, changed-payload conflict, unchanged share count'+(process.argv.includes('--revoke')?', authenticated revocation and revoked-link denial':''));
}finally{assert.equal((await req('/auth/v1/logout?scope=global',token,{})).status,204);}
