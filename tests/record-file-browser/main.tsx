import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase } from '../../src/lib/supabase';
import { DocumentViewer } from '../../src/components/records/DocumentViewer';
import { RecordKind, RecordSource } from '../../src/lib/records/types';
import fixtureJson from './session.local?raw';
import '../../src/index.css';
const fixture = JSON.parse(fixtureJson);
if (fixture.project !== 'roeudwddxvniazwufdqf' || location.hostname !== '127.0.0.1') throw Error('Preview only');
const record = { id: fixture.record, kind: RecordKind.Other, source: RecordSource.Uploaded,
 title: 'Synthetic protected image', fileType: 'png' as const, fileAccess: 'authenticated' as const, receivedAt: new Date().toISOString() };
function Harness() {
 const [ready,setReady]=useState(false),[open,setOpen]=useState(false);
 useEffect(()=>{void supabase.auth.setSession(fixture.session).then(({error})=>{if(!error)setReady(true);});},[]);
 return <main className="p-8 bg-surface-base text-content-primary"><h1>Protected file — preview acceptance</h1>
 <button disabled={!ready} onClick={()=>setOpen(true)}>Open test document</button>
 <DocumentViewer record={open?record:null} onClose={()=>setOpen(false)} /></main>;
}
createRoot(document.getElementById('root')!).render(<Harness />);
