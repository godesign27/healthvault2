import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
function harness(file,api){
 let slots=[],cursor=0,effects=[];const exports={};
 const same=(a,b)=>a&&b&&a.length===b.length&&a.every((x,i)=>Object.is(x,b[i]));
 const react={useState(initial){const i=cursor++;slots[i]??={value:initial};return [slots[i].value,v=>{slots[i].value=v;}];},useRef(value){const i=cursor++;return slots[i]??=( {current:value});},useCallback(fn,deps){const i=cursor++;if(!same(slots[i]?.deps,deps))slots[i]={value:fn,deps};return slots[i].value;},useEffect(fn,deps){const i=cursor++;if(!same(slots[i]?.deps,deps)){slots[i]?.cleanup?.();slots[i]={deps};effects.push(()=>{slots[i].cleanup=fn();});}}};
 vm.runInNewContext(ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:n=>n==='react'?react:{api}});
 const hook=Object.values(exports)[0];return {render(arg){cursor=0;const value=hook(arg);const pending=effects;effects=[];pending.forEach(f=>f());return value;},unmount(){slots.forEach(s=>s?.cleanup?.());}};
}
const calls=[];const h=harness('apps/mobile/src/hooks/useRecords.js',{getRecords:filters=>{const d=deferred();calls.push({filters,...d});return d.promise;}});
let state=h.render({kind:'lab'});assert.equal(calls.length,1);
const refresh=state.refetch({kind:undefined});assert.equal(calls[1].filters.kind,undefined);
calls[1].resolve({data:{items:[{id:'new-import',kind:'other'}],total:1}});assert.equal(await refresh,true);
calls[0].resolve({data:{items:[{id:'old-lab'}],total:20}});await new Promise(setImmediate);state=h.render({kind:'lab'});assert.equal(state.records[0].id,'new-import');assert.equal(state.total,1);
const fail=state.refetch();calls[2].reject(Error('Offline'));assert.equal(await fail,false);assert.equal(h.render({kind:'lab'}).error,'Offline');
// A filter transition invalidates its in-flight predecessor.
state=h.render({kind:'other'});calls[3].resolve({items:[{id:'other'}],total:1});await new Promise(setImmediate);assert.equal(h.render({kind:'other'}).records[0].id,'other');
const late=state.refetch();h.unmount();calls[4].resolve({items:[{id:'late'}],total:1});await late;assert.equal(h.render({kind:'other'}).records[0].id,'other');
const statsCalls=[];const s=harness('apps/mobile/src/hooks/useVaultStats.js',{getStats:()=>{const d=deferred();statsCalls.push(d);return d.promise;}});
let stats=s.render();const fresh=stats.refetch();statsCalls[1].resolve({data:{totalRecords:1}});assert.equal(await fresh,true);statsCalls[0].resolve({data:{totalRecords:0}});await new Promise(setImmediate);assert.equal(s.render().stats.totalRecords,1);
const bad=s.render().refetch();statsCalls[2].reject(Error('Stats unavailable'));assert.equal(await bad,false);assert.equal(s.render().error,'Stats unavailable');s.unmount();
console.log('PASS actual Records/stats hooks: explicit All refresh, stale response exclusion, filter/unmount invalidation, refresh failure reporting');
