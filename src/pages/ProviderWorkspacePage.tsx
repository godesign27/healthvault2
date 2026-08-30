import { Building2, FileJson, KeyRound, Loader2, LockKeyhole, LogOut, ShieldCheck, Stethoscope, UserCog, UsersRound } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getProviderWorkspaceStep } from '../lib/provider-workspace';
import { supabase } from '../lib/supabase';
import { RosterImportPanel } from '../components/provider/RosterImportPanel';
import { PractitionerPanelManager } from '../components/provider/PractitionerPanelManager';
import { ProviderMembersPanel } from '../components/provider/ProviderMembersPanel';
import { PatientAccessInvitationsPanel } from '../components/provider/PatientAccessInvitationsPanel';
import { ProviderAuditPanel } from '../components/provider/ProviderAuditPanel';
import { ClinicalImportPanel } from '../components/provider/ClinicalImportPanel';
import { PractitionerImportPanel } from '../components/provider/PractitionerImportPanel';
import { Drawer } from '../components/ui/Drawer';
import { LoginPage } from './LoginPage';

interface Workspace {
  account: { id: string; display_name: string; legal_name: string; slug: string; provider_type: string; status: string };
  membership: { id: string; roles: string[]; permissions: string[]; status: string };
}

function readable(value: string) { return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); }

