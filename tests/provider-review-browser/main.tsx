import React from 'react';
import {createRoot} from 'react-dom/client';
import {ProviderRecordConnectionFlow} from '../../src/components/records/ProviderRecordConnectionFlow';
import '../../src/index.css';
createRoot(document.getElementById('root')!).render(<main className="p-8 max-w-3xl mx-auto"><h1>Isolated provider review acceptance</h1><p>Synthetic UI test. First confirmation response is lost; list refresh fails after recovery.</p><p id="evidence">Confirmation attempts: 0. Simulated committed records: 0.</p><ProviderRecordConnectionFlow initialProviderName="Synthetic UI Provider" onClose={()=>{}} onRefreshData={async()=>{throw Error('Injected list refresh failure');}}/></main>);
