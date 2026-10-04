import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
let slots=[],cursor=0,feedback,loading=false;
const react={useState:initial=>{const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return[slots[i],v=>slots[i]=v]},useEffect(){}};
const jsx=(type,props)=>({type,props});
const deps={'react':react,'react/jsx-runtime':{jsx,jsxs:jsx},'lucide-react':{},'../components/ui/Banner':{Banner:'Banner'},'../components/insurance/CoverageCard':{CoverageCard:'Card'},'../lib/insurance/analytics':{InsuranceAnalytics:class{}},'../lib/supabase':{},'../../packages/api-client/src/insurance-status':{insuranceVerificationNotice:'notice'},'../lib/insurance/useInsuranceData':{useInsuranceData:()=>({coverages:[{id:'fixture'}],loading,userId:'user',refetch(){}})},'../../packages/api-client/src/useInsuranceMutation':{useInsuranceMutation:(_,notify)=>{feedback=notify;return{busy:false,run(){}}}}};
function module(file,modules){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require:n=>modules[n],crypto:{randomUUID:()=> 'receipt'}});return exports;}
const page=module('src/pages/InsurancePage.tsx',deps);
const nodes=t=>!t||typeof t!=='object'?[]:Array.isArray(t)?t.flatMap(nodes):[t,...nodes(t.props?.children)];
const render=()=>{cursor=0;return nodes(page.InsurancePage({}))};
render();feedback('Member ID saved','success');
for(const state of [false,true,false]){loading=state;const tree=render();const banner=tree.find(n=>n.type==='Banner');assert.equal(banner.props.message,'Member ID saved');assert.ok(tree.some(n=>n.props.className?.includes('sticky top-20')));assert.ok(tree.indexOf(banner)<tree.findIndex(n=>state?n.props.role==='status':n.type==='Card'));}
render().find(n=>n.type==='Banner').props.onClose();assert.equal(render().some(n=>n.type==='Banner'),false);
const b=module('src/components/ui/Banner.tsx',{'react/jsx-runtime':{jsx,jsxs:jsx},'lucide-react':{},'../../lib/utils':{cn:(...a)=>a.filter(Boolean).join(' ')}});
let closed=false;const tree=nodes(b.Banner({message:'Saved',variant:'success',style:'light',onClose:()=>closed=true}));assert.equal(tree[0].props.role,'status');const dismiss=tree.find(n=>n.type==='button');assert.equal(dismiss.props['aria-label'],'Dismiss notification');dismiss.props.onClick();assert.ok(closed);
assert.ok(!fs.readFileSync('src/components/ui/Banner.tsx','utf8').includes('setTimeout'));
console.log('PASS persistent success across loading/refetch, stable placement, status announcement and manual dismissal');
