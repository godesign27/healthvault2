// Runs the real Request/Response handler with isolated DB, storage and email adapters.
// No sockets, Supabase credentials, patient data or outbound email are used.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const compile=source=>ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const helpers=await import('data:text/javascript;base64,'+Buffer.from(compile(fs.readFileSync('supabase/functions/share/share-request.ts','utf8'))).toString('base64'));
const source=compile(fs.readFileSync('supabase/functions/share/index.ts','utf8').replace(/^import .*;\n/gm,''));
const owner='a1111111-1111-4111-8111-111111111111',requestId='b1111111-1111-4111-8111-111111111111';
const body={patientId:owner,requestId,forms:[{id:'form',title:'Registration'}],recipient:{email:'synthetic@example.invalid',method:'SecureLink'},options:{cc:{me:false}}};
function harness(mode='accepted'){
 const claims=new Map(),events=new Map();let sends=0,uploads=0,handler,release;
 const gate=new Promise(resolve=>{release=resolve;});
 const db={auth:{getUser:async token=>({data:{user:token==='anonymous'?null:{id:token==='other'?'other-owner':owner}}})},storage:{from:()=>({upload:async()=>{uploads++;assert.ok(claims.get(`${owner}:${requestId}`)?.share_event_id,'Correlation must exist before uploads');if(mode==='upload-throw')throw Error('storage unavailable');return {error:mode==='upload-error'?{message:'unavailable'}:null};}})},from(table){
  const filters={};let operation='select',value;
  const result=()=>{
   if(table==='user_profiles')return {data:{first_name:'Synthetic',email_verified:true,email:'synthetic-owner@example.invalid'}};
   if(table==='patient_profiles')return {data:{id:'patient'}};
   if(table==='form_responses')return {data:[{id:'form',template_id:'patient-reg',answers_json:{}}]};
   const rows=table==='medical_share_requests'?claims:events;
   const key=table==='medical_share_requests'?`${filters.owner_id}:${filters.request_id}`:filters.id;
   if(operation==='insert'){
    const insertKey=table==='medical_share_requests'?`${value.owner_id}:${value.request_id}`:value.id;
    if(rows.has(insertKey))return {error:{code:'23505'}};
    rows.set(insertKey,{...value,receipt:null});return {error:null};
   }
   if(operation==='update'){
    if(table==='medical_share_requests'){
     const stage=value.share_event_id?'correlation':value.email_attempt_started_at?'attempt':value.provider_accepted_at?'provider':null;
     if(stage && mode===`${stage}-failure`)return {error:{code:'unavailable'}};
     if(stage && mode===`${stage}-missing`)return {data:null,error:null};
    }
    if(table==='medical_share_requests'&&value.receipt&&mode==='receipt-failure')return {error:{code:'unavailable'}};
    if(table==='medical_share_requests'&&value.receipt&&mode==='receipt-missing')return {data:null,error:null};
    if(table==='share_events'&&value.is_revoked&&mode==='revoke-missing')return {data:null,error:null};
    if(table==='share_events'&&filters.patient_id&&rows.get(key)?.patient_id!==filters.patient_id)return {data:null,error:null};
    if(table==='share_events'&&mode==='event-update-failure')return {error:{code:'unavailable'}};
    Object.assign(rows.get(key),value);return {data:rows.get(key),error:null};
   }
   return {data:rows.get(key)||null};
  };
  const q={select(){return q;},eq(k,v){filters[k]=v;return q;},in(){return q;},insert(v){operation='insert';value=v;return q;},update(v){operation='update';value=v;return q;},maybeSingle:async()=>result(),then(resolve,reject){return Promise.resolve().then(result).then(resolve,reject);}};return q;
 }};
 const email=async(url)=>{
  assert.equal(url,'https://api.resend.com/emails');sends++;
  const claim=claims.get(`${owner}:${requestId}`);
  assert.ok(claim.email_attempt_started_at,'Attempt evidence must precede provider call');
  assert.ok(events.has(claim.share_event_id),'Claim must point to the created share');
  if(mode==='concurrent')await gate;
  if(mode==='transport-loss')throw Error('Connection lost after submission');
  if(mode==='response-body-loss')return {ok:true,status:200,text:async()=>{throw Error('Body stream lost');}};
  return new Response(JSON.stringify({id:'synthetic-provider-message'}),{status:mode==='rejected'?422:mode==='provider-500'?500:200});
 };
 const page={drawText(){}};
 const PDFDocument={create:async()=>({embedFont:async()=>({}),addPage:()=>page,getPages:()=>[page],save:async()=>new Uint8Array([1])})};
 new Function('Deno','createClient','PDFDocument','StandardFonts','rgb','fetch','console','validRequestId','shareFingerprint','claimShareRequest','recordShareProgress',source)(
  {env:{get:name=>name==='RESEND_API_KEY'?'synthetic':'https://example.invalid'},serve:fn=>{handler=fn;}},()=>db,PDFDocument,{Helvetica:'regular',HelveticaBold:'bold'},()=>0,email,{log(){},error(){}},helpers.validRequestId,helpers.shareFingerprint,helpers.claimShareRequest,helpers.recordShareProgress);
 async function call(payload=body,path='',token='synthetic'){
  const r=await handler(new Request(`https://example.invalid/share${path}`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(payload)}));return {status:r.status,data:await r.json()};
 }
 return {call,claims,events,release,get sends(){return sends;},get uploads(){return uploads;}};
}
const race=harness('concurrent');
const first=race.call();
// Wait until the first request reaches the held email adapter.
for(let n=0;n<100&&race.sends===0;n++)await new Promise(resolve=>setImmediate(resolve));
assert.equal(race.sends,1);
assert.equal((await race.call()).status,202);
race.release();assert.equal((await first).data.emailSent,true);
assert.equal((await race.call()).data.emailSent,true);assert.equal(race.sends,1);assert.equal(race.events.size,1);assert.equal(race.uploads,2);
assert.equal((await race.call({...body,note:'changed'})).status,409);assert.equal(race.sends,1);
for(const mode of ['receipt-failure','receipt-missing','transport-loss','provider-500','upload-throw','upload-error']){
 const h=harness(mode),r=await h.call();
 assert.ok([202,500].includes(r.status),`${mode} must remain unconfirmed`);
 assert.equal((await h.call()).status,202,`${mode} duplicate must remain pending`);
 assert.deepEqual((await h.call({requestId},'/status')).data,{pending:true});
 assert.equal(h.sends,mode.startsWith('upload-')?0:1);
}
for(const mode of ['accepted','rejected','response-body-loss','event-update-failure']){
 const h=harness(mode),r=await h.call();assert.equal(r.status,200);
 assert.equal(r.data.emailSent,mode!=='rejected');
 const receipt=(await h.call({requestId},'/status')).data;
 assert.equal(receipt.emailSent,mode!=='rejected');assert.equal(receipt.deliveryReceiptSaved,mode!=='event-update-failure');
 assert.equal(receipt.shareUrl,undefined);assert.equal(receipt.emailError,undefined);
 await h.call();assert.equal(h.sends,1);
}
console.log('PASS real handler with isolated adapters: simultaneous requests, replay/conflict, transport ambiguity, provider rejection, receipt failure, storage interruption and minimal recovery');