export function ProviderWorkspacePage() {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [signedInEmail, setSignedInEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [hasVerifiedTotp, setHasVerifiedTotp] = useState(false);
  const [currentAal, setCurrentAal] = useState<string | null>(null);
  const [verifiedFactorId, setVerifiedFactorId] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<{ factorId: string; qrCode: string; secret: string } | null>(null);
  const [code, setCode] = useState('');
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [rosterTotal, setRosterTotal] = useState<number | null>(null);
  const [section, setSection] = useState<'overview' | 'members' | 'clinical-imports' | 'access' | 'panels'>('overview');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [workspaceAccessDenied, setWorkspaceAccessDenied] = useState(false);
  const [patientImportOpen, setPatientImportOpen] = useState(false);
  const [practitionerImportOpen, setPractitionerImportOpen] = useState(false);
  const [practitionerImportVersion, setPractitionerImportVersion] = useState(0);
  const [showMfaRecovery, setShowMfaRecovery] = useState(false);

  const step = useMemo(() => getProviderWorkspaceStep({ loading, signedIn, emailVerified, hasVerifiedTotp, currentAal, workspaceLoaded: Boolean(workspace) }), [loading, signedIn, emailVerified, hasVerifiedTotp, currentAal, workspace]);

  const loadRoster = useCallback(async (providerAccountId: string) => {
    const { data: rosterData, error: rosterError } = await supabase.functions.invoke('provider-admin-api', {
      body: { action: 'list-roster', providerAccountId },
    });
    if (rosterError) { setError(rosterData?.error ?? rosterError.message); return; }
    setRosterTotal(Number(rosterData?.total ?? 0));
  }, []);

  const loadWorkspace = useCallback(async () => {
    setWorkspaceAccessDenied(false);
    const { data, error: workspaceError } = await supabase.functions.invoke('provider-admin-api', { body: { action: 'resolve-workspace' } });
    if (workspaceError || !data?.workspace) {
      const status = (workspaceError as { context?: Response } | null)?.context?.status;
      setWorkspaceAccessDenied(status === 403);
      setError(data?.error ?? (status === 403 ? 'This signed-in account does not have active provider workspace access.' : workspaceError?.message) ?? 'Unable to load your provider workspace.');
      return;
    }
    const nextWorkspace = data.workspace as Workspace;
    setWorkspace(nextWorkspace);
    if (nextWorkspace.membership.permissions.includes('imports.read')) await loadRoster(nextWorkspace.account.id);
    else setRosterTotal(null);
  }, [loadRoster]);

  const loadSecurityState = useCallback(async () => {
    setLoading(true); setError('');
    const [{ data: sessionData }, { data: factorData }, { data: assuranceData }] = await Promise.all([
      supabase.auth.getSession(), supabase.auth.mfa.listFactors(), supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);
    const user = sessionData.session?.user;
    const verifiedTotp = factorData?.totp.find((factor) => factor.status === 'verified') ?? null;
    const aal = assuranceData?.currentLevel ?? null;
    setSignedIn(Boolean(user)); setSignedInEmail(user?.email ?? ''); setEmailVerified(Boolean(user?.email_confirmed_at));
    setHasVerifiedTotp(Boolean(verifiedTotp)); setVerifiedFactorId(verifiedTotp?.id ?? null); setCurrentAal(aal);
    setLoading(false);
    if (user?.email_confirmed_at && verifiedTotp && aal === 'aal2') await loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => { void loadSecurityState(); }, [loadSecurityState]);

  async function startEnrollment() {
    setBusy(true); setError('');
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Health Vault Provider Portal' });
    if (enrollError) setError(enrollError.message);
    else setEnrollment({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
    setBusy(false);
  }

  async function verifyCode(factorId: string) {
    if (!/^\d{6}$/.test(code)) { setError('Enter the six-digit code from your authenticator app.'); return; }
    setBusy(true); setError('');
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    if (verifyError) setError(verifyError.message);
    else { setCode(''); setEnrollment(null); await loadSecurityState(); }
    setBusy(false);
  }

  async function switchProviderAccount() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  if (step === 'sign_in') return <LoginPage title="Provider Portal" description="Sign in to securely manage your provider organization." allowSignup={false} onLoginSuccess={() => void loadSecurityState()} onCancel={() => { window.location.href = '/'; }} />;

  if (step !== 'ready') return (
    <main className="min-h-screen bg-surface-page px-4 py-12">
      <section className="mx-auto max-w-xl overflow-hidden rounded-2xl border border-stroke-subtle bg-surface-raised shadow-lg">
        <header className="border-b border-stroke-subtle px-7 py-6"><ShieldCheck className="mb-4 text-indigo-600" /><p className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">Health Vault Provider Portal</p><h1 className="mt-1 text-2xl font-bold text-content-primary">Secure workspace access</h1></header>
        <div className="px-7 py-7">
          {step === 'loading' && <Status icon={<Loader2 className="animate-spin" />} title="Checking your session" body="Verifying provider identity and security requirements." />}
          {step === 'verify_email' && <Status title="Verify your email" body="A confirmed email address is required before provider access can continue." action="Check again" onAction={() => void loadSecurityState()} />}
          {step === 'enroll_mfa' && <div><Status icon={<KeyRound />} title="Set up an authenticator" body="Provider workspaces require a time-based one-time password." />{!enrollment ? <button className="mt-5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white" disabled={busy} onClick={() => void startEnrollment()}>Set up authenticator</button> : <div className="mt-5 rounded-xl border border-stroke-subtle bg-surface-sunken p-5"><img src={enrollment.qrCode} alt="Authenticator enrollment QR code" className="mx-auto h-44 w-44 rounded-lg bg-white p-2" /><p className="mt-3 text-center text-xs text-content-tertiary">Manual key: <code className="select-all">{enrollment.secret}</code></p><CodeForm code={code} setCode={setCode} busy={busy} onSubmit={() => void verifyCode(enrollment.factorId)} /></div>}</div>}
          {step === 'challenge_mfa' && <div><Status icon={<LockKeyhole />} title="Confirm it is you" body="Enter the current code from your authenticator app." /><CodeForm code={code} setCode={setCode} busy={busy} onSubmit={() => verifiedFactorId && void verifyCode(verifiedFactorId)} onLostAuthenticator={() => setShowMfaRecovery(true)} />{showMfaRecovery && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><h3 className="font-semibold">Authenticator recovery</h3><p className="mt-2 leading-6">For your protection, a password alone cannot remove a verified authenticator. Contact a Health Vault super administrator to request an identity-reviewed factor reset. Approval signs out existing sessions and removes only the lost factor.</p><p className="mt-2 leading-6">After approval, sign in again. Health Vault will display a new QR code so you can add the account back to your authenticator app.</p><button type="button" className="mt-4 rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold" onClick={() => void switchProviderAccount()}>Sign out safely</button></div>}</div>}
          {step === 'load_workspace' && (workspaceAccessDenied ? <div><Status title="Switch to your provider account" body={`You are signed in as ${signedInEmail || 'an account'}—this account does not have an active provider membership. Sign in with the email used for your provider workspace.`} /><div className="mt-5 flex flex-wrap gap-3"><button className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white" onClick={() => void switchProviderAccount()}>Switch account</button><button className="rounded-lg border border-stroke-default px-4 py-2.5 text-sm font-semibold text-content-primary" onClick={() => { setError(''); void loadWorkspace(); }}>Try again</button></div></div> : <Status icon={error ? undefined : <Loader2 className="animate-spin" />} title={error ? 'Workspace request interrupted' : 'Loading your workspace'} body={error ? `The secure request did not complete. You are signed in as ${signedInEmail || 'your current account'}.` : 'Resolving your active provider membership and approved access.'} action={error ? 'Try again' : undefined} onAction={() => { setError(''); void loadWorkspace(); }} />)}
          {error && <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        </div>
      </section>
    </main>
  );

  if (!workspace) return null;

  const permissions = workspace.membership.permissions;
  const canReadMembers = permissions.includes('members.read');
  const canManageMembers = permissions.includes('members.manage');
  const canReadImports = permissions.includes('imports.read');
  const canManageImports = permissions.includes('imports.manage');
  const canManagePanels = permissions.includes('patient_panels.manage');
  const isPractitioner = permissions.includes('patients.read_assigned');

  return <main className="min-h-screen bg-surface-page text-content-primary">
    <header className="border-b border-stroke-subtle bg-surface-raised"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8"><div className="flex items-center gap-3"><img src="/hv_logo-light.png" alt="Health Vault" className="h-10 w-10 object-contain" /><div><p className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">Provider Portal</p><strong className="text-sm">{workspace.account.display_name}</strong></div></div><button className="flex items-center gap-2 rounded-lg border border-stroke-default px-3 py-2 text-sm font-medium" onClick={() => void supabase.auth.signOut().then(() => window.location.reload())}><LogOut className="h-4 w-4" />Sign out</button></div></header>
    <div className="provider-workspace-layout mx-auto max-w-[1600px] px-5 py-6 lg:px-8">
      <nav aria-label="Provider workspace" className="space-y-1"><button onClick={() => setSection('overview')} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold ${section === 'overview' ? 'bg-indigo-50 text-indigo-700' : 'text-content-secondary hover:bg-surface-sunken'}`}><Building2 className="h-4 w-4" />Overview</button>{canReadMembers && <button onClick={() => setSection('members')} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold ${section === 'members' ? 'bg-indigo-50 text-indigo-700' : 'text-content-secondary hover:bg-surface-sunken'}`}><UserCog className="h-4 w-4" />Members</button>}{canReadImports && <button onClick={() => setSection('access')} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold ${section === 'access' ? 'bg-indigo-50 text-indigo-700' : 'text-content-secondary hover:bg-surface-sunken'}`}><UsersRound className="h-4 w-4" />Patients</button>}{canReadImports && <button onClick={() => setSection('clinical-imports')} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold ${section === 'clinical-imports' ? 'bg-indigo-50 text-indigo-700' : 'text-content-secondary hover:bg-surface-sunken'}`}><FileJson className="h-4 w-4" />Clinical imports</button>}{(canManagePanels || isPractitioner) && <button onClick={() => setSection('panels')} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold ${section === 'panels' ? 'bg-indigo-50 text-indigo-700' : 'text-content-secondary hover:bg-surface-sunken'}`}><Stethoscope className="h-4 w-4" />{isPractitioner && !canManagePanels ? 'My patients' : 'Practitioner panels'}</button>}</nav>
      <section>
        {section === 'clinical-imports' ? <ClinicalImportPanel providerAccountId={workspace.account.id} /> : <>
        {section === 'overview' ? <><p className="text-sm font-semibold text-indigo-600">{isPractitioner ? 'Practitioner workspace' : 'Pilot workspace'}</p><h1 className="mt-1 text-3xl font-bold">{workspace.account.display_name}</h1><p className="mt-2 text-content-secondary">{isPractitioner ? 'Your secure, consent-gated patient workspace.' : 'A secure, roster-only provider administration environment.'}</p><div className="mt-7 grid gap-4 sm:grid-cols-3"><Metric label={isPractitioner ? 'Patient access' : 'Roster patients'} value={isPractitioner ? 'Assigned only' : String(rosterTotal ?? 0)} /><Metric label="Membership" value="Active" /><Metric label="Security" value="MFA verified" /></div><div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Synthetic demo environment.</strong> The roster contains fictional Synthea records and no clinical information.</div><div className="mt-6 rounded-xl border border-stroke-subtle bg-surface-raised p-6"><h2 className="text-lg font-semibold">Your access</h2><div className="mt-3 flex flex-wrap gap-2">{workspace.membership.roles.map((role) => <span key={role} className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">{readable(role)}</span>)}</div></div></> : section === 'members' && canReadMembers ? <ProviderMembersPanel key={practitionerImportVersion} providerAccountId={workspace.account.id} onAddPractitioners={() => setPractitionerImportOpen(true)} /> : section === 'access' && canReadImports ? <PatientAccessInvitationsPanel providerAccountId={workspace.account.id} onImportPatients={() => setPatientImportOpen(true)} /> : <PractitionerPanelManager providerAccountId={workspace.account.id} practitionerView={isPractitioner && !canManagePanels} />}
        {section === 'overview' && workspace.membership.permissions.includes('provider_audit.read') && <ProviderAuditPanel providerAccountId={workspace.account.id} />}
        </>}
      </section>
    </div>
    {canManageImports && <Drawer
      isOpen={patientImportOpen}
      onClose={() => setPatientImportOpen(false)}
      position="right"
      size="large"
      title="Patient roster import"
      className="md:!w-[min(760px,92vw)]"
      showFooter
      footer={<button type="button" onClick={() => setPatientImportOpen(false)} className="w-full rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Done</button>}
    ><RosterImportPanel embedded providerAccountId={workspace.account.id} onRosterChanged={() => loadRoster(workspace.account.id)} /></Drawer>}
    {canManageMembers && <Drawer isOpen={practitionerImportOpen} onClose={() => setPractitionerImportOpen(false)} position="right" size="large" title="Add practitioners" className="md:!w-[min(820px,92vw)]" showFooter footer={<button type="button" onClick={() => setPractitionerImportOpen(false)} className="w-full rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Done</button>}><PractitionerImportPanel providerAccountId={workspace.account.id} onImported={async () => setPractitionerImportVersion((version) => version + 1)} /></Drawer>}
  </main>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-stroke-subtle bg-surface-raised p-5"><p className="text-sm text-content-secondary">{label}</p><strong className="mt-2 block text-2xl">{value}</strong></div>; }
function Status({ icon, title, body, action, onAction }: { icon?: React.ReactNode; title: string; body: string; action?: string; onAction?: () => void }) { return <div>{icon && <div className="mb-4 text-indigo-600">{icon}</div>}<h2 className="text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-content-secondary">{body}</p>{action && <button className="mt-5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white" onClick={onAction}>{action}</button>}</div>; }
function CodeForm({ code, setCode, busy, onSubmit, onLostAuthenticator }: { code: string; setCode: (value: string) => void; busy: boolean; onSubmit: () => void; onLostAuthenticator?: () => void }) { return <form className="mt-5 space-y-3" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}><label htmlFor="workspace-mfa-code" className="block text-sm font-medium">Six-digit code</label><input id="workspace-mfa-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} className="w-full rounded-lg border border-stroke-default px-4 py-3 text-center text-xl tracking-[0.4em] focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /><button type="submit" disabled={busy} className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{busy ? 'Verifying…' : 'Verify identity'}</button>{onLostAuthenticator && <button type="button" className="w-full py-2 text-sm font-semibold text-indigo-700 hover:underline" onClick={onLostAuthenticator}>Lost access to your authenticator?</button>}</form>; }
