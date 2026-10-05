import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let calls, mode, payload;
const client={from(table){
 const call={table,filters:[],write:false};calls.push(call);
 const q={select(){return q;},eq(k,v){call.filters.push([k,v]);return q;},update(value){call.write=true;payload=value;return q;},async maybeSingle(){
  if(table==='patient_profiles')return mode==='missing-profile'?{data:null}:mode==='profile-error'?{error:{message:'lookup failed'}}:{data:{id:'patient'}};
  if(call.write)return mode==='wrong-receipt'?{data:{id:'other-form'}}:mode==='missing-update'?{data:null}:mode==='update-error'?{error:{message:'write failed'}}:{data:{id:'form'}};
  return mode==='missing-form'?{data:null}:{data:{answers_json:{retained:'yes',edited:'old'},template_id:'registration'}};
 }};return q;
}};
function load(file){const m={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8').replaceAll('import.meta.env', '({})'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(name=>{
 if(name==='../supabase/server')return {createSupabaseServerClient:()=>client};
 if(name==='../supabase')return {supabase:client};
 if(name==='../forms/share-api')return {};
 if(name==='./types')return {toolSuccess:data=>({success:true,data}),toolError:error=>({success:false,error})};
 return require(name);
},m,m.exports);return m.exports.saveFormAnswers;}
for(const [file,input] of [
 ['src/lib/tools/saveFormAnswers.ts',{userId:'owner',formId:'form',values:{edited:'new'}}],
 ['src/lib/ai-tools/forms.ts',{formId:'form',templateId:'registration',answers:{edited:'new'}}],
]){
 const save=load(file);
 for(const scenario of ['ok','missing-profile','profile-error','missing-form','missing-update','wrong-receipt','update-error']){
  calls=[];mode=scenario;payload=null;
  const result=await save(input,'owner');
  assert.equal(result.success,scenario==='ok',`${file}: ${scenario}`);
  assert.deepEqual(calls[0].filters,[['user_id','owner']]);
  for(const call of calls.filter(c=>c.table==='form_responses'))assert.deepEqual(call.filters,[['id','form'],['patient_id','patient']]);
  if(scenario==='ok'){assert.deepEqual(payload.answers_json,{retained:'yes',edited:'new'});assert.equal(payload.signed_at,null);}
  if(['missing-profile','profile-error','missing-form'].includes(scenario))assert.equal(payload,null);
 }
 calls=[];mode='ok';await save({...input,markComplete:true},'owner');assert.equal(payload.status,'complete');assert(Number.isFinite(Date.parse(payload.signed_at)));
}
console.log('PASS both form save helpers: owner scope, absent rows, failures, answer merge and signature state');
