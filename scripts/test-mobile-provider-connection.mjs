import assert from 'node:assert/strict';
import {providerSearchPattern,startNativeProviderConnection,checkNativeProviderConnection,providerConnectionStatusMessage} from '../apps/mobile/src/lib/provider-connection.js';
assert.equal(providerSearchPattern(' Clinic '),'%Clinic%');
assert.equal(providerSearchPattern('a%_\\'),'%a\\%\\_\\\\%');
assert.throws(()=>providerSearchPattern('x'));
let owner='owner',calls=0,opened=[],result={status:'authorizing',connectionId:'connection',launchUrl:'https://portal.example/authorize?state=opaque'},error=null,existing=null,pending=null;
const filters=[];
const sb={
 auth:{getSession:async()=>({data:{session:owner?{user:{id:owner}}:null}})},
 functions:{invoke:async(name,{body})=>{calls++;assert.equal(name,'fhir-oauth-start');assert.equal(body.providerOrganizationId,'org');assert.equal('userId' in body,false);return {data:result,error};}},
 from:()=>({select:(fields)=>{let status;return {
  eq(k,v){if(fields==='status')filters.push([k,v]);if(k==='status')status=v;return this;},
  order(){return this;},limit(){return this;},
  maybeSingle:async()=>({data:fields==='id'?(status==='active'?existing:pending):{status:'pending'},error:null}),
 };}}),
};
const input={org:{id:'org',supports_direct_connection:true},supabase:sb,openURL:async url=>opened.push(url)};
const receipt=await startNativeProviderConnection(input);
assert.equal(receipt.ownerId,'owner');assert.equal(opened.length,1);
assert.equal(await checkNativeProviderConnection({receipt,supabase:sb}),'pending');assert.deepEqual(filters,[['id','connection'],['user_id','owner']]);
owner='other';await assert.rejects(checkNativeProviderConnection({receipt,supabase:sb}),/account changed/);
existing={id:'already-connected'};const reused=await startNativeProviderConnection(input);assert.equal(reused.existing,true);assert.equal(calls,1);existing=null;
owner=null;await assert.rejects(startNativeProviderConnection(input),/Sign in/);assert.equal(calls,1);
owner='owner';await assert.rejects(startNativeProviderConnection({...input,org:{id:'org'}}),/does not support/);
for(const launchUrl of ['javascript:alert(1)','http://portal.example','https://user:pass@portal.example','broken']){result={...result,launchUrl};await assert.rejects(startNativeProviderConnection(input));}
result={...result,launchUrl:'https://portal.example'};
await assert.rejects(startNativeProviderConnection({...input,isCurrent:()=>false}),/closed/);
error=Error('unavailable');await assert.rejects(startNativeProviderConnection(input),/Unable to start/);assert.equal(opened.length,1);
console.log('PASS provider search escaping, authentication, server result, safe launch, closed screen and owner-scoped status checks');

error=null;pending={id:'pending-from-previous-run'};
const before={calls,opens:opened.length};
const recovered=await startNativeProviderConnection(input);
assert.equal(recovered.id,pending.id);assert.equal(recovered.recovered,true);
assert.equal(calls,before.calls);assert.equal(opened.length,before.opens);
// No in-memory receipt is supplied: server state recovers after a fresh screen/app start.
const recoveredAgain=await startNativeProviderConnection({...input});
assert.equal(recoveredAgain.id,recovered.id);
await startNativeProviderConnection({...input,restart:true});
assert.equal(calls,before.calls+1);assert.equal(opened.length,before.opens+1);
existing={id:'now-active'};
const active=await startNativeProviderConnection({...input,restart:true});
assert.equal(active.id,'now-active');assert.equal(calls,before.calls+1);
assert.match(providerConnectionStatusMessage('pending'),/still pending/);
assert.match(providerConnectionStatusMessage('revoked'),/no longer active/);
assert.match(providerConnectionStatusMessage('active'),/Provider connected/);
console.log('PASS pending connection recovery without local state, explicit restart, active reuse and truthful status messages');
