import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
let signedIn=true,calls=0,fail=false;
let receipt={status:'complete',importJobId:'job',conditions:1,medications:0,allergies:0,immunizations:0,duplicates:0};
const sb={auth:{getUser:async()=>({data:{user:signedIn?{id:'owner'}:null},error:null})},functions:{invoke:async(name,{body})=>{
 calls++;assert.equal(name,'fhir-import');assert.equal(body.confirmed,true);assert.equal(body.importJobId,'job');assert.deepEqual(JSON.parse(JSON.stringify(body.selection)),{condition:[2],medication:[],allergy:[],immunization:[]});assert.equal(JSON.stringify(body).includes('private name'),false);return {data:receipt,error:fail?Error('offline'):null};
}}};
const exports={};
vm.runInNewContext(ts.transpileModule(readFileSync('src/lib/services/medical-import.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:()=>({supabase:sb})});
const input={importJobId:'job',conditions:{unique:[{previewIndex:2,name:'private name'}]},medications:{unique:[]},allergies:{unique:[]},immunizations:{unique:[]}};
signedIn=false;await assert.rejects(exports.importMedicalRecords(input),/Sign in/);assert.equal(calls,0);signedIn=true;
await assert.rejects(exports.importMedicalRecords({...input,importJobId:null}),/Reload/);
const first=await exports.importMedicalRecords(input);assert.equal(first,receipt);
fail=true;await assert.rejects(exports.importMedicalRecords(input),/Retry the same selection/);fail=false;
assert.equal(await exports.importMedicalRecords(input),first);
const validReceipt={...receipt};
for(const invalid of [{status:'pending'},{importJobId:'other-job'},{conditions:-1},{conditions:0.5},{conditions:2},{conditions:0}]) {
 receipt={...validReceipt,...invalid};await assert.rejects(exports.importMedicalRecords(input),/could not be verified/);
}
const before=calls;
await assert.rejects(exports.importMedicalRecords({...input,conditions:{unique:[]}}),/Select/);
await assert.rejects(exports.importMedicalRecords({...input,conditions:{unique:[{previewIndex:-1}]}}),/Reload/);
assert.equal(calls,before);
receipt={...validReceipt,conditions:undefined};await assert.rejects(exports.importMedicalRecords(input),/could not be verified/);
console.log('PASS reviewed import client: authentication, index-only payload, stable retry, missing/invalid receipt refusal');
