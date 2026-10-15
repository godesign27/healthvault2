// Local-only browser acceptance. Never imported by the production build.
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase } from '../../src/lib/supabase';
import { AccountDataControls } from '../../src/components/AccountDataControls';
import fixtureJson from './session.local?raw';
import '../../src/index.css';
const fixture = JSON.parse(fixtureJson);
if (fixture.project !== 'roeudwddxvniazwufdqf' || location.hostname !== '127.0.0.1') throw Error('Preview/local-only test');
function Harness() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { void supabase.auth.setSession(fixture.session).then(({error}) => {
    if(error) setError('Unable to establish synthetic preview session.'); else setReady(true);
  }); }, []);
  return <main className="mx-auto max-w-2xl p-8 space-y-5 bg-surface-base text-content-primary">
    <h1 className="text-2xl font-semibold">Account controls — preview acceptance</h1>
    <p>Synthetic account only. Uses the deployed preview API; no production records.</p>
    {error && <p role="alert">{error}</p>}
    {ready ? <AccountDataControls /> : <p>Connecting to preview…</p>}
  </main>;
}
createRoot(document.getElementById('root')!).render(<Harness />);
