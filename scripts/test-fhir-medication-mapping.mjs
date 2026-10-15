import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports={};let requests=[];
const source=ts.transpileModule(readFileSync('supabase/functions/_shared/fhir-resources.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInNewContext(source,{exports,URL,fetch:async(url,options)=>{requests.push({url,options});return {ok:true,json:async()=>({entry:[]})};}});
const statement=(fields,id='s')=>({fullUrl:`https://provider.invalid/fhir/MedicationStatement/${id}`,resource:{resourceType:'MedicationStatement',id,...fields}});
const medication=(id,name,fullUrl=`https://provider.invalid/fhir/Medication/${id}`)=>({fullUrl,resource:{resourceType:'Medication',id,code:{text:name}}});
function names(entry){return Array.from(exports.bundleToPreviewItems({conditions:{},allergies:{},immunizations:{},medications:{entry}},'Test provider'),i=>i.name);}
assert.deepEqual(names([statement({medicationCodeableConcept:{text:'Original supplied name'},medicationReference:{display:'Other'}})]),['Original supplied name']);
assert.deepEqual(names([statement({medicationCodeableConcept:{text:' ',coding:[{}, {display:'Coded name'}]}})]),['Coded name']);
assert.deepEqual(names([statement({medicationReference:{reference:'#m'},contained:[medication('m','Contained name').resource]}),statement({medicationReference:{reference:'#m'}},'other')]),['Contained name','Medication']);
assert.deepEqual(names([statement({medicationReference:{reference:'Medication/m'}}),medication('m','Included name')]),['Included name']);
assert.deepEqual(names([statement({medicationReference:{reference:'urn:uuid:m'}}),medication('m','URN name','urn:uuid:m')]),['URN name']);
assert.deepEqual(names([statement({medicationReference:{reference:'https://provider.invalid/fhir/Medication/m'}}),medication('m','Absolute name')]),['Absolute name']);
assert.deepEqual(names([statement({medicationReference:{reference:'https://external.invalid/Medication/m',display:'Source display'}}),medication('m','Wrong local name')]),['Source display']);
assert.deepEqual(names([statement({medicationReference:{reference:'Medication/m'}}),medication('m','Wrong host','https://other.invalid/fhir/Medication/m')]),['Medication']);
assert.deepEqual(names([statement({medicationReference:{reference:'Medication/m'}}),{resource:medication('m','No fullUrl name').resource}]),['No fullUrl name']);
assert.deepEqual(names([{resource:{resourceType:'OperationOutcome'}},medication('m','Not a statement')]),[]);
// The live demo patient supplies these generic concepts, with no hidden reference.
assert.deepEqual(names([statement({medicationCodeableConcept:{text:'Medication'},status:'active'}),statement({medicationCodeableConcept:{text:'Medication'},status:'on-hold'},'s2')]),['Medication','Medication']);
assert.equal(requests.length,0,'Reference mapping must never fetch arbitrary URLs');
await exports.fetchPatientResources('https://provider.invalid/fhir','synthetic-token','demo-patient');
assert.equal(requests.length,4);
for(const r of requests){const url=new URL(r.url);assert.equal(url.searchParams.get('patient'),'demo-patient');assert.equal(r.options.headers.Authorization,'Bearer synthetic-token');assert.equal(url.searchParams.get('_include'),url.pathname.endsWith('/MedicationStatement')?'MedicationStatement:medication':null);}
console.log('PASS medication concepts, contained/included/absolute/URN references, source fallback, cross-host isolation, no extra imports or reference fetches, patient-scoped include');
