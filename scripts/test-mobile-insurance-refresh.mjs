import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return{promise,resolve,reject}};
let slots=[],cursor=0,effects=[];const requests=[];
const same=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
const react={
 useState(initial){const i=cursor++;slots[i]??={value:initial};return[slots[i].value,v=>{slots[i].value=v}]},
 useRef(initial){const i=cursor++;return slots[i]??={current:initial}},
 useCallback(fn,deps){const i=cursor++;if(!same(slots[i]?.deps,deps))slots[i]={deps,value:fn};return slots[i].value},
 useEffect(fn,deps){const i=cursor++;if(!same(slots[i]?.deps,deps)){slots[i]?.cleanup?.();slots[i]={deps};effects.push(()=>{slots[i].cleanup=fn()})}},
};
let authCallback;
const exports={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('apps/mobile/src/hooks/useInsuranceData.js','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:n=>n==='react'?react:n.includes('insuranceData')?{loadInsurance:()=>{const d=deferred();requests.push(d);return d.promise}}:{supabase:{auth:{onAuthStateChange:callback=>{authCallback=callback;return {data:{subscription:{unsubscribe(){}}}}}}}}});
const render=()=>{cursor=0;const state=exports.useInsuranceData();effects.splice(0).forEach(fn=>fn());return state};
render();const refresh=render().refetch();
requests[1].resolve({coverages:[{id:'new'}],userId:'owner'});await refresh;
requests[0].resolve({coverages:[{id:'old'}],userId:'owner'});await new Promise(setImmediate);
assert.equal(render().coverages[0].id,'new');
const failure=render().refetch();assert.equal(render().coverages.length,0);requests[2].reject(Error('Offline'));await failure;assert.match(render().error,/could not be loaded/);assert.equal(render().loading,false);
authCallback();assert.equal(render().coverages.length,0);await new Promise(setImmediate);requests[3].resolve({coverages:[],userId:'new-owner'});await new Promise(setImmediate);assert.equal(render().userId,'new-owner');
const pending=render().refetch();slots.forEach(s=>s?.cleanup?.());requests[4].resolve({coverages:[{id:'after-unmount'}],userId:'owner'});await pending;assert.equal(render().coverages.length,0);
console.log('PASS actual Insurance hook: overlapping refresh, cleared stale rows, failure reporting and unmount exclusion');
