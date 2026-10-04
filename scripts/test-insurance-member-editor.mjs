import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
let slots=[],cursor=0;const react={useId:()=> 'member-test',useRef:initial=>{const i=cursor++;return slots[i]??={current:initial}},useState:initial=>{const i=cursor++;if(!(i in slots))slots[i]=initial;return[slots[i],value=>{slots[i]=value}]}};
const jsx=(type,props)=>({type,props});const exports={};
const deps={
 'react':react,'react/jsx-runtime':{jsx,jsxs:jsx},'lucide-react':{},'../../schemas/insurance':{},
 './StatusBadge':{StatusBadge:'Badge'},'../ui/Card':{Card:'Card'},
 '../../../packages/api-client/src/insurance-status':{insuranceProviderInitials:()=> 'FI',insuranceCoverageStatus:()=> 'saved',formatInsuranceDate:()=>'',displayInsuranceMemberId:()=> 'Not available'},
};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/insurance/CoverageCard.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require:name=>deps[name]});
let accepted=false,busy=false;const saved=[];
const render=()=>{cursor=0;return exports.CoverageCard({coverage:{id:'plan',provider:{name:'Fixture'},planName:'Fixture',memberId:''},busy,onSaveMemberId:async(coverage,value)=>{saved.push([coverage.id,value]);return accepted}})};
const nodes=tree=>!tree||typeof tree!=='object'?[]:Array.isArray(tree)?tree.flatMap(nodes):[tree,...nodes(tree.props?.children)];
const find=(type,label)=>nodes(render()).find(n=>n.type===type&&(!label||n.props.children===label));
find('button','Add member ID').props.onClick();assert.equal(find('input').props.value,'');assert.equal(find('button','Save ID').props.disabled,true);
const field=find('input');assert.equal(find('label').props.htmlFor,field.props.id);
field.props.onChange({target:{value:'ABC-1234'}});await find('form').props.onSubmit({preventDefault(){}});assert.equal(find('input').props.value,'ABC-1234');assert.deepEqual(saved,[['plan','ABC-1234']]);
busy=true;assert.equal(find('input').props.disabled,true);assert.equal(find('button','Save ID').props.disabled,true);assert.equal(find('button','Cancel').props.disabled,true);busy=false;
find('button','Cancel').props.onClick();assert.equal(find('input'),undefined);find('button','Add member ID').props.onClick();assert.equal(find('input').props.value,'');
find('input').props.onChange({target:{value:'XYZ-9876'}});accepted=true;await find('form').props.onSubmit({preventDefault(){}});assert.equal(find('input'),undefined);
console.log('PASS actual web member editor: label association, blank start, save failure retention, busy controls, cancel clearing and successful close');
find('button','Add member ID').props.onClick();assert.equal(find('input').props.autoFocus,true);
find('form').props.onKeyDown({key:'Escape',preventDefault(){}});assert.equal(find('input'),undefined);
let focused=false;find('button','Add member ID').props.ref({focus(){focused=true}});assert.ok(focused);
console.log('PASS editor autofocus, Escape cancellation and return focus');
