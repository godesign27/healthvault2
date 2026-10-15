import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
function load(path){const source=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;const m={exports:{}};new Function('require','module','exports',source)(require,m,m.exports);return m.exports;}
const network=load('src/schemas/network.ts'),insurance=load('src/schemas/insurance.ts');
for(const schema of [network.AddProviderInputZ,network.AddPharmacyInputZ]){
 const r=schema.safeParse({name:''});assert.equal(r.success,false);assert.equal(r.error.issues[0].path[0],'name');
 assert.equal(schema.safeParse({name:'Synthetic'}).success,true);
}
const id='a1111111-1111-4111-8111-111111111111';
assert.equal(insurance.AuditEventZ.safeParse({userId:id,entity:'coverage',action:'create',metadata:{source:'synthetic',nested:{value:1}}}).success,true);
assert.equal(insurance.CoverageZ.shape.rawFhir.safeParse({resourceType:'Coverage',nested:{value:1}}).success,true);
console.log('PASS Zod 4 invalid provider/pharmacy feedback and nonempty insurance metadata records');
