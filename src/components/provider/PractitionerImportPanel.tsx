import { FileUp, Loader2, Send, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

import { HEALTH_VAULT_PRACTITIONER_CSV_V1_HEADERS, parsePractitionerCsvV1, type PractitionerRowV1, type PractitionerValidationError } from '../../../packages/provider-contracts/src/practitioner-import';
import { supabase } from '../../lib/supabase';

async function invoke(body: Record<string, unknown>) {
  const response = await supabase.functions.invoke('provider-admin-api', { body });
  if (!response.error) return response.data;
  let detail = response.data?.error; const context = (response.error as { context?: Response }).context;
  if (!detail && context && typeof context.json === 'function') { try { detail = (await context.clone().json())?.error; } catch { /* retain SDK message */ } }
  throw new Error(detail ?? response.error.message);
}

export function PractitionerImportPanel({ providerAccountId, onImported }: { providerAccountId: string; onImported: () => Promise<void> }) {
  const [mode, setMode] = useState<'invite' | 'import'>('invite');
  const [email, setEmail] = useState('');
  const [fileName, setFileName] = useState(''); const [rows, setRows] = useState<PractitionerRowV1[]>([]);
  const [issues, setIssues] = useState<PractitionerValidationError[]>([]); const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(''); const [error, setError] = useState('');

  async function selectFile(file?: File) {
    setMessage(''); setError(''); setRows([]); setIssues([]);
    if (!file) { setFileName(''); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Choose a CSV file smaller than 5 MB.'); return; }
    const parsed = parsePractitionerCsvV1(await file.text()); setFileName(file.name); setRows(parsed.rows); setIssues(parsed.errors);
  }

  async function importRows() {
    if (!rows.length || issues.length) return; setBusy(true); setError(''); setMessage('');
    try {
      const data = await invoke({ action: 'bulk-create-practitioner-invitations', providerAccountId, practitioners: rows, sourceDisplayName: fileName });
      setMessage(`${data.createdCount} practitioner invitation${data.createdCount === 1 ? '' : 's'} created. ${data.skippedCount ? `${data.skippedCount} existing pending invitation${data.skippedCount === 1 ? ' was' : 's were'} skipped. ` : ''}Delivery is queued; credentials remain unverified until platform review.`);
      await onImported();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to import practitioners.'); }
    finally { setBusy(false); }
  }

  async function invitePractitioner() {
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError('Enter a valid practitioner email.'); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      await invoke({ action: 'create-invitation', providerAccountId, email, roles: ['practitioner'] });
      setMessage(`Invitation created for ${email}. Email delivery was requested; credentials remain unverified until Health Vault review.`);
      setEmail('');
      await onImported();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to invite practitioner.'); }
    finally { setBusy(false); }
  }

  const template = `${HEALTH_VAULT_PRACTITIONER_CSV_V1_HEADERS.join(',')}\npractitioner@example.com,Jordan Smith,Primary Care,npi,1234567890\n`;
  return <div><p className="text-sm text-content-secondary">Invite one practitioner or import up to 2,000 at once. Both paths create invitations only; credentials require separate Health Vault review.</p>
    <div className="mt-4 flex rounded-lg border border-stroke-default bg-surface-sunken p-1" role="tablist" aria-label="Add practitioner method"><button type="button" role="tab" aria-selected={mode === 'invite'} onClick={() => { setMode('invite'); setError(''); setMessage(''); }} className={`flex-1 rounded-md px-4 py-2.5 text-sm font-semibold ${mode === 'invite' ? 'bg-white text-indigo-700 shadow-sm' : 'text-content-secondary'}`}>Invite one</button><button type="button" role="tab" aria-selected={mode === 'import'} onClick={() => { setMode('import'); setError(''); setMessage(''); }} className={`flex-1 rounded-md px-4 py-2.5 text-sm font-semibold ${mode === 'import' ? 'bg-white text-indigo-700 shadow-sm' : 'text-content-secondary'}`}>Import CSV</button></div>
    {mode === 'invite' ? <div className="mt-4 rounded-xl border border-stroke-subtle bg-surface-raised p-6"><div className="flex items-center gap-2"><Send className="h-5 w-5 text-indigo-600" /><h2 className="text-lg font-semibold">Invite a practitioner</h2></div><p className="mt-2 text-sm text-content-secondary">Send an invitation to one practitioner’s verified email address.</p><label className="mt-5 block text-sm font-medium">Email address<input type="email" autoFocus value={email} onChange={(event) => setEmail(event.target.value)} placeholder="practitioner@example.com" className="mt-2 w-full rounded-lg border border-stroke-default px-3 py-2.5" /></label><button type="button" disabled={busy || !/^\S+@\S+\.\S+$/.test(email)} onClick={() => void invitePractitioner()} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{busy ? 'Sending…' : 'Invite practitioner'}</button><p className="mt-3 text-xs text-content-tertiary">Acceptance creates an unverified practitioner profile. It does not grant patient access.</p></div> : <div className="mt-4 rounded-xl border border-stroke-subtle bg-surface-raised p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold">Upload practitioner CSV</h2><p className="mt-1 text-sm text-content-secondary">CSV v1 · 2,000 rows maximum · 5 MB maximum</p></div><a download="health-vault-practitioners-template-v1.csv" href={`data:text/csv;charset=utf-8,${encodeURIComponent(template)}`} className="shrink-0 text-sm font-semibold text-indigo-700 hover:underline">Download template</a></div>
      <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 px-5 py-8 text-sm font-semibold text-indigo-700"><FileUp className="h-5 w-5" />{fileName || 'Choose practitioner CSV'}<input type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => void selectFile(event.target.files?.[0])} /></label>
      {fileName && <div className="mt-4 grid gap-3 sm:grid-cols-3"><Metric label="Valid practitioners" value={String(rows.length)} /><Metric label="Validation issues" value={String(issues.length)} /><Metric label="Credential state" value="Unverified" /></div>}
      {issues.length > 0 && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"><strong>Fix these issues before importing:</strong><ul className="mt-2 list-disc space-y-1 pl-5">{issues.slice(0, 12).map((issue, index) => <li key={`${issue.rowNumber}-${issue.field}-${index}`}>Row {issue.rowNumber}: {issue.message}</li>)}</ul>{issues.length > 12 && <p className="mt-2">And {issues.length - 12} more.</p>}</div>}
      {rows.length > 0 && !issues.length && <div className="mt-4 overflow-x-auto rounded-lg border border-stroke-subtle"><table className="w-full text-left text-sm"><thead className="bg-surface-sunken text-xs uppercase text-content-tertiary"><tr><th className="px-3 py-2">Practitioner</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Specialty</th></tr></thead><tbody>{rows.slice(0, 8).map((row) => <tr key={row.email} className="border-t border-stroke-subtle"><td className="px-3 py-2 font-medium">{row.display_name}</td><td className="px-3 py-2">{row.email}</td><td className="px-3 py-2">{row.specialty || '—'}</td></tr>)}</tbody></table>{rows.length > 8 && <p className="border-t border-stroke-subtle px-3 py-2 text-xs text-content-tertiary">Previewing 8 of {rows.length} practitioners.</p>}</div>}
      <div className="mt-5 flex items-center justify-between gap-4"><p className="flex items-center gap-2 text-xs text-content-tertiary"><ShieldCheck className="h-4 w-4" />No patient access is created.</p><button disabled={!rows.length || issues.length > 0 || busy} onClick={() => void importRows()} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{busy ? 'Importing…' : `Import ${rows.length || ''} practitioner${rows.length === 1 ? '' : 's'}`}</button></div>
    </div>}{(message || error) && <div role={error ? 'alert' : 'status'} className={`mt-4 rounded-lg border p-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{error || message}</div>}</div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-lg bg-surface-sunken p-3"><p className="text-xs text-content-tertiary">{label}</p><strong className="mt-1 block">{value}</strong></div>; }
