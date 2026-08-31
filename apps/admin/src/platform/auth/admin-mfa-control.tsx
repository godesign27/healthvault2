import { KeyRound, Loader2, ShieldCheck, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { getAdminMfaStep, hasRecentTotpInAccessToken } from './admin-mfa';

export function AdminMfaControl({ onAssuranceChange }: { onAssuranceChange: (verified: boolean) => void }) {
  const [loading, setLoading] = useState(true);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [currentAal, setCurrentAal] = useState<string | null>(null);
  const [hasRecentTotp, setHasRecentTotp] = useState(false);
  const [enrollment, setEnrollment] = useState<{ id: string; qrCode: string; secret: string } | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [verifiedNoticeVisible, setVerifiedNoticeVisible] = useState(() => sessionStorage.getItem('hv-admin-mfa-notice-dismissed') !== 'true');

  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    const [{ data: factors, error: factorError }, { data: assurance, error: assuranceError }, { data: sessionData }] = await Promise.all([
      supabase.auth.mfa.listFactors(), supabase.auth.mfa.getAuthenticatorAssuranceLevel(), supabase.auth.getSession(),
    ]);
    if (factorError || assuranceError) setError(factorError?.message ?? assuranceError?.message ?? 'Unable to verify MFA state.');
    const verified = factors?.totp.find((factor) => factor.status === 'verified') ?? null;
    const recent = hasRecentTotpInAccessToken(sessionData.session?.access_token ?? null);
    setFactorId(verified?.id ?? null); setCurrentAal(assurance?.currentLevel ?? null); setHasRecentTotp(recent); setLoading(false);
    onAssuranceChange(Boolean(verified && assurance?.currentLevel === 'aal2' && recent));
  }, [onAssuranceChange]);

  useEffect(() => { void refresh(); }, [refresh]);
  const step = getAdminMfaStep({ loading, hasVerifiedTotp: Boolean(factorId), currentAal, hasRecentTotp });

  async function enroll() {
    setBusy(true); setError('');
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Health Vault Admin' });
    if (enrollError) setError(enrollError.message);
    else setEnrollment({ id: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
    setBusy(false);
  }
  async function verify(id: string) {
    if (!/^\d{6}$/.test(code)) { setError('Enter the six-digit code from your authenticator app.'); return; }
    setBusy(true); setError('');
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId: id, code });
    if (verifyError) setError(verifyError.message);
    else { setCode(''); setEnrollment(null); await refresh(); }
    setBusy(false);
  }

  if (step === 'verified') return verifiedNoticeVisible ? <div className="admin-mfa-banner admin-mfa-verified" role="status"><div className="admin-mfa-copy"><ShieldCheck size={18} /><div><strong>Privileged actions unlocked</strong><p>Your administrator session is verified at AAL2.</p></div></div><button type="button" className="notice-dismiss" aria-label="Dismiss privileged access message" title="Dismiss" onClick={() => { sessionStorage.setItem('hv-admin-mfa-notice-dismissed', 'true'); setVerifiedNoticeVisible(false); }}><X size={18} /></button></div> : null;
  return <div className="admin-mfa-banner"><div className="admin-mfa-copy">{step === 'checking' ? <Loader2 size={18} /> : <KeyRound size={18} />}<div><strong>{step === 'checking' ? 'Checking session assurance' : step === 'enroll' ? 'Authenticator setup required' : 'Verify privileged access'}</strong><p>{step === 'enroll' ? 'Enroll an authenticator before managing provider access.' : 'Enter a current authenticator code to unlock invitations and other provider mutations.'}</p></div></div>{step === 'enroll' && !enrollment && <button type="button" disabled={busy} onClick={() => void enroll()}>Set up authenticator</button>}{enrollment && <div className="admin-mfa-enrollment"><img src={enrollment.qrCode} alt="Admin authenticator enrollment QR code" /><small>Manual key: <code>{enrollment.secret}</code></small></div>}{(step === 'challenge' || enrollment) && <form className="admin-mfa-form" onSubmit={(event) => { event.preventDefault(); const id = enrollment?.id ?? factorId; if (id) void verify(id); }}><label><span>Six-digit code</span><input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} /></label><button type="submit" disabled={busy}>{busy ? 'Verifying…' : 'Verify'}</button></form>}{error && <p className="form-error" role="alert">{error}</p>}</div>;
}
