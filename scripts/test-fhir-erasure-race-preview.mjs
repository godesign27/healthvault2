// Preview only. Synthetic credentials and previews; no provider fetches, imports or email.
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
const fixtures=[];let org;
const outcomes={previewWon:0,previewRefused:0,refreshWon:0,refreshRefused:0};
try {
 org=randomUUID();ok(await req('/rest/v1/provider_organizations',{method:'POST',body:{id:org,name:'Synthetic FHIR erasure race'}}),201);
 for(const operation of ['preview','refresh'])for(const order of ['block-first','write-first',...Array(6).fill('concurrent')]){
  const f={user:randomUUID(),connection:randomUUID(),request:randomUUID()};
  const password=randomBytes(32).toString('base64url'),email=`hv-fhir-race-${f.user}@example.invalid`;
  const u=ok(await req('/auth/v1/admin/users',{method:'POST',body:{email,password,email_confirm:true}}));f.user=u.id;fixtures.push(f);
  ok(await req('/rest/v1/provider_connections',{method:'POST',body:{id:f.connection,user_id:f.user,provider_organization_id:org,status:'active',connection_method:'direct_provider_connection',fhir_access_token:'synthetic-old',fhir_patient_id:'synthetic-patient'}}),201);
  ok(await req('/rest/v1/account_deletion_requests',{method:'POST',body:{id:f.request,user_id:f.user,confirmed:true,status:'reviewing'}}),201);
  const block=()=>req('/rest/v1/rpc/operator_block_reviewed_account',{method:'POST',body:{p_user_id:f.user,p_request_id:f.request}});
  const write=()=>req(`/rest/v1/rpc/${operation==='preview'?'save_fhir_preview':'refresh_fhir_connection'}`,{method:'POST',body:{p_user_id:f.user,p_connection_id:f.connection,p_expected_token:'synthetic-old',...(operation==='preview'?{p_preview:{},p_counts:{total:0}}:{p_access_token:'synthetic-new',p_refresh_token:null,p_expires_at:null})}});
  let result;
  if(order==='block-first'){ok(await block(),204);result=ok(await write());assert.equal(result,operation==='preview'?null:false);}
  else if(order==='write-first'){result=ok(await write());assert(result);ok(await block(),204);}
  else {const pair=await Promise.all([write(),block()]);result=ok(pair[0]);ok(pair[1],204);}
  outcomes[operation+(result?'Won':'Refused')]++;
  const jobs=ok(await req(`/rest/v1/record_import_jobs?user_id=eq.${f.user}&select=id,status,completed_at`));
  assert.equal(jobs.length,operation==='preview'&&result?1:0);
  if(jobs.length){assert.equal(jobs[0].id,result);assert.equal(jobs[0].status,'preview');assert.equal(jobs[0].completed_at,null);}
  const connection=ok(await req(`/rest/v1/provider_connections?id=eq.${f.connection}&select=fhir_access_token,last_synced_at`))[0];
  assert.equal(connection.fhir_access_token,operation==='refresh'&&result?'synthetic-new':'synthetic-old');assert.equal(connection.last_synced_at,null);
  assert.equal(ok(await req(`/rest/v1/account_erasure_blocks?user_id=eq.${f.user}&select=user_id`)).length,1);
  assert.equal(ok(await write()),operation==='preview'?null:false,'Post-block write was accepted');
  if(order==='block-first'&&operation==='preview'){
   const session=ok(await req('/auth/v1/token?grant_type=password',{method:'POST',token:anon,body:{email,password}}));
   const response=await req('/functions/v1/fhir-sync',{method:'POST',token:session.access_token,body:{connectionId:f.connection}});
   assert.equal(response.status,403,'Blocked authenticated endpoint request allowed');
   ok(await req('/auth/v1/logout?scope=global',{method:'POST',token:session.access_token}),204);
  }
 }
 console.log('PASS block-first, write-first and six concurrent races per operation; post-block writes refused; preview never counts as completed sync');
 console.log('Observed outcomes:',JSON.stringify(outcomes));
} finally {
 for(const f of fixtures){
  for(const table of ['record_import_jobs','provider_connections','account_deletion_requests'])ok(await req(`/rest/v1/${table}?user_id=eq.${f.user}`,{method:'DELETE'}));
  ok(await req(`/auth/v1/admin/users/${f.user}`,{method:'DELETE'}));
  ok(await req(`/rest/v1/account_erasure_blocks?user_id=eq.${f.user}`,{method:'DELETE'}));
 }
 if(org)ok(await req(`/rest/v1/provider_organizations?id=eq.${org}`,{method:'DELETE'}));
 console.log('CLEANUP synthetic preview accounts, connections, jobs and blocks removed');
}
