import { Check, Loader2, LogOut, ShieldCheck, TestTube2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { LoginPage } from './LoginPage';
import { supabase } from '../lib/supabase';

interface InvitationPreview {
  providerDisplayName: string;
  patientDisplayName: string;
  organizationPatientNumber: string | null;
  scope: string[];
  purpose: string;
  consentVersion: string;
  expiresAt: string;
  accessExpiresAt: string;
  dataSummary: { profileDetails: number; healthRecords: number; labs: number; medications: number; vitals: number; clinicalImportEnabled: boolean };
}

const readable = (value: string) => value.replace(/[._]/g, ' ');

async function functionError(error: unknown, fallback: string) {
  const context = (error as { context?: Response } | null)?.context;
  if (context && typeof context.clone === 'function') {
    try {
      const detail = await context.clone().json() as { error?: string; code?: string };
      return { message: detail.error ?? fallback, code: detail.code ?? '' };
    } catch { /* retain a safe fallback */ }
  }
  return { message: error instanceof Error ? error.message : fallback, code: '' };
}

export function PatientAccessInvitationPage({ invitationId }: { invitationId: string }) {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [response, setResponse] = useState<'denied' | null>(null);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [signedInEmail, setSignedInEmail] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError(''); setErrorCode('');
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    setSignedIn(Boolean(user));
    setSignedInEmail(user?.email ?? '');
    setEmailVerified(Boolean(user?.email_confirmed_at));
    if (user?.email_confirmed_at) {
      const { data, error: invokeError } = await supabase.functions.invoke('patient-access-invitation-api', { body: { action: 'preview', invitationId } });
      if (invokeError || !data?.invitation) {
        const detail = invokeError ? await functionError(invokeError, 'Unable to load this invitation.') : { message: data?.error ?? 'Unable to load this invitation.', code: data?.code ?? '' };
        setError(detail.message); setErrorCode(detail.code);
      }
      else setPreview(data.invitation as InvitationPreview);
    }
    setLoading(false);
  }, [invitationId]);

  useEffect(() => { void load(); }, [load]);

  async function respond(action: 'accept' | 'deny') {
    setBusy(true); setError(''); setErrorCode('');
    const { data, error: invokeError } = await supabase.functions.invoke('patient-access-invitation-api', { body: { action, invitationId } });
    if (invokeError || !data?.response) {
      const detail = invokeError ? await functionError(invokeError, 'Unable to record your response.') : { message: data?.error ?? 'Unable to record your response.', code: data?.code ?? '' };
      setError(detail.message); setErrorCode(detail.code);
    }
    else if (action === 'accept') {
      sessionStorage.setItem('hv-provider-connection-accepted', JSON.stringify({ providerDisplayName: preview?.providerDisplayName ?? 'Your provider', dataSummary: preview?.dataSummary ?? null }));
      window.location.assign('/dashboard');
      return;
    } else setResponse('denied');
    setBusy(false);
  }

  if (!loading && !signedIn) {
    return <LoginPage title="Patient access invitation" description="Sign in with the verified email address named in this synthetic invitation." allowSignup={false} onLoginSuccess={() => void load()} onCancel={() => { window.location.href = '/'; }} />;
  }

  return <main className="min-h-screen bg-surface-page px-4 py-10 sm:py-16"><section className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-stroke-subtle bg-surface-raised shadow-lg">
    <header className="border-b border-stroke-subtle px-6 py-6 sm:px-8"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white"><ShieldCheck aria-hidden="true" /></div><p className="mb-1 text-xs font-semibold uppercase tracking-wider text-content-tertiary">Health Vault Patient Access</p><h1 className="text-2xl font-bold text-content-primary">Bring your provider information into your Health Vault</h1><p className="mt-2 text-sm leading-6 text-content-secondary">Accepting creates a patient-controlled connection, so your information can be organized around you instead of being locked inside one provider system.</p></header>
    <div className="px-6 py-7 sm:px-8">
      {loading && <div className="flex items-center gap-3 text-content-secondary"><Loader2 className="animate-spin" aria-hidden="true" />Checking invitation...</div>}
      {!loading && signedIn && !emailVerified && <div><h2 className="text-lg font-semibold">Verify your email first</h2><p className="mt-2 text-sm text-content-secondary">The signed-in account must have a verified email matching this invitation.</p><button className="mt-5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white" onClick={() => void load()}>Check again</button></div>}
      {!loading && errorCode === 'invited_email_required' && <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-950"><h2 className="text-lg font-semibold">Switch to the invited patient account</h2><p className="mt-2 text-sm leading-6">You are signed in as <strong>{signedInEmail}</strong>, but this invitation belongs to a different verified email address. For privacy, only the invited patient account can review or accept it.</p><button className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white" onClick={() => void supabase.auth.signOut().then(() => window.location.reload())}><LogOut className="h-4 w-4" />Sign out and switch account</button></div>}
      {!loading && response && <div className="text-center"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700"><X /></div><h2 className="text-xl font-semibold">Request declined</h2><p className="mt-2 text-sm text-content-secondary">No identity link or access grant was created.</p></div>}
      {!loading && !response && preview && <div>
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><div className="flex gap-3"><TestTube2 className="mt-0.5 h-5 w-5 shrink-0" /><div><strong>Synthetic pilot only.</strong><p className="mt-1">This workflow uses fictional demo records. It is not approved for production patient data.</p></div></div></div>
        <section className="mb-5 overflow-hidden rounded-xl border border-indigo-200 bg-indigo-50"><div className="p-5"><p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">Your provider has information ready</p><h2 className="mt-1 text-xl font-semibold text-indigo-950">{preview.dataSummary.profileDetails + preview.dataSummary.healthRecords} items are ready for your Health Vault</h2><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5"><DataStat label="Profile details" value={preview.dataSummary.profileDetails} /><DataStat label="Health records" value={preview.dataSummary.healthRecords} /><DataStat label="Labs" value={preview.dataSummary.labs} /><DataStat label="Medications" value={preview.dataSummary.medications} /><DataStat label="Vitals" value={preview.dataSummary.vitals} /></div></div>{preview.dataSummary.clinicalImportEnabled && preview.dataSummary.healthRecords === 0 ? <p className="border-t border-indigo-200 bg-white/70 px-5 py-3 text-xs leading-5 text-indigo-900">Your provider has not included clinical records in this invitation yet. Profile details are ready now.</p> : !preview.dataSummary.clinicalImportEnabled ? <p className="border-t border-indigo-200 bg-white/70 px-5 py-3 text-xs leading-5 text-indigo-900">This roster-only pilot currently includes profile details. Clinical record counts will appear here when provider clinical import is enabled.</p> : null}</section>
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950"><h2 className="text-lg font-semibold">Your Health Vault profile belongs to you</h2><p className="mt-1 text-sm leading-6">Build one secure, organized health profile that grows with you.</p><ul className="mt-3 space-y-2 text-sm leading-6"><li className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-emerald-700" /><span>Keep accepted records, labs, medications, and forms together as they become available.</span></li><li className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-emerald-700" /><span>Reuse your organized information instead of starting from scratch with every future visit.</span></li><li className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-emerald-700" /><span>You keep your profile and accepted information for as long as you keep your Health Vault account.</span></li><li className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-emerald-700" /><span>The provider cannot revoke, take over, or delete your Health Vault profile.</span></li><li className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-emerald-700" /><span>You can stop future provider access while keeping your patient-owned profile.</span></li></ul></div>
        <dl className="grid gap-4 rounded-xl border border-stroke-subtle bg-surface-sunken p-5 sm:grid-cols-2"><div><dt className="text-xs font-semibold uppercase tracking-wide text-content-tertiary">Provider</dt><dd className="mt-1 font-semibold">{preview.providerDisplayName}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-content-tertiary">Roster patient</dt><dd className="mt-1 font-semibold">{preview.patientDisplayName}</dd>{preview.organizationPatientNumber && <dd className="text-xs text-content-tertiary">Patient number {preview.organizationPatientNumber}</dd>}</div><div><dt className="text-xs font-semibold uppercase tracking-wide text-content-tertiary">Purpose</dt><dd className="mt-1 capitalize">{readable(preview.purpose)}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-content-tertiary">Access ends</dt><dd className="mt-1">{new Date(preview.accessExpiresAt).toLocaleString()}</dd></div><div className="sm:col-span-2"><dt className="text-xs font-semibold uppercase tracking-wide text-content-tertiary">Approved fields</dt><dd className="mt-2 flex flex-wrap gap-2">{preview.scope.map((item) => <span key={item} className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold capitalize text-indigo-700">{readable(item)}</span>)}</dd></div><div className="sm:col-span-2"><dt className="text-xs font-semibold uppercase tracking-wide text-content-tertiary">Consent record</dt><dd className="mt-1 font-mono text-xs">{preview.consentVersion}</dd></div></dl>
        <label className="mt-5 flex cursor-pointer gap-3 rounded-lg border border-stroke-default p-4 text-sm"><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} className="mt-0.5 h-4 w-4" /><span>I understand this is a synthetic pilot. I approve importing the listed provider-supplied profile and clinical information into my patient-owned Health Vault and granting the provider time-limited access. My Health Vault profile and accepted information remain under my control.</span></label>
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row"><button disabled={busy} className="flex-1 rounded-lg border border-stroke-default px-4 py-3 text-sm font-semibold disabled:opacity-60" onClick={() => void respond('deny')}>Not now</button><button disabled={busy || !acknowledged} className="flex-1 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" onClick={() => void respond('accept')}>{busy ? 'Creating your connection...' : 'Accept and connect my Health Vault'}</button></div>
        <p className="mt-4 text-center text-xs text-content-tertiary">Invitation expires {new Date(preview.expiresAt).toLocaleString()}.</p>
      </div>}
      {error && errorCode !== 'invited_email_required' && <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    </div>
  </section></main>;
}

function DataStat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-indigo-100 bg-white px-3 py-3 text-center"><strong className="block text-xl text-indigo-950">{value}</strong><span className="mt-1 block text-[11px] font-medium leading-4 text-indigo-700">{label}</span></div>;
}
