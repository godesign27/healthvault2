import { ArrowLeft, Building2, CalendarClock, Loader2, ShieldCheck, ShieldX } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { LoginPage } from './LoginPage';

interface ProviderConnection {
  providerPatientIdentityId: string;
  providerDisplayName: string;
  organizationPatientNumber: string | null;
  status: string;
  scope: string[];
  purpose: string | null;
  consentVersion: string | null;
  effectiveAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  consentReceiptId: string | null;
  consentedAt: string | null;
  consentEvidenceType: string | null;
}

const readable = (value: string) => value.replace(/[._]/g, ' ');
const formatDate = (value: string | null) => value ? new Date(value).toLocaleString() : 'Not recorded';

export function ConnectedProvidersPage() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [connections, setConnections] = useState<ProviderConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    const { data: { session } } = await supabase.auth.getSession();
    setSignedIn(Boolean(session?.user));
    if (!session?.user) { setLoading(false); return; }
    const { data, error: invokeError } = await supabase.functions.invoke('patient-provider-access-api', { body: { action: 'list' } });
    if (invokeError || !data?.connections) setError(data?.error ?? invokeError?.message ?? 'Unable to load connected providers.');
    else setConnections(data.connections as ProviderConnection[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function withdraw(connection: ProviderConnection) {
    const confirmed = window.confirm(`Withdraw ${connection.providerDisplayName}'s access? Your Health Vault profile remains yours, but this provider will no longer be able to use this connection.`);
    if (!confirmed) return;
    setBusyId(connection.providerPatientIdentityId); setError('');
    const { data, error: invokeError } = await supabase.functions.invoke('patient-provider-access-api', { body: { action: 'withdraw', providerPatientIdentityId: connection.providerPatientIdentityId, reason: 'Withdrawn by patient from Connected providers' } });
    if (invokeError || !data?.withdrawal) setError(data?.error ?? invokeError?.message ?? 'Unable to withdraw provider access.');
    else await load();
    setBusyId('');
  }

  if (signedIn === false) return <LoginPage title="Connected providers" description="Sign in to review and manage provider access to your Health Vault." allowSignup={false} onLoginSuccess={() => void load()} onCancel={() => { window.location.href = '/'; }} />;

  return <main className="min-h-screen bg-surface-page px-4 py-8 sm:px-6 sm:py-12"><div className="mx-auto max-w-6xl">
    <button onClick={() => { window.location.href = '/'; }} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-content-secondary hover:text-content-primary"><ArrowLeft className="h-4 w-4" />Back to Health Vault</button>
    <header className="mb-7"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white"><ShieldCheck /></div><p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Patient-controlled access</p><h1 className="mt-1 text-3xl font-bold text-content-primary">Connected providers</h1><p className="mt-2 max-w-3xl text-content-secondary">Review the organizations connected to your Health Vault identity. Providers cannot take ownership of or revoke your profile. You can withdraw their access here at any time.</p></header>
    {error && <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    {loading && <div className="flex items-center gap-3 rounded-xl border border-stroke-subtle bg-surface-raised p-8 text-content-secondary"><Loader2 className="animate-spin" />Loading provider connections...</div>}
    {!loading && connections.length === 0 && <div className="rounded-2xl border border-dashed border-stroke-default bg-surface-raised p-10 text-center"><Building2 className="mx-auto mb-3 h-10 w-10 text-content-tertiary" /><h2 className="text-lg font-semibold">No provider connections yet</h2><p className="mt-2 text-sm text-content-secondary">Accepted provider invitations will appear here with their approved fields and access history.</p></div>}
    {!loading && connections.length > 0 && <div className="grid gap-5">{connections.map((connection) => {
      const active = connection.status === 'active';
      return <article key={`${connection.providerPatientIdentityId}-${connection.effectiveAt}`} className="rounded-2xl border border-stroke-subtle bg-surface-raised p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-3"><h2 className="text-xl font-semibold text-content-primary">{connection.providerDisplayName}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{connection.status}</span></div>{connection.organizationPatientNumber && <p className="mt-1 text-sm text-content-tertiary">Provider patient number {connection.organizationPatientNumber}</p>}<dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3"><div><dt className="font-semibold text-content-secondary">Purpose</dt><dd className="mt-1 capitalize text-content-primary">{connection.purpose ? readable(connection.purpose) : 'Not recorded'}</dd></div><div><dt className="font-semibold text-content-secondary">Connected</dt><dd className="mt-1 text-content-primary">{formatDate(connection.effectiveAt)}</dd></div><div><dt className="font-semibold text-content-secondary">{connection.revokedAt ? 'Withdrawn' : 'Scheduled end'}</dt><dd className="mt-1 text-content-primary">{formatDate(connection.revokedAt ?? connection.expiresAt)}</dd></div></dl><div className="mt-5"><p className="text-sm font-semibold text-content-secondary">Approved fields</p><div className="mt-2 flex flex-wrap gap-2">{connection.scope.length ? connection.scope.map((scope) => <span key={scope} className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold capitalize text-indigo-700">{readable(scope)}</span>) : <span className="text-sm text-content-tertiary">No active field approval</span>}</div></div>{connection.consentVersion && <p className="mt-4 font-mono text-xs text-content-tertiary">Consent {connection.consentVersion}</p>}</div>
      {active && <button disabled={busyId === connection.providerPatientIdentityId} onClick={() => void withdraw(connection)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60">{busyId === connection.providerPatientIdentityId ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldX className="h-4 w-4" />}Withdraw provider access</button>}</div>{connection.consentReceiptId && <div className="mt-5 rounded-lg border border-stroke-subtle bg-surface-sunken p-3 text-xs text-content-secondary"><strong className="text-content-primary">Synthetic consent receipt</strong><p className="mt-1">Receipt <span className="font-mono">{connection.consentReceiptId}</span> · {connection.consentEvidenceType ? readable(connection.consentEvidenceType) : 'verified evidence'} · consented {formatDate(connection.consentedAt)}</p></div>}</article>;
    })}</div>}
    <div className="mt-6 flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"><CalendarClock className="mt-0.5 h-5 w-5 shrink-0" /><p><strong>Access history is retained.</strong> Withdrawing stops the provider connection; it does not delete your Health Vault account or your patient-owned profile.</p></div>
  </div></main>;
}
