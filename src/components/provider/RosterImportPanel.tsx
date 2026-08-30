import { CheckCircle2, FileUp, Loader2, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { HEALTH_VAULT_ROSTER_CSV_V1_HEADERS, parseRosterCsvV1, type RosterRowV1, type RosterValidationError } from '../../../packages/provider-contracts/src/roster-import';
import { supabase } from '../../lib/supabase';

interface ImportJob {
  id: string;
  status: 'staged' | 'validated' | 'rejected' | 'committed' | 'rolled_back';
  row_count: number;
  valid_row_count: number;
  invalid_row_count: number;
  created_at: string;
  committed_at?: string | null;
  rolled_back_at?: string | null;
  provider_import_sources?: { display_name: string; source_system: string; synthetic: boolean } | null;
  provider_import_reconciliations?: Array<{ inserted_count: number; updated_count: number; unchanged_count: number; exception_count: number }>;
}

async function invoke(body: Record<string, unknown>) {
  const response = await supabase.functions.invoke('provider-admin-api', { body });
  if (!response.error) return response.data;
  let detail = response.data?.error;
  const context = (response.error as { context?: Response }).context;
  if (!detail && context && typeof context.json === 'function') {
    try { detail = (await context.clone().json())?.error; } catch { /* use the SDK message */ }
  }
  throw new Error(detail ?? response.error.message);
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function RosterImportPanel({ providerAccountId, onRosterChanged, embedded = false }: { providerAccountId: string; onRosterChanged: () => Promise<void>; embedded?: boolean }) {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [fileName, setFileName] = useState('');
  const [fileText, setFileText] = useState('');
  const [rows, setRows] = useState<RosterRowV1[]>([]);
  const [validationErrors, setValidationErrors] = useState<RosterValidationError[]>([]);
  const [synthetic, setSynthetic] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadImports = useCallback(async () => {
    try {
      const data = await invoke({ action: 'list-imports', providerAccountId });
      setJobs(data?.imports ?? []);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to load import history.'); }
  }, [providerAccountId]);

  useEffect(() => { void loadImports(); }, [loadImports]);

  async function selectFile(file?: File) {
    setError(''); setMessage(''); setRows([]); setValidationErrors([]);
    if (!file) { setFileName(''); setFileText(''); return; }
    if (file.size > 2 * 1024 * 1024) { setError('Choose a CSV file smaller than 2 MB.'); return; }
    const text = await file.text();
    const parsed = parseRosterCsvV1(text);
    setFileName(file.name); setFileText(text); setRows(parsed.rows); setValidationErrors(parsed.errors);
  }

  async function stageImport() {
    if (!fileName || !fileText || !rows.length || validationErrors.length) return;
    setBusy('stage'); setError(''); setMessage('');
    try {
      const data = await invoke({
        action: 'stage-roster-import', providerAccountId, rows, sourceDisplayName: fileName,
        contentSha256: await sha256(fileText), synthetic,
      });
      setMessage(data?.duplicate ? 'This exact file was already staged.' : `${rows.length} rows staged and validated. Review the job below before committing.`);
      await loadImports();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to stage import.'); }
    finally { setBusy(''); }
  }

  async function changeJob(job: ImportJob, action: 'commit-roster-import' | 'rollback-roster-import') {
    setBusy(job.id); setError(''); setMessage('');
    try {
      await invoke({ action, providerAccountId, importJobId: job.id });
      setMessage(action.startsWith('commit') ? 'Import committed to the provider roster.' : 'Import rolled back from the provider roster.');
      await Promise.all([loadImports(), onRosterChanged()]);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to update import.'); }
    finally { setBusy(''); }
  }

  const template = `${HEALTH_VAULT_ROSTER_CSV_V1_HEADERS.join(',')}\ndemo-001,MRN-001,Ada,Lovelace,1980-12-10,female,ada@example.test,555-0100,1 Demo Way,,Denver,CO,80202,US\n`;

  return <div>
    {!embedded && <><p className="text-sm font-semibold text-indigo-600">Roster CSV v1</p><h1 className="mt-1 text-3xl font-bold">Roster imports</h1><p className="mt-2 text-content-secondary">Validate demographics locally, stage them behind provider authorization, then explicitly commit them.</p></>}
    {embedded && <p className="text-sm text-content-secondary">Upload patient demographics, validate them locally, and explicitly commit the roster after review.</p>}

    <div className={`${embedded ? 'mt-4' : 'mt-6'} rounded-xl border border-stroke-subtle bg-surface-raised p-6`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><h2 className="text-lg font-semibold">Upload a roster</h2><p className="mt-1 text-sm text-content-secondary">CSV only, up to 500 rows and 2 MB. Clinical fields are rejected.</p></div>
        <a className="text-sm font-semibold text-indigo-700 hover:underline" download="health-vault-roster-template-v1.csv" href={`data:text/csv;charset=utf-8,${encodeURIComponent(template)}`}>Download template</a>
      </div>
      <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 px-5 py-8 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">
        <FileUp className="h-5 w-5" />{fileName || 'Choose roster CSV'}
        <input className="sr-only" type="file" accept=".csv,text/csv" onChange={(event) => void selectFile(event.target.files?.[0])} />
      </label>
      {fileName && <div className="mt-4 grid gap-3 sm:grid-cols-3"><Metric label="Valid rows" value={String(rows.length)} /><Metric label="Validation issues" value={String(validationErrors.length)} /><Metric label="Scope" value="Roster only" /></div>}
      {validationErrors.length > 0 && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"><strong>Fix these issues before staging:</strong><ul className="mt-2 list-disc space-y-1 pl-5">{validationErrors.slice(0, 10).map((issue, index) => <li key={`${issue.rowNumber}-${issue.field}-${index}`}>Row {issue.rowNumber}: {issue.message}</li>)}</ul>{validationErrors.length > 10 && <p className="mt-2">And {validationErrors.length - 10} more.</p>}</div>}
      {rows.length > 0 && validationErrors.length === 0 && <div className="mt-4 overflow-x-auto rounded-lg border border-stroke-subtle"><table className="w-full text-left text-sm"><thead className="bg-surface-sunken text-xs uppercase text-content-tertiary"><tr><th className="px-3 py-2">Patient</th><th className="px-3 py-2">Patient number</th><th className="px-3 py-2">Birth date</th></tr></thead><tbody>{rows.slice(0, 5).map((row) => <tr key={row.external_patient_id} className="border-t border-stroke-subtle"><td className="px-3 py-2">{row.family_name}, {row.given_name}</td><td className="px-3 py-2 font-mono text-xs">{row.organization_patient_number}</td><td className="px-3 py-2">{row.birth_date}</td></tr>)}</tbody></table></div>}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={synthetic} onChange={(event) => setSynthetic(event.target.checked)} />This file contains synthetic/demo data</label><button disabled={!rows.length || validationErrors.length > 0 || busy === 'stage'} onClick={() => void stageImport()} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy === 'stage' ? 'Staging…' : 'Stage validated import'}</button></div>
    </div>

    {(message || error) && <div role="status" className={`mt-4 rounded-lg border p-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{error || message}</div>}

    <div className="mt-6 overflow-hidden rounded-xl border border-stroke-subtle bg-surface-raised"><div className="border-b border-stroke-subtle px-5 py-4"><h2 className="font-semibold">Import history</h2></div>{jobs.length === 0 ? <p className="p-6 text-sm text-content-secondary">No imports have been recorded.</p> : <div className="divide-y divide-stroke-subtle">{jobs.map((job) => <div key={job.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><strong>{job.provider_import_sources?.display_name ?? 'Roster import'}</strong><span className="rounded-full bg-surface-sunken px-2 py-0.5 text-xs font-semibold">{job.status.replace('_', ' ')}</span>{job.provider_import_sources?.synthetic && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">Synthetic</span>}</div><p className="mt-1 text-sm text-content-secondary">{job.valid_row_count} validated rows · {new Date(job.created_at).toLocaleString()}</p></div><div>{job.status === 'validated' && <button disabled={busy === job.id} onClick={() => void changeJob(job, 'commit-roster-import')} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"><CheckCircle2 className="h-4 w-4" />{busy === job.id ? 'Committing…' : 'Commit import'}</button>}{job.status === 'committed' && <button disabled={busy === job.id} onClick={() => void changeJob(job, 'rollback-roster-import')} className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700"><RotateCcw className="h-4 w-4" />{busy === job.id ? 'Rolling back…' : 'Roll back'}</button>}{busy === job.id && <Loader2 className="ml-2 inline h-4 w-4 animate-spin" />}</div></div>)}</div>}</div>
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-lg bg-surface-sunken p-3"><p className="text-xs text-content-tertiary">{label}</p><strong className="mt-1 block">{value}</strong></div>; }
