import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}};
let slots=[],cursor=0,effects=[];
const same=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
const react={
 useState(initial){const i=cursor++;slots[i]??={value:initial};return [slots[i].value,v=>{slots[i].value=v}]},
 useRef(initial){const i=cursor++;return slots[i]??={current:initial}},
 useCallback(fn,deps){const i=cursor++;if(!same(slots[i]?.deps,deps))slots[i]={deps,value:fn};return slots[i].value},
 useEffect(fn,deps){const i=cursor++;if(!same(slots[i]?.deps,deps)){slots[i]?.cleanup?.();slots[i]={deps};effects.push(()=>{slots[i].cleanup=fn()})}},
};
let authCallback,owner='owner',authPending=null,writePending=null,response={data:{id:'plan'},error:null};
let payload;let writes=0,refreshes=0,clears=0;const feedback=[],filters=[];
const client={auth:{getUser:()=>authPending?.promise??Promise.resolve({data:{user:{id:owner}}}),onAuthStateChange:fn=>{authCallback=fn;return {data:{subscription:{unsubscribe(){}}}}}},
 rpc:()=>{writes++;return writePending?.promise??Promise.resolve({...response,data:response.data?.id??null})},
 from(table){assert.equal(table,'insurance_coverages');writes++;const q={eq:(...a)=>{filters.push(a);return q},select:()=>q,single:()=>writePending?.promise??Promise.resolve(response)};return {delete:()=>q,update:value=>{payload=value;return q}}},
};
const status={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('packages/api-client/src/insurance-status.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:status});
const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('packages/api-client/src/useInsuranceMutation.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:name=>name==='react'?react:status});
const render=()=>{cursor=0;const hook=exports.useInsuranceMutation(client,(...a)=>feedback.push(a),async()=>{refreshes++},()=>{clears++;feedback.length=0});effects.splice(0).forEach(fn=>fn());return hook};
render();
// Two taps before auth resolves must still produce only one write.
authPending=deferred();const first=render().run('owner','plan','primary');
assert.equal(render().busy,true);assert.equal(await render().run('owner','plan','primary'),false);assert.equal(writes,0);
authPending.resolve({data:{user:{id:'owner'}}});assert.equal(await first,true);authPending=null;
assert.equal(writes,1);assert.equal(refreshes,1);assert.equal(render().busy,false);
// Each non-RPC mutation requires owner/id filters and a matching returned row.
for(const action of ['remove','stop','resume']){filters.length=0;assert.equal(await render().run('owner','plan',action),true);assert.deepEqual(filters,[['id','plan'],['user_id','owner']]);}
for(const data of [null,{id:'wrong'}]){response={data,error:null};assert.equal(await render().run('owner','plan','remove'),false);assert.equal(feedback.at(-1)[1],'error');}
response={data:{id:'plan'},error:null};
const writesBeforeBlank=writes;assert.equal(await render().run('owner','plan','memberId','  '),false);assert.equal(writes,writesBeforeBlank);
assert.equal(await render().run('owner','plan','memberId',' ID-1234 '),true);assert.equal(payload.member_id,'ID-1234');assert.equal(payload.member_id_hash,'');
// A stale confirmation cannot write to a newly signed-in account.
owner='other';const count=writes;assert.equal(await render().run('owner','plan','remove'),false);assert.equal(writes,count);owner='owner';
// Account change while authentication is pending prevents the write entirely.
authPending=deferred();const before=render().run('owner','plan','stop');authCallback();authPending.resolve({data:{user:{id:'owner'}}});await before;authPending=null;assert.equal(writes,count);assert.equal(feedback.length,0);
// A dispatched write may finish, but must not show an old account's receipt or refresh.
writePending=deferred();const pending=render().run('owner','plan','primary');await new Promise(setImmediate);const oldRefreshes=refreshes;authCallback();writePending.resolve({data:'plan',error:null});assert.equal(await pending,false);writePending=null;assert.equal(feedback.length,0);assert.equal(refreshes,oldRefreshes);assert.equal(render().busy,false);assert.ok(clears>=2);
// Unmount invalidates pending work and prevents new writes from stale callbacks.
writePending=deferred();const unmount=render().run('owner','plan','primary');await new Promise(setImmediate);slots.forEach(s=>s?.cleanup?.());writePending.resolve({data:'plan',error:null});assert.equal(await unmount,false);assert.equal(feedback.length,0);assert.equal(await render().run('owner','plan','remove'),false);
console.log('PASS insurance mutations: duplicate taps, owner checks, receipt matching, account changes before/after dispatch and unmount');
