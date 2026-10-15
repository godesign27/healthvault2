import React, {useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {UploadRecordForm} from '../../src/components/records/UploadRecordForm';
import {listRecords} from '../../src/lib/records/query';
import {supabase} from '../../src/lib/supabase';
import fixtureJson from './session.local?raw';
import '../../src/index.css';
const fixture=JSON.parse(fixtureJson);
if(location.hostname!=='127.0.0.1'||fixture.project!=='roeudwddxvniazwufdqf')throw Error('Preview only');
function Harness(){
 const [ready,setReady]=useState(false),[records,setRecords]=useState<Array<{id:string,title:string}>>([]);
 const reload=()=>listRecords().then(setRecords);
 useEffect(()=>{void supabase.auth.setSession(fixture.session).then(async({error})=>{if(error)throw error;await reload();setReady(true);});},[]);
 function selectFile(){
  const input=document.querySelector<HTMLInputElement>('input[type=file]')!;
  const transfer=new DataTransfer();transfer.items.add(new File(['Synthetic acceptance document only.'],'synthetic-upload.txt',{type:'text/plain'}));
  input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));
 }
 return <main className="p-8 bg-surface-base text-content-primary min-h-screen">
 <h1 className="text-xl font-semibold mb-4">Health Records — real preview upload</h1>
 <p className="mb-4">Disposable preview account. Live server storage; no patient data.</p>
 <button disabled={!ready} onClick={selectFile} className="underline mb-4">Select synthetic file</button>
 {ready&&<UploadRecordForm onSaved={()=>{void reload();}}/>}
 <h2>Saved records: {records.length}</h2><ul>{records.map(r=><li key={r.id}>{r.title} — {r.id}</li>)}</ul>
 </main>;
}
createRoot(document.getElementById('root')!).render(<Harness/>);
