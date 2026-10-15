import React from 'react';
import { createRoot } from 'react-dom/client';
import ProviderRecordSubmitPage from '../../src/pages/ProviderRecordSubmitPage';
import '../../src/index.css';
if (location.hostname !== '127.0.0.1') throw new Error('Local fixture only');
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (!url.includes('/functions/v1/record-request/')) return originalFetch(input, init);
  if (init?.method === 'POST') return Response.json({ success: false, filesReceived: 1, filesFailed: 1,
    saved: [{ index: 0, id: 'synthetic-saved' }], fileErrors: [{ index: 1, code: 'invalid_file' }],
  }, { status: 207 });
  return Response.json({ id: 'fixture', patientName: 'Synthetic patient', providerName: 'Test provider',
    recordTypes: ['OTHER'], urgency: 'routine', status: 'sent', files: [] });
};
function loadFiles() {
  const input = document.querySelector<HTMLInputElement>('input[type=file]');
  if (!input) throw new Error('Form not loaded');
  const transfer = new DataTransfer();
  transfer.items.add(new File(['fixture'], 'saved-fixture.pdf', { type: 'application/pdf' }));
  transfer.items.add(new File(['fixture'], 'retry-fixture.pdf', { type: 'application/pdf' }));
  input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true }));
}
createRoot(document.getElementById('root')!).render(<>
  <aside className="p-4 bg-surface-sunken text-content-primary">Simulated preview response — no uploads or emails.
    <button className="ml-4 underline" onClick={loadFiles}>Load synthetic test batch</button></aside>
  <ProviderRecordSubmitPage />
</>);
