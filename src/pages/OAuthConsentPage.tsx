import { useCallback, useEffect, useState } from 'react';
import type { OAuthAuthorizationDetails } from '@supabase/supabase-js';
import { Check, LockKeyhole, ShieldCheck, X } from 'lucide-react';
import { LoginPage } from './LoginPage';
import { supabase } from '../lib/supabase';

type ConsentState =
  | { status: 'loading' }
  | { status: 'login-required' }
  | { status: 'ready'; details: OAuthAuthorizationDetails }
  | { status: 'error'; message: string };

const scopeLabels: Record<string, string> = {
  openid: 'Verify your Health Vault identity',
  email: 'View your account email address',
  profile: 'View your basic account profile',
};

function redirectToClient(redirectUrl: string) {
  window.location.assign(redirectUrl);
}

export function OAuthConsentPage() {
  const authorizationId = new URLSearchParams(window.location.search).get('authorization_id');
  const [state, setState] = useState<ConsentState>({ status: 'loading' });
  const [submitting, setSubmitting] = useState<'approve' | 'deny' | null>(null);

  const loadAuthorization = useCallback(async () => {
    if (!authorizationId) {
      setState({ status: 'error', message: 'This authorization request is missing its ID.' });
      return;
    }

    setState({ status: 'loading' });
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      setState({ status: 'error', message: 'We could not verify your Health Vault session.' });
      return;
    }
    if (!sessionData.session) {
      setState({ status: 'login-required' });
      return;
    }

    const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
    if (error || !data) {
      setState({
        status: 'error',
        message: error?.message || 'This authorization request is invalid or has expired.',
      });
      return;
    }

    if (!('authorization_id' in data)) {
      redirectToClient(data.redirect_url);
      return;
    }

    setState({ status: 'ready', details: data });
  }, [authorizationId]);

  useEffect(() => {
    void loadAuthorization();
  }, [loadAuthorization]);

  const decide = async (decision: 'approve' | 'deny') => {
    if (!authorizationId || submitting) return;

    setSubmitting(decision);
    const result = decision === 'approve'
      ? await supabase.auth.oauth.approveAuthorization(authorizationId, {
          skipBrowserRedirect: true,
        })
      : await supabase.auth.oauth.denyAuthorization(authorizationId, {
          skipBrowserRedirect: true,
        });

    if (result.error || !result.data) {
      setState({
        status: 'error',
        message: result.error?.message || 'We could not complete your authorization decision.',
      });
      setSubmitting(null);
      return;
    }

    redirectToClient(result.data.redirect_url);
  };

  if (state.status === 'login-required') {
    const startOnboarding = () => {
      const returnTo = `${window.location.pathname}${window.location.search}`;
      window.location.assign(`/?app=onboarding&source=chatgpt&return_to=${encodeURIComponent(returnTo)}`);
    };
    return (
      <LoginPage
        onLoginSuccess={() => void loadAuthorization()}
        onCancel={() => window.location.assign('/')}
        title="Sign in to connect Health Vault"
        description="Use your Health Vault account to review this access request."
        onCreateAccount={startOnboarding}
        allowSignup
      />
    );
  }

  if (state.status === 'loading') {
    return (
      <main className="min-h-screen bg-stone-50 grid place-items-center p-6">
        <div className="text-center" role="status" aria-live="polite">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-stone-200 border-t-emerald-600" />
          <p className="text-stone-600">Loading authorization request…</p>
        </div>
      </main>
    );
  }

  if (state.status === 'error') {
    return (
      <main className="min-h-screen bg-stone-50 grid place-items-center p-6">
        <section className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-stone-900">Unable to connect</h1>
          <p className="mt-3 text-stone-600">{state.message}</p>
          <a className="mt-6 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800" href="/">
            Return to Health Vault
          </a>
        </section>
      </main>
    );
  }

  const { details } = state;
  const scopes = details.scope.split(/\s+/).filter(Boolean);

  return (
    <main className="min-h-screen bg-stone-50 grid place-items-center p-6">
      <section className="w-full max-w-xl overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-lg">
        <div className="border-b border-stone-200 px-8 py-7">
          <div className="flex items-center gap-4">
            <img src="/hv_logo-light.png" alt="Health Vault" className="h-12 w-12 object-contain" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Health Vault</p>
              <h1 className="mt-1 text-2xl font-semibold text-stone-900">Connect {details.client.name}</h1>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-8 py-7">
          <p className="text-stone-700">
            <strong>{details.client.name}</strong> is requesting permission to access your Health Vault on your behalf.
          </p>

          <div className="rounded-xl border border-stone-200 bg-stone-50 p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-stone-900">
              <ShieldCheck className="h-5 w-5 text-emerald-700" aria-hidden="true" />
              This connection can
            </div>
            <ul className="space-y-3 text-sm text-stone-700">
              {scopes.map((scope) => (
                <li key={scope} className="flex gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                  <span>{scopeLabels[scope] || `Use the ${scope} permission`}</span>
                </li>
              ))}
              <li className="flex gap-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                <span>Read your health summary through the Health Vault assistant</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-950">
            <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>
              Access is limited to your signed-in account and protected by Health Vault database policies. You can deny this request now or revoke access later.
            </p>
          </div>

          <p className="text-xs text-stone-500">
            Signed in as {details.user.email}
          </p>

          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void decide('deny')}
              disabled={submitting !== null}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-stone-300 px-5 py-3 font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              {submitting === 'deny' ? 'Denying…' : 'Deny'}
            </button>
            <button
              type="button"
              onClick={() => void decide('approve')}
              disabled={submitting !== null}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              {submitting === 'approve' ? 'Connecting…' : 'Allow access'}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
