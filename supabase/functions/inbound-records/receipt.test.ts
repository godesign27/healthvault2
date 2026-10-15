import { validRetryKey, batchFingerprint } from './receipt.ts';
const assert=(v:unknown)=>{if(!v)throw new Error('Assertion failed');};
Deno.test('retry keys are required, bounded, and free of whitespace/control characters',()=>{
 for(const key of [null,'','a b','bad\nkey','a'.repeat(129)])assert(!validRetryKey(key));
 assert(validRetryKey('batch-1:provider_2.3'));
});
Deno.test('batch identity ignores object key order but binds values, provider and array order',async()=>{
 const a=await batchFingerprint([{title:'A',fhirRef:{id:'1',type:'Lab'}},{title:'B'}],'Provider');
 assert(a===await batchFingerprint([{fhirRef:{type:'Lab',id:'1'},title:'A'},{title:'B'}],'Provider'));
 for(const candidate of [await batchFingerprint([{title:'B'},{title:'A',fhirRef:{id:'1',type:'Lab'}}],'Provider'),
 await batchFingerprint([{title:'A',fhirRef:{id:'1',type:'Lab'}},{title:'C'}],'Provider'),
 await batchFingerprint([{title:'A',fhirRef:{id:'1',type:'Lab'}},{title:'B'}],'Other')])assert(a!==candidate);
});
Deno.test('deep metadata fails before reservation',async()=>{
 let value:unknown=null;for(let i=0;i<70;i++)value={nested:value};
 let failed=false;try{await batchFingerprint([value],'Provider');}catch{failed=true;}assert(failed);
});

Deno.test('personal uploads and integration imports have distinct payload identities',async()=>{
 const records=[{title:'A'}];
 assert(await batchFingerprint(records,'Personal upload')!==await batchFingerprint(records,'Personal upload',true));
});
