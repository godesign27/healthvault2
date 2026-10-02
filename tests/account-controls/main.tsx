// Local-only fixture harness. Not imported by the production app/build.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { AccountDataControls } from '../../src/components/AccountDataControls';
import '../../src/index.css';
const owner = '11111111-1111-4111-8111-111111111111';
let request: any = null;
let submissions = 0;
const fixtureClient: any = {
  auth: { getUser: async () => ({ data: { user: { id: owner } } }) },
  functions: { invoke: async () => ({ data: { format: 'health-vault-personal-data', accountId: owner, tables: { conditions: [{ name: 'Synthetic test only' }] } } }) },
  from() {
    const query: any = {
      select() { return query; }, eq() { return query; }, in() { return query; }, order() { return query; },
      limit: async () => ({ data: request ? [request] : [] }),
      single: async () => ({ data: request }),
      insert: async (input: any) => {
        if (input.user_id !== owner || input.confirmed !== true) throw Error('Invalid test request');
        submissions++;
        document.getElementById('submissions')!.textContent = `Submissions: ${submissions}`;
        if (request) return { error: { code: '23505' } };
        request = { id: 'synthetic-request', status: 'requested', requested_at: new Date().toISOString(), user_message: null, resolved_at: null };
        return { error: null };
      },
    }; return query;
  },
};
createRoot(document.getElementById('root')!).render(<main style={{ maxWidth: 650, padding: 30, margin: 'auto' }}><h1>Account controls — synthetic test only</h1><p id="submissions">Submissions: 0</p><AccountDataControls client={fixtureClient} /></main>);
