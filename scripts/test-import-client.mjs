// Bundle packages/api-client/src/index.ts to /tmp/hv-client/client.mjs before running.
import {HealthVaultClient,HealthVaultImportClient,ImportRequestError} from '/tmp/hv-client/client.mjs';
import assert from 'node:assert/strict';
const calls=[];let mode='success';
globalThis.fetch=async(url,init)=>{
 calls.push({url,init});
 if(mode==='network')throw new Error('connection lost');
 if(mode==='gateway')return new Response('gateway error',{status:502});
 if(mode==='malformed')return Response.json({success:true,importBatchId:'batch',received:1,failed:0,records:[{}],recordErrors:[]});
 if(mode==='conflict')return Response.json({error:'Key conflict'},{status:409});
 return Response.json({success:mode==='success',importBatchId:'batch',received:mode==='success'?1:0,failed:mode==='success'?0:1,
 records:mode==='success'?[{id:'record',title:'Image',kind:'other'}]:[],recordErrors:mode==='success'?[]:[{index:0,code:'reconciliation_required'}]},
 {status:mode==='success'?200:422});
};
const key='persisted-key';
const client=new HealthVaultClient({supabaseUrl:'https://fixture.invalid',supabaseAnonKey:'anon',getAccessToken:async()=> 'jwt'});
const params={file:new Blob([new Uint8Array([1,2,3])],{type:'image/png'}),fileName:'image.png',kind:'other',idempotencyKey:key};
const record=await client.uploadRecord(params);assert.equal(record.recordId,'record');assert.equal(record.previewUrl,null);assert.equal(record.fileAccess,'authenticated');
assert.equal(calls[0].url,'https://fixture.invalid/functions/v1/inbound-records/upload');
assert.equal(calls[0].init.headers.Authorization,'Bearer jwt');assert.equal(calls[0].init.headers['Idempotency-Key'],key);
assert.equal(JSON.parse(calls[0].init.body).records[0].base64,'AQID');
mode='network';await assert.rejects(client.uploadRecord(params),e=>e instanceof ImportRequestError&&e.retryKey===key&&e.outcome==='unknown');
mode='success';await client.uploadRecord(params);assert.equal(calls.at(-1).init.body,calls[0].init.body);assert.equal(calls.at(-1).init.headers['Idempotency-Key'],key);
mode='partial';await assert.rejects(client.uploadRecord(params),e=>e.receipt?.recordErrors[0].code==='reconciliation_required');
mode='gateway';await assert.rejects(client.uploadRecord(params),e=>e.outcome==='unknown');
mode='malformed';await assert.rejects(client.uploadRecord(params),e=>e.outcome==='unknown'&&e.retryKey===key);
mode='conflict';await assert.rejects(client.uploadRecord(params),e=>e.status===409&&e.outcome==='rejected');
const before=calls.length;await assert.rejects(client.uploadRecord({...params,idempotencyKey:''}));assert.equal(calls.length,before);
const unsigned=new HealthVaultClient({supabaseUrl:'https://fixture.invalid',supabaseAnonKey:'anon',getAccessToken:async()=>null});
await assert.rejects(unsigned.uploadRecord(params),e=>e.status===401);assert.equal(calls.length,before);
mode='partial';const integration=new HealthVaultImportClient({supabaseUrl:'https://fixture.invalid',supabaseAnonKey:'anon',getApiKey:async()=> 'integration'});
const partial=await integration.importRecords({records:[{title:'fixture'}]},key);assert.equal(partial.success,false);assert.equal(partial.failed,1);
assert.equal(calls.at(-1).url,'https://fixture.invalid/functions/v1/inbound-records');assert.equal(calls.at(-1).init.headers.Authorization,'Bearer integration');
console.log('PASS client routing/auth, stable retries, partial receipts, ambiguous outcomes, missing-key/sign-in preflight');
