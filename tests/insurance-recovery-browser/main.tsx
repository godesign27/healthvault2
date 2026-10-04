// Local-only synthetic browser exercise; no Supabase URL, keys or real records.
import React,{useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {CoverageCard} from '../../src/components/insurance/CoverageCard';
import {Banner} from '../../src/components/ui/Banner';
import {useInsuranceMutation} from '../../packages/api-client/src/useInsuranceMutation';
import '../../src/index.css';
function Fixture(){
 const [fail,setFail]=useState(true),[attempts,setAttempts]=useState(0),[saved,setSaved]=useState(''),[receipt,setReceipt]=useState<any>(null);
 const mode=useRef(fail);mode.current=fail;
 const client=useMemo(()=>({auth:{getUser:async()=>({data:{user:{id:'fixture-user'}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},from:()=>({update:(payload:any)=>{const q:any={eq:()=>q,select:()=>q,single:async()=>{
 setAttempts(n=>n+1);const response=await fetch('/fixture/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fail:mode.current})});
 if(!response.ok)throw Error('Synthetic 503');setSaved(payload.member_id);return {data:await response.json(),error:null};
 }};return q;}})}),[]);
 const {busy,run}=useInsuranceMutation(client as any,(message,type)=>setReceipt({message,type}),async()=>{},()=>setReceipt(null));
 return <main className="p-8 max-w-2xl mx-auto"><h1 className="text-2xl font-bold">Insurance recovery fixture</h1><p>Local synthetic data only. HTTP failure exercises the real card and mutation hook.</p>
 <label className="block my-4"><input type="checkbox" checked={fail} onChange={e=>setFail(e.target.checked)}/> Simulate service failure</label>
 <p>Write attempts: {attempts}. Saved ID: {saved||'none'}.</p>
 {receipt&&<Banner message={receipt.message} variant={receipt.type} style="light" onClose={()=>setReceipt(null)}/>}
 <CoverageCard coverage={{id:'fixture-plan',provider:{name:'Fixture Insurer'},planName:'Synthetic plan',memberId:saved} as any} showActions busy={busy} onSaveMemberId={(c,value)=>run('fixture-user',c.id,'memberId',value)}/></main>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);
