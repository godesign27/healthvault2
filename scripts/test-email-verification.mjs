import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
let slots=[],cursor=0,calls=[],finish,next=0;
const react={useState:initial=>{const i=cursor++;if(!(i in slots))slots[i]=initial;return[slots[i],v=>slots[i]=v]},useRef:initial=>{const i=cursor++;return slots[i]??=( {current:initial})},useEffect(){}};
const jsx=(type,props)=>({type,props});const exports={};
const deps={'react':react,'react/jsx-runtime':{jsx,jsxs:jsx},'lucide-react':{},'../components/OnboardingLayout':{},'../components/OnboardingAssistantPanel':{},'../components/ui/Button':{Button:'Button'},'../lib/supabase':{supabase:{auth:{verifyOtp:args=>{calls.push(args);return new Promise(resolve=>finish=resolve)}},from:()=>({upsert:async()=>({error:null})})}}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/pages/OnboardingVerifyEmailPage.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require:name=>deps[name]});
const render=()=>{cursor=0;return exports.OnboardingVerifyEmailPage({email:'fixture@example.com',onNext:()=>next++,onBack(){}})};
const nodes=t=>!t||typeof t!=='object'?[]:Array.isArray(t)?t.flatMap(nodes):[t,...nodes(t.props?.children)];
const find=type=>nodes(render()).find(n=>n.type===type);
assert.equal(find('label').props.htmlFor,find('input').props.id);
assert.equal(find('input').props.autoComplete,'one-time-code');
assert.equal(find('input').props.maxLength,undefined);
for(const token of ['00123456','123456','A1B2C3D4']){
 find('input').props.onChange({target:{value:token}});
 assert.equal(calls.length,next,'typing must not auto-submit');
 const form=find('form');form.props.onSubmit({preventDefault(){}});form.props.onSubmit({preventDefault(){}});
 assert.equal(calls.length,next+1,'duplicate submit blocked');assert.equal(calls.at(-1).token,token);
 assert.equal(find('input').props.disabled,true);
 finish({data:{session:{user:{id:'fixture'}}},error:null});await new Promise(r=>setImmediate(r));
}
assert.equal(next,3);
console.log('PASS full 8/6-character tokens, leading zeros, autofill labeling, explicit submission and duplicate guard');
