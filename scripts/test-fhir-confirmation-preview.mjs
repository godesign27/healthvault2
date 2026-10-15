// Preview-only synthetic clinical import acceptance. Never uses real provider data.
import {readFileSync,statSync} from 'node:fs';
import {randomUUID,randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
const project='roeudwddxvniazwufdqf',base=`https://${project}.supabase.co`;
const keyFile=process.env.HV_PREVIEW_KEYS_FILE;assert(keyFile);assert.equal(statSync(keyFile).mode&0o077,0);
const keys=JSON.parse(readFileSync(keyFile,'utf8'));
const admin=keys.find(k=>k.name==='service_role')?.api_key,anon=keys.find(k=>k.name==='anon')?.api_key;
for(const key of [admin,anon])assert.equal(JSON.parse(Buffer.from(key.split('.')[1],'base64url')).ref,project);
async function req(path,{method='GET',body,token=admin}={}){
 const r=await fetch(base+path,{method,headers:{apikey:anon,Authorization:`Bearer ${token}`,'Content-Type':'application/json',Prefer:'return=representation'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(30000)});
 return {status:r.status,data:await r.json().catch(()=>null)};
}
function ok(r,status=200){assert.equal(r.status,status,`Unexpected HTTP ${r.status}`);return r.data;}
const users=[];let org;
try {
 org=randomUUID();ok(await req('/rest/v1/provider_organizations',{method:'POST',body:{id:org,name:'Synthetic confirmation acceptance'}}),201);
 for(let i=0;i<2;i++){
  const email=`hv-confirm-http-${randomUUID()}@example.invalid`,password=randomBytes(32).toString('base64url');
  const u=ok(await req('/auth/v1/admin/users',{method:'POST',body:{email,password,email_confirm:true}}));users.push(u);
  u.token=ok(await req('/auth/v1/token?grant_type=password',{method:'POST',token:anon,body:{email,password}})).access_token;
 }
 const [owner,other]=users,c=randomUUID();
 ok(await req('/rest/v1/provider_connections',{method:'POST',body:{id:c,user_id:owner.id,provider_organization_id:org,status:'active',connection_method:'direct_provider_connection',fhir_access_token:'synthetic',fhir_patient_id:'synthetic'}}),201);
 const preview={condition:[{name:'Synthetic HTTP condition',date:'2020-01-01',status:'Active'}],medication:[{name:'Synthetic HTTP medication'}],allergy:[{name:'Synthetic HTTP allergen'}],immunization:[{name:'Synthetic HTTP vaccine',date:'2020-01-01'}]};
 const selection={condition:[0],medication:[0],allergy:[0],immunization:[0]};
 const seed=async p=>ok(await req('/rest/v1/rpc/save_fhir_preview',{method:'POST',body:{p_user_id:owner.id,p_connection_id:c,p_expected_token:'synthetic',p_preview:p,p_counts:{}}}));
 const confirm=(job,selected=selection,token=owner.token,confirmed=true)=>req('/functions/v1/fhir-import',{method:'POST',token,body:{importJobId:job,selection:selected,confirmed}});
 const job=await seed(preview);
 ok(await confirm(job,selection,anon),401);ok(await confirm(job,selection,other.token),409);ok(await confirm(job,selection,owner.token,false),400);
 const responses=await Promise.all(Array.from({length:6},()=>confirm(job)));
 const receipt=ok(responses[0]);for(const response of responses)assert.deepEqual(ok(response),receipt);
 assert.equal(receipt.conditions,1);assert.equal(receipt.medications,1);assert.equal(receipt.allergies,1);assert.equal(receipt.immunizations,1);assert.equal(receipt.status,'complete');
 // Ignore the original application response and recover by repeating the request.
 assert.deepEqual(ok(await confirm(job)),receipt);
 ok(await confirm(job,{condition:[0]}),409);
 for(const table of ['conditions','medications','allergies','immunizations','health_records'])assert.equal(ok(await req(`/rest/v1/${table}?user_id=eq.${owner.id}&select=id`)).length,1,`${table} duplicated`);
 const next=await seed(preview);const duplicateReceipt=ok(await confirm(next));assert.equal(duplicateReceipt.duplicates,4);assert.equal(duplicateReceipt.conditions,0);
 const broken=await seed({condition:[{name:'Must roll back',date:'2020-01-01'},{name:'Invalid date',date:'bad-date'}]});
 ok(await confirm(broken,{condition:[0,1]}),409);
 assert.equal(ok(await req(`/rest/v1/conditions?user_id=eq.${owner.id}&select=id`)).length,1,'Partial import persisted');
 assert.equal(ok(await req(`/rest/v1/fhir_import_items?user_id=eq.${owner.id}&select=record_id`)).length,4,'Partial dedup marker persisted');
 const request=randomUUID();ok(await req('/rest/v1/account_deletion_requests',{method:'POST',body:{id:request,user_id:owner.id,confirmed:true,status:'reviewing'}}),201);
 ok(await req('/rest/v1/rpc/operator_block_reviewed_account',{method:'POST',body:{p_user_id:owner.id,p_request_id:request}}),204);
 ok(await confirm(job),403);
 console.log('PASS six concurrent authenticated confirmations, ignored-response retry receipt, foreign/anonymous/confirmation refusal, changed-selection refusal, repeated-preview dedup, atomic failure and account-block refusal');
} finally {
 for(const u of users){
  for(const table of ['conditions','medications','allergies','immunizations','health_records','fhir_import_items','record_import_jobs','provider_connections','account_deletion_requests'])ok(await req(`/rest/v1/${table}?user_id=eq.${u.id}`,{method:'DELETE'}));
  if(u.token)ok(await req('/auth/v1/logout?scope=global',{method:'POST',token:u.token}),204);
  ok(await req(`/auth/v1/admin/users/${u.id}`,{method:'DELETE'}));
  ok(await req(`/rest/v1/account_erasure_blocks?user_id=eq.${u.id}`,{method:'DELETE'}));
 }
 if(org)ok(await req(`/rest/v1/provider_organizations?id=eq.${org}`,{method:'DELETE'}));
 console.log('CLEANUP synthetic confirmation records, accounts and provider removed');
}
