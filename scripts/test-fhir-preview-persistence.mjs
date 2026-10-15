import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
let handler,job={data:'preview',error:null},refresh={data:true,error:null},expired=false,blocked=false,fetches=0;
class ImportAccessError extends Error {constructor(status,message){super(message);this.status=status;}}
const owner='00000000-0000-4000-8000-000000000001',connectionId='00000000-0000-4000-8000-000000000002';
const filters=[];
const sb={auth:{getUser:async()=>({data:{user:{id:owner}},error:null})},
 rpc:async(name,args)=>{assert.equal(args.p_user_id,owner);assert.equal(args.p_connection_id,connectionId);if(name==='refresh_fhir_connection')return refresh;assert.equal(name,'save_fhir_preview');return job;},
 from(table){return {select(){return this;},eq(k,v){filters.push([k,v]);return this;},
 maybeSingle:async()=>({data:table==='provider_connections'?{id:connectionId,status:'active',fhir_patient_id:'synthetic',fhir_access_token:'test',fhir_refresh_token:'test-refresh',token_expires_at:expired?'2000-01-01':null}:{name:'Sandbox',fhir_endpoint_url:'https://example.invalid/fhir',token_endpoint:'https://example.invalid/token'},error:null})};}
};
const source=ts.transpileModule(readFileSync('supabase/functions/fhir-sync/index.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInNewContext(source,{exports:{},Request,Response,URL,console,Deno:{env:{get:()=> 'test'},serve:fn=>{handler=fn;}},require(name){
 if(name.includes('edge-runtime'))return {};
 if(name.includes('supabase-js'))return {createClient:()=>sb};
 if(name.includes('inbound-records/access'))return {ImportAccessError,requireActiveAccount:async()=>{if(blocked)throw new ImportAccessError(403,'Account unavailable.');}};
 if(name.includes('smart-oauth'))return {refreshAccessToken:async()=>({access_token:'refreshed'}),tokenExpiresAt:()=>null};
 if(name.includes('fhir-resources'))return {fetchPatientResources:async()=>{fetches++;return [];},bundleToPreviewItems:()=>[]};
 throw Error(`Unexpected dependency ${name}`);
}});
async function call(body=JSON.stringify({connectionId})){return handler(new Request('https://example.invalid',{method:'POST',headers:{Authorization:'Bearer test','Content-Type':'application/json'},body}));}
assert.equal((await call('null')).status,400);assert.equal((await call('{')).status,400);
blocked=true;assert.equal((await call()).status,403);assert.equal(fetches,0);blocked=false;
job={data:null,error:{message:'private database detail'}};let res=await call();assert.equal(res.status,500);assert.equal((await res.text()).includes('private'),false);
job={data:null,error:null};res=await call();assert.equal(res.status,409);assert.equal((await res.json()).importJobId,undefined);
job={data:'preview',error:null};res=await call();assert.equal(res.status,200);assert.equal((await res.json()).importJobId,'preview');assert(filters.some(([k,v])=>k==='user_id'&&v===owner));
const previousFetches=fetches;expired=true;refresh={data:false,error:null};assert.equal((await call()).status,409);assert.equal(fetches,previousFetches);
refresh={data:null,error:{message:'private provider detail'}};res=await call();assert.equal(res.status,500);assert.equal((await res.text()).includes('private'),false);assert.equal(fetches,previousFetches);
console.log('PASS full preview handler: malformed input, blocked account, owner filter, persistence failure/refusal, saved receipt and refresh refusal');
