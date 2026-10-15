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
const exports={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('apps/mobile/src/hooks/useCareData.js','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:n=>n==='react'?react:n.includes('careData')?{loadCareData:()=>{const d=deferred();requests.push(d);return d.promise}}:{supabase:{}}});
const render=()=>{cursor=0;const state=exports.useCareData();effects.splice(0).forEach(fn=>fn());return state};
render();const refresh=render().refetch();
requests[1].resolve({appointments:[{id:'new'}],encounters:[],claims:[]});await refresh;
requests[0].resolve({appointments:[{id:'old'}],encounters:[],claims:[]});await new Promise(setImmediate);
assert.equal(render().appointments[0].id,'new');
const failure=render().refetch();assert.equal(render().appointments.length,0);requests[2].reject(Error('Offline'));assert.equal(await failure,false);assert.equal(render().error,'Offline');assert.equal(render().loading,false);
const pending=render().refetch();slots.forEach(s=>s?.cleanup?.());requests[3].resolve({appointments:[{id:'after-unmount'}],encounters:[],claims:[]});await pending;assert.equal(render().appointments.length,0);
console.log('PASS actual Care hook: overlapping refresh, cleared stale rows, failure reporting and unmount exclusion');
