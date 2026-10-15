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
vm.runInNewContext(ts.transpileModule(fs.readFileSync('packages/api-client/src/vitals/useVitals.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:n=>n==='react'?react:n.includes('data')?{loadVitals:()=>{const d=deferred();requests.push(d);return d.promise}}:{supabase:{}}});
const client={};
const render=()=>{cursor=0;const state=exports.useVitals(client);effects.splice(0).forEach(fn=>fn());return state};
render();const refresh=render().refresh();
requests[1].resolve([{id:'new'}]);await refresh;
requests[0].resolve([{id:'old'}]);await new Promise(setImmediate);
assert.equal(render().rows[0].id,'new');
const failure=render().refresh();assert.equal(render().rows.length,0);requests[2].reject(Error('Offline'));await failure;assert.match(render().error,/Unable to load/);assert.equal(render().loading,false);
const pending=render().refresh();slots.forEach(s=>s?.cleanup?.());requests[3].resolve([{id:'after-unmount'}]);await pending;assert.equal(render().rows.length,0);
console.log('PASS shared Vitals hook: overlapping refresh, cleared stale rows, failure reporting and unmount exclusion');
