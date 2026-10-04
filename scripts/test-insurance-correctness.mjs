import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {z} from 'zod';
const compile=(path,require=()=>{throw Error('Unexpected import')})=>{const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require,Date});return exports};
const status=compile('packages/api-client/src/insurance-status.ts');
for(const s of ['connected','verified'])assert.equal(status.insuranceStatus(s).label,'Saved');
assert.equal(status.insuranceStatus('verifying').label,'Not verified');
assert.equal(status.insuranceStatus('unknown').label,'Needs review');
for(const tz of ['America/Denver','Pacific/Auckland']){
 process.env.TZ=tz;
 const now=new Date(2026,9,3,23);
 assert.equal(status.insuranceDate('2026-10-03').getDate(),3);
 assert.equal(status.insuranceDate('2026-02-30'),null);
 assert.equal(status.coverageEndState('2026-10-02',now),'expired');
 assert.equal(status.coverageEndState('2026-10-03',now),'expiring');
 assert.equal(status.coverageEndState('2026-11-02',now),'expiring');
 assert.equal(status.coverageEndState('2026-11-03',now),null);
 assert.equal(status.coverageEndState('bad',now),null);
}
const calls=[];const id='ea912451-c759-4944-9f89-21c067122012';let result={data:id,error:null};
const sb={from(){throw Error('Unexpected database write')},rpc:async(name,args)=>{calls.push({name,args});return result}};
const legacy=compile('src/lib/ai-tools/insurance.ts',name=>name==='zod'?{z}:name==='../supabase'?{supabase:sb}:{toolSuccess:(data,message)=>({success:true,data,message}),toolError:error=>({success:false,error})});
const edge=compile('supabase/functions/ai-health-assistant/tools.ts').TOOL_HANDLERS;
for(const handler of [args=>legacy.verifyInsurance(args,'owner'),args=>edge.verifyInsurance.execute(args,'owner',sb)]){
 const r=await handler({coverageId:id});assert.equal(r.success,false);assert.match(r.error,/not available/);assert.equal(calls.length,0);
}
for(const handler of [args=>legacy.setPrimaryInsurance(args,'owner'),args=>edge.setPrimaryInsurance.execute(args,'owner',sb)]){
 for(const confirmed of [false,'false',undefined]){assert.equal((await handler({coverageId:id,confirmed})).success,false)}
 assert.equal(calls.length,0);
 result={data:id,error:null};assert.equal((await handler({coverageId:id,confirmed:true})).success,true);
 assert.equal(calls[0].name,'set_primary_insurance');assert.equal(calls[0].args.p_coverage_id,id);
 for(const response of [{data:null,error:null},{data:null,error:{message:'Denied'}}]){result=response;assert.equal((await handler({coverageId:id,confirmed:true})).success,false)}
 calls.length=0;
}
console.log('PASS insurance status honesty, calendar boundaries in two zones, disabled verification and confirmed atomic RPC receipts');
