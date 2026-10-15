// Preview-only mapping check against public SMART synthetic data with interactive demo OAuth; no import confirmation.
import {readFileSync,statSync,writeFileSync,unlinkSync,existsSync} from 'node:fs';
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
 org=randomUUID();const sandbox='https://launch.smarthealthit.org/v/r4/sim/WzMsIiIsIiIsIkFVVE8iLDAsMCwwLCIiLCIiLCIiLCIiLCIiLCIiLCIiLDAsMSwiIl0';ok(await req('/rest/v1/provider_organizations',{method:'POST',body:{id:org,name:'Public sandbox mapping acceptance',supports_direct_connection:true,smart_scopes:'launch/patient patient/*.read openid fhirUser',fhir_endpoint_url:sandbox+'/fhir',authorization_endpoint:sandbox+'/auth/authorize',token_endpoint:sandbox+'/auth/token'}}),201);
 const email=`hv-map-${randomUUID()}@example.invalid`,password=randomBytes(32).toString('base64url');
 const u=ok(await req('/auth/v1/admin/users',{method:'POST',body:{email,password,email_confirm:true}}));users.push(u);
 u.token=ok(await req('/auth/v1/token?grant_type=password',{method:'POST',token:anon,body:{email,password}})).access_token;
 const started=ok(await req('/functions/v1/fhir-oauth-start',{method:'POST',token:u.token,body:{providerOrganizationId:org,connectionMethod:'direct_provider_connection'}}));
 const connection=started.connectionId;assert.ok(connection);assert.ok(started.launchUrl);
 const launchFile='/tmp/hv-mapping-launch.json';writeFileSync(launchFile,JSON.stringify({url:started.launchUrl}),{mode:0o600});
 console.log('Waiting for public sandbox demo authorization');
 let active=false;
 for(let i=0;i<90;i++){const rows=ok(await req(`/rest/v1/provider_connections?id=eq.${connection}&select=status`));if(rows[0]?.status==='active'){active=true;break;}await new Promise(r=>setTimeout(r,2000));}
 assert.equal(active,true,'Sandbox authorization did not complete');
 const result=ok(await req('/functions/v1/fhir-sync',{method:'POST',token:u.token,body:{connectionId:connection}}));
 assert.equal(result.source,'fhir');assert.ok(result.importJobId);
 assert.deepEqual(result.itemsByType.medication.map(m=>m.name),['Medication','Medication']);
 const jobs=ok(await req(`/rest/v1/record_import_jobs?id=eq.${result.importJobId}&select=preview_data`));
 assert.deepEqual(jobs[0].preview_data.medication,result.itemsByType.medication);
 assert.equal(ok(await req(`/rest/v1/medications?user_id=eq.${u.id}&select=id`)).length,0);
 console.log('PASS deployed authenticated preview against public sandbox: source generic labels preserved, preview persisted, no medication writes');
} finally {
 for(const u of users){
  for(const table of ['conditions','medications','allergies','immunizations','health_records','fhir_import_items','record_import_jobs','provider_connections','account_deletion_requests'])ok(await req(`/rest/v1/${table}?user_id=eq.${u.id}`,{method:'DELETE'}));
  if(u.token)ok(await req('/auth/v1/logout?scope=global',{method:'POST',token:u.token}),204);
  ok(await req(`/auth/v1/admin/users/${u.id}`,{method:'DELETE'}));
  ok(await req(`/rest/v1/account_erasure_blocks?user_id=eq.${u.id}`,{method:'DELETE'}));
 }
 if(org)ok(await req(`/rest/v1/provider_organizations?id=eq.${org}`,{method:'DELETE'}));
 if(existsSync('/tmp/hv-mapping-launch.json'))unlinkSync('/tmp/hv-mapping-launch.json');
 console.log('CLEANUP synthetic mapping records, accounts and provider removed');
}
