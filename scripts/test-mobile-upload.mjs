import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {savePickedRecord} from '../apps/mobile/src/lib/record-upload-core.js';
import {HealthVaultClient} from '/tmp/hv-client/client.mjs';
const calls=[];
let offline=false, token='owner-jwt', reads=0;
globalThis.fetch=async(url,init)=>{
  calls.push({url,init});
  if(offline)throw Error('Connection lost');
  return Response.json({success:true,importBatchId:'batch',received:1,failed:0,
    records:[{id:'record',title:'synthetic.txt',kind:'other'}],recordErrors:[]});
};
const client=new HealthVaultClient({supabaseUrl:'https://preview.invalid',supabaseAnonKey:'anon',getAccessToken:async()=>token});
const digest=async value=>createHash('sha256').update(value).digest('hex');
const fileSystem={getInfoAsync:async()=>({exists:true,size:3,isDirectory:false}),readAsStringAsync:async(uri,options)=>{reads++;assert.equal(options.encoding,'base64');return 'YWJj';}};
const input={asset:{uri:'file:///cache/one',name:'synthetic.txt'},kind:'other',ownerId:'owner',fileSystem,digest,client};
const first=await savePickedRecord(input);
assert.equal(first.recordId,'record');assert.equal(first.fileSizeBytes,3);
assert.equal(calls[0].init.headers.Authorization,'Bearer owner-jwt');
assert.match(calls[0].url,/inbound-records\/upload$/);
assert.equal(JSON.parse(calls[0].init.body).records[0].base64,'YWJj');
offline=true;
await assert.rejects(savePickedRecord(input));
offline=false;
await savePickedRecord({...input,asset:{...input.asset,uri:'file:///cache/reselected'}});
assert.equal(calls[0].init.headers['Idempotency-Key'],calls[2].init.headers['Idempotency-Key']);
await savePickedRecord({...input,ownerId:'other-owner'});
assert.notEqual(calls[0].init.headers['Idempotency-Key'],calls[3].init.headers['Idempotency-Key']);
await savePickedRecord({...input,kind:'lab'});
assert.notEqual(calls[0].init.headers['Idempotency-Key'],calls[4].init.headers['Idempotency-Key']);
const beforeReads=reads,beforeCalls=calls.length;
for(const info of [{exists:false},{exists:true,size:0},{exists:true,size:26*1024*1024},{exists:true,size:3,isDirectory:true}]) {
 await assert.rejects(savePickedRecord({...input,fileSystem:{...fileSystem,getInfoAsync:async()=>info}}));
}
assert.equal(reads,beforeReads);assert.equal(calls.length,beforeCalls);
token=null;await assert.rejects(savePickedRecord(input));assert.equal(calls.length,beforeCalls);
for(const base64 of ['', 'not base64!', 'YQ=', '===='])await assert.rejects(client.uploadRecordBase64({base64,fileName:'x',kind:'other',idempotencyKey:'valid-key'}));
assert.equal(calls.length,beforeCalls);
console.log('PASS native URI/base64 transport, stable retry/reselection, owner/category separation, file preflight and auth rejection');