for(const mode of ['accepted','revoke-missing','event-update-failure']){
 const h=harness(mode);h.events.set('revoke-test',{id:'revoke-test',patient_id:owner,is_revoked:false});
 assert.equal((await h.call({},'/revoke-test/revoke','anonymous')).status,401);
 assert.equal((await h.call({},'/revoke-test/revoke','other')).status,403);
 assert.equal(h.events.get('revoke-test').is_revoked,false);
 const result=await h.call({},'/revoke-test/revoke');
 if(mode==='accepted'){
  assert.equal(result.status,200);assert.equal(result.data.success,true);assert.equal(h.events.get('revoke-test').is_revoked,true);
  assert.equal((await h.call({},'/revoke-test/revoke')).data.success,true);
 }else{assert.notEqual(result.status,200,'Unpersisted revoke must not report success');assert.notEqual(result.data.success,true);}
 assert.equal(h.sends,0);
}
console.log('PASS owner-only revocation, repeated revocation, and missing/failed persistence rejection');

for(const stage of ['correlation','attempt','provider'])for(const failure of ['failure','missing']){
 const h=harness(`${stage}-${failure}`),result=await h.call();
 assert.ok([202,500].includes(result.status));
 assert.equal(h.sends,stage==='provider'?1:0);
 if(stage==='correlation')assert.equal(h.uploads,0);
 assert.equal((await h.call()).status,202);
 assert.deepEqual((await h.call({requestId},'/status')).data,{pending:true});
 assert.equal(h.sends,stage==='provider'?1:0,'No resend after lost tracking write');
}
for(const mode of ['accepted','receipt-failure','response-body-loss','transport-loss']){
 const h=harness(mode);await h.call();const claim=h.claims.get(`${owner}:${requestId}`);
 assert.equal(h.events.get(claim.share_event_id).patient_id,owner);
 assert.ok(claim.email_attempt_started_at);
 if(mode==='transport-loss')assert.equal(claim.provider_accepted_at,undefined);
 else {
  assert.ok(claim.provider_accepted_at);
  assert.equal(claim.provider_message_id,mode==='response-body-loss'?null:'synthetic-provider-message');
 }
 const status=(await h.call({requestId},'/status')).data;
 for(const key of ['share_event_id','provider_message_id','email_attempt_started_at','provider_accepted_at'])assert.equal(status[key],undefined);
}
console.log('PASS pre-side-effect correlation, pre-dispatch evidence, optional provider ID, tracking write failures and private status boundaries');
