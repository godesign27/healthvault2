import { Check, KeyRound, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { LoginPage } from './LoginPage';
import { supabase } from '../lib/supabase';
import { getProviderInvitationStep } from '../lib/provider-invitation-flow';

interface InvitationPreview {
  providerDisplayName: string;
  roles: string[];
  expiresAt: string;
}

async function functionErrorDetail(data: unknown, invokeError: unknown) {
  const payload = data as { error?: string; code?: string } | null;
  if (payload?.error) return payload;
  const context = (invokeError as { context?: Response } | null)?.context;
  if (context && typeof context.json === 'function') {
    try { return await context.clone().json() as { error?: string; code?: string }; } catch { /* use SDK fallback */ }
  }
  return { error: (invokeError as { message?: string } | null)?.message ?? 'Unable to load this invitation.' };
}

function readableRole(role: string) {
  return role.replace(/_/g, ' ');
}

export function ProviderInvitationPage({ invitationId }: { invitationId: string }) {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [hasVerifiedTotp, setHasVerifiedTotp] = useState(false);
  const [currentAal, setCurrentAal] = useState<string | null>(null);
  const [verifiedFactorId, setVerifiedFactorId] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<{ factorId: string; qrCode: string; secret: string } | null>(null);
  const [code, setCode] = useState('');
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [currentEmail, setCurrentEmail] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [usePasswordSignIn, setUsePasswordSignIn] = useState(false);

  const step = useMemo(() => getProviderInvitationStep({ loading, signedIn, emailVerified, hasVerifiedTotp, currentAal, accepted }), [loading, signedIn, emailVerified, hasVerifiedTotp, currentAal, accepted]);

  const loadSecurityState = useCallback(async () => {
    setLoading(true);
    setError('');
    setErrorCode('');
    const [{ data: sessionData }, { data: factorData }, { data: assuranceData }] = await Promise.all([
      supabase.auth.getSession(),
      supabase.auth.mfa.listFactors(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);
    const user = sessionData.session?.user;
    setCurrentEmail(user?.email ?? '');
    const verifiedTotp = factorData?.totp.find((factor) => factor.status === 'verified') ?? null;
    setSignedIn(Boolean(user));
    setEmailVerified(Boolean(user?.email_confirmed_at));
    setHasVerifiedTotp(Boolean(verifiedTotp));
    setVerifiedFactorId(verifiedTotp?.id ?? null);
    setCurrentAal(assuranceData?.currentLevel ?? null);
    setLoading(false);

    if (user?.email_confirmed_at) {
      const { data, error: previewError } = await supabase.functions.invoke('provider-invitation-api', {
        body: { action: 'preview', invitationId },
      });
      if (data?.accepted) setAccepted(true);
      else if (previewError || !data?.invitation) {
        const detail = await functionErrorDetail(data, previewError);
        setError(detail.error ?? 'Unable to load this invitation.');
        setErrorCode(detail.code ?? '');
      }
      else setPreview(data.invitation as InvitationPreview);
    }
  }, [invitationId]);

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

  async function acceptInvitation() {
    setBusy(true); setError('');
    const { data, error: acceptError } = await supabase.functions.invoke('provider-invitation-api', {
      body: { action: 'accept', invitationId },
    });
    if (acceptError || !data?.membership) {
      const detail = await functionErrorDetail(data, acceptError);
      setError(detail.error ?? 'Unable to accept this invitation.');
      setErrorCode(detail.code ?? '');
    }
    else setAccepted(true);
    setBusy(false);
  }

  async function verifyEmailCode() {
    if (!/^\d{6,10}$/.test(emailCode) || !/^\S+@\S+\.\S+$/.test(inviteEmail)) { setError('Enter the invited email address and the verification code from the email.'); return; }
    setBusy(true); setError('');
    const { error: verifyError } = await supabase.auth.verifyOtp({ email: inviteEmail.trim().toLowerCase(), token: emailCode, type: 'email' });
    if (verifyError) setError(verifyError.message);
    else { setEmailCode(''); await loadSecurityState(); }
    setBusy(false);
  }

  async function resendEmailCode() {
    if (!/^\S+@\S+\.\S+$/.test(inviteEmail)) { setError('Enter the invited email address first.'); return; }
    setBusy(true); setError('');
    const { error: resendError } = await supabase.auth.signInWithOtp({ email: inviteEmail.trim().toLowerCase(), options: { shouldCreateUser: false, emailRedirectTo: window.location.href } });
    if (resendError) setError(resendError.message); else setError('A new verification code was requested. Check your email.');
    setBusy(false);
  }

  if (step === 'sign_in') {
    if (usePasswordSignIn) return <LoginPage title="Provider invitation" description="Sign in with an existing Health Vault password." allowSignup={false} onLoginSuccess={() => void loadSecurityState()} onCancel={() => setUsePasswordSignIn(false)} />;
    return <main className="min-h-screen bg-surface-page px-4 py-10 sm:py-16"><section className="mx-auto w-full max-w-md rounded-2xl border border-stroke-subtle bg-surface-raised p-7 shadow-lg"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white"><ShieldCheck aria-hidden="true" /></div><p className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">Health Vault Provider Portal</p><h1 className="mt-1 text-2xl font-bold">Activate your practitioner account</h1><p className="mt-2 text-sm leading-6 text-content-secondary">Enter the email address that received the invitation and the verification code from that email. This code is not a password or authenticator code.</p><form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); void verifyEmailCode(); }}><label className="block text-sm font-medium">Invited email<input type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="practitioner@example.com" className="mt-2 w-full rounded-lg border border-stroke-default px-4 py-3" /></label><label className="block text-sm font-medium">Email verification code<input inputMode="numeric" autoComplete="one-time-code" maxLength={10} value={emailCode} onChange={(event) => setEmailCode(event.target.value.replace(/\D/g, ''))} placeholder="Code from your email" className="mt-2 w-full rounded-lg border border-stroke-default px-4 py-3 text-center text-xl tracking-[0.3em]" /></label><button type="submit" disabled={busy} className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{busy ? 'Verifying…' : 'Verify email and continue'}</button></form><div className="mt-4 flex flex-col gap-2 text-center text-sm"><button type="button" disabled={busy} onClick={() => void resendEmailCode()} className="font-semibold text-indigo-700">Request a new email code</button><button type="button" onClick={() => setUsePasswordSignIn(true)} className="text-content-secondary underline">Already have a password? Sign in</button></div>{error && <div role="alert" className={`mt-5 rounded-lg border p-3 text-sm ${error.startsWith('A new') ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'}`}>{error}</div>}</section></main>;
  }

  return (
    <main className="min-h-screen bg-surface-page px-4 py-10 sm:py-16">
      <section className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-stroke-subtle bg-surface-raised shadow-lg">
        <header className="border-b border-stroke-subtle px-6 py-6 sm:px-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white"><ShieldCheck aria-hidden="true" /></div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-content-tertiary">Health Vault Provider Portal</p>
          <h1 className="text-2xl font-bold text-content-primary">Secure provider invitation</h1>
          <p className="mt-2 text-sm leading-6 text-content-secondary">Identity and multi-factor verification are required before provider access is activated.</p>
        </header>

        <div className="px-6 py-7 sm:px-8">
          {step === 'loading' && <div className="flex items-center gap-3 text-content-secondary"><Loader2 className="animate-spin" aria-hidden="true" />Checking invitation security...</div>}
          {step === 'verify_email' && <div><h2 className="text-lg font-semibold text-content-primary">Verify your email first</h2><p className="mt-2 text-sm leading-6 text-content-secondary">This invitation can only be accepted by a confirmed email address. Verify your Health Vault email, then return to this page.</p><button className="mt-5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white" onClick={() => void loadSecurityState()}>Check again</button></div>}
          {step === 'enroll_mfa' && <div><h2 className="text-lg font-semibold text-content-primary">Set up an authenticator</h2><p className="mt-2 text-sm leading-6 text-content-secondary">Provider accounts require a time-based one-time password from an authenticator app.</p>{!enrollment ? <button className="mt-5 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60" disabled={busy} onClick={() => void startEnrollment()}><KeyRound className="h-4 w-4" />Set up authenticator</button> : <div className="mt-5 rounded-xl border border-stroke-subtle bg-surface-sunken p-5"><img src={enrollment.qrCode} alt="Authenticator enrollment QR code" className="mx-auto h-44 w-44 rounded-lg bg-white p-2" /><p className="mt-4 text-center text-xs text-content-tertiary">Manual key: <code className="select-all">{enrollment.secret}</code></p><CodeForm code={code} setCode={setCode} busy={busy} label="Verify and continue" onSubmit={() => void verifyCode(enrollment.factorId)} /></div>}</div>}
          {step === 'challenge_mfa' && <div><LockKeyhole className="mb-4 text-indigo-600" aria-hidden="true" /><h2 className="text-lg font-semibold text-content-primary">Confirm it is you</h2><p className="mt-2 text-sm leading-6 text-content-secondary">Enter the current six-digit code from your authenticator app to continue.</p><CodeForm code={code} setCode={setCode} busy={busy} label="Verify identity" onSubmit={() => verifiedFactorId && void verifyCode(verifiedFactorId)} /></div>}
          {step === 'ready' && <div><h2 className="text-lg font-semibold text-content-primary">Review provider access</h2>{preview ? <div className="mt-4 rounded-xl border border-stroke-subtle bg-surface-sunken p-5"><p className="text-sm text-content-secondary">Organization</p><strong className="mt-1 block text-content-primary">{preview.providerDisplayName}</strong><p className="mt-4 text-sm text-content-secondary">Assigned roles</p><div className="mt-2 flex flex-wrap gap-2">{preview.roles.map((role) => <span key={role} className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold capitalize text-indigo-700">{readableRole(role)}</span>)}</div><p className="mt-4 text-xs text-content-tertiary">Expires {new Date(preview.expiresAt).toLocaleString()}</p></div> : <p className="mt-3 text-sm text-content-secondary">Loading invitation details...</p>}<button className="mt-5 w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={busy || !preview} onClick={() => void acceptInvitation()}>{busy ? 'Activating access...' : 'Accept provider invitation'}</button></div>}
          {step === 'accepted' && <div className="text-center"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Check aria-hidden="true" /></div><h2 className="text-xl font-semibold text-content-primary">Provider access activated</h2><p className="mt-2 text-sm leading-6 text-content-secondary">Your membership is active. Continue to your secure provider workspace.</p><button type="button" onClick={() => { window.location.href = '/provider'; }} className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white">Go to provider workspace</button></div>}
          {errorCode === 'email_mismatch' ? <div role="alert" className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><strong>This invitation belongs to a different email.</strong><p className="mt-1">You are signed in as {currentEmail}. Sign out, then sign in as the email address that received this invitation.</p><button type="button" className="mt-4 rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white" onClick={() => void supabase.auth.signOut().then(() => loadSecurityState())}>Sign out and switch account</button></div> : error && <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        </div>
      </section>
    </main>
  );
}

function CodeForm({ code, setCode, busy, label, onSubmit }: { code: string; setCode: (value: string) => void; busy: boolean; label: string; onSubmit: () => void }) {
  return <form className="mt-5 space-y-3" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}><label className="block text-sm font-medium text-content-primary" htmlFor="provider-mfa-code">Six-digit code</label><input id="provider-mfa-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} className="w-full rounded-lg border border-stroke-default bg-surface-raised px-4 py-3 text-center text-xl tracking-[0.4em] text-content-primary focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /><button type="submit" disabled={busy} className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{busy ? 'Verifying...' : label}</button></form>;
}
