import { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertCircle, Loader2, ArrowRight, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';

const EHR_SOURCE_LABELS: Record<string, string> = {
  athenahealth: 'Athena Health',
  elation: 'Elation Health',
  charmhealth: 'CharmHealth',
  openemr: 'OpenEMR',
  eclinicalworks: 'eClinicalWorks',
  nextech: 'Nextech',
  healthgorilla: 'Health Gorilla',
};

type Step = 'loading' | 'login' | 'connect' | 'submitting' | 'success' | 'error';

export default function EhrConnectPage() {
  const token = new URLSearchParams(window.location.search).get('token') ?? '';

  const [step, setStep] = useState<Step>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [tokenRecord, setTokenRecord] = useState<{
    id: string;
    ehr_source: string;
    provider_name: string;
    expires_at: string;
  } | null>(null);

  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Connection form
  const [patientId, setPatientId] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  useEffect(() => {
    if (!token) {
      setErrorMsg('No authorization token found in the link. Please use the link from your email.');
      setStep('error');
      return;
    }
    checkSession();
  }, []);

  async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await validateToken(session.user.id);
    } else {
      setStep('login');
    }
  }

  async function validateToken(userId: string) {
    setStep('loading');
    const { data, error } = await supabase
      .from('ehr_auth_tokens')
      .select('id, ehr_source, provider_name, expires_at, used_at')
      .eq('token', token)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      setErrorMsg('This link is invalid or does not belong to your account.');
      setStep('error');
      return;
    }

    if (data.used_at) {
      setErrorMsg('This link has already been used. Your EHR provider is already connected.');
      setStep('error');
      return;
    }

    if (new Date(data.expires_at) < new Date()) {
      setErrorMsg('This link has expired. Please request a new connection link.');
      setStep('error');
      return;
    }

    setTokenRecord(data);
    setStep('connect');
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoggingIn(false);
    if (error || !data.user) {
      setLoginError(error?.message ?? 'Login failed. Please try again.');
      return;
    }
    await validateToken(data.user.id);
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!tokenRecord) return;

    if (!patientId.trim()) return;
    if (tokenRecord.ehr_source === 'athenahealth' && !departmentId.trim()) return;

    setStep('submitting');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setErrorMsg('Session expired. Please log in again.'); setStep('error'); return; }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const res = await fetch(`${supabaseUrl}/functions/v1/trigger-ehr-fetch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          Apikey: anonKey,
        },
        body: JSON.stringify({
          ehrSource: tokenRecord.ehr_source,
          ehrPatientId: patientId.trim(),
          ehrDepartmentId: departmentId.trim() || undefined,
          providerName: tokenRecord.provider_name,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrorMsg(body.error ?? 'Connection failed. Please try again.');
        setStep('error');
        return;
      }

      // Mark token as used
      await supabase
        .from('ehr_auth_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('id', tokenRecord.id);

      setStep('success');
    } catch {
      setErrorMsg('An unexpected error occurred. Please try again.');
      setStep('error');
    }
  }

  const ehrLabel = tokenRecord ? (EHR_SOURCE_LABELS[tokenRecord.ehr_source] ?? tokenRecord.ehr_source) : '';

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">Verifying your link…</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (step === 'error') {
    return (
      <Shell>
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Unable to connect</h1>
            <p className="mt-1 text-sm text-gray-500 max-w-sm">{errorMsg}</p>
          </div>
          <a
            href="/"
            className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Return to Health Vault
          </a>
        </div>
      </Shell>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <Shell>
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-green-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{ehrLabel} connected</h1>
            <p className="mt-1 text-sm text-gray-500 max-w-sm">
              Your records are being imported. They'll appear in your Health Vault within a few minutes.
            </p>
          </div>
          <a
            href="/"
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Go to Health Records <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </Shell>
    );
  }

  // ── Login ────────────────────────────────────────────────────────────────────
  if (step === 'login') {
    return (
      <Shell>
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Sign in to connect your EHR</h1>
            <p className="mt-1 text-sm text-gray-500">
              Log in to your Health Vault account to complete the provider connection.
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {loginError && (
              <p className="text-sm text-red-600">{loginError}</p>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-2.5 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {loggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loggingIn ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </Shell>
    );
  }

  // ── Connect form ─────────────────────────────────────────────────────────────
  const isAthena = tokenRecord?.ehr_source === 'athenahealth';
  const canSubmit = patientId.trim() && (!isAthena || departmentId.trim());

  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">
            Connect {tokenRecord?.provider_name ?? ehrLabel}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter the patient ID from your {ehrLabel} account to import your records.
          </p>
        </div>

        <form onSubmit={handleConnect} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Patient ID in {ehrLabel}
            </label>
            <input
              type="text"
              required
              value={patientId}
              onChange={e => setPatientId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g. 12345"
            />
            <p className="mt-1 text-xs text-gray-400">
              Find this in your patient portal or ask your provider's front desk.
            </p>
          </div>

          {isAthena && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department ID
              </label>
              <input
                type="text"
                required
                value={departmentId}
                onChange={e => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. 1"
              />
              <p className="mt-1 text-xs text-gray-400">
                Required for Athena Health. Your provider can supply this.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={step === 'submitting' || !canSubmit}
            className="w-full py-2.5 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {step === 'submitting' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {step === 'submitting' ? 'Connecting…' : 'Connect & import records'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
          <Lock className="w-3 h-3" />
          Your credentials are never stored. Records are fetched via a HIPAA-compliant integration.
        </p>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img src="/hv_logo-dark.png" alt="Health Vault" className="h-8 mx-auto" />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {children}
        </div>
        <p className="mt-6 text-center text-xs text-gray-400">
          HIPAA-compliant &middot; 256-bit encrypted &middot; Health Vault
        </p>
      </div>
    </div>
  );
}
