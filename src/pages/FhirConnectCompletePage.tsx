import { useActionFeedback } from '../hooks/useActionFeedback';
import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { LoginPage } from './LoginPage';

export function FhirConnectCompletePage() {
  const { notify, feedback } = useActionFeedback();
  const [status, setStatus] = useState<'loading' | 'signin' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [orgName, setOrgName] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const connectionId = params.get('connectionId');

    if (error) {
      setStatus('error');
      setMessage(error);
      return;
    }

    if (!connectionId) {
      setStatus('error');
      setMessage('Missing connection id.');
      return;
    }

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setStatus('signin');
          return;
        }

        const { data: connection, error: connError } = await supabase
          .from('provider_connections')
          .select('id, status, provider_organization_id, provider_organizations ( name )')
          .eq('id', connectionId)
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (connError || !connection) {
          setStatus('error');
          setMessage('Could not verify the new connection.');
          return;
        }

        if (connection.status !== 'active') {
          setStatus('error');
          setMessage(`Connection status is "${connection.status}". Authorization may not have completed.`);
          return;
        }

        const org = connection.provider_organizations as { name?: string } | null;
        setOrgName(org?.name || 'your provider');
        setStatus('success');
        setMessage('Your provider is connected. You can import records from Health Records.');
        sessionStorage.setItem('fhir_resume_connection_id', connectionId);
      } catch {
        setStatus('error');
        setMessage('Something went wrong verifying your connection.');
      }
    })();
  }, []);

  useEffect(() => {
    if (message && message !== 'Missing connection id.' && (status === 'success' || status === 'error')) notify(message, status === 'success' ? 'success' : 'error');
  }, [message, status, notify]);

  const goToApp = () => {
    window.location.href = '/';
  };

  if (status === 'signin') {
    return (
      <LoginPage
        title="Sign in to verify your connection"
        description="Sign in with the Health Vault account you used to connect your provider. If you started in the mobile app, you can return there and tap Check connection."
        allowSignup={false}
        onLoginSuccess={() => window.location.reload()}
        onCancel={goToApp}
      />
    );
  }

  return (
    <div className="min-h-screen bg-surface-page flex items-center justify-center p-6">
      {feedback}
      <div className="max-w-md w-full rounded-2xl border border-stroke-subtle bg-surface-raised p-8 text-center shadow-sm">
        {status === 'loading' && (
          <>
            <Loader2 className="w-10 h-10 mx-auto mb-4 text-content-secondary animate-spin" />
            <h1 className="text-lg font-semibold text-content-primary">Finishing connection…</h1>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-10 h-10 mx-auto mb-4 text-emerald-600" />
            <h1 className="text-lg font-semibold text-content-primary mb-2">Connected to {orgName}</h1>

            <button
              type="button"
              onClick={goToApp}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-action-primary text-content-on-action rounded-xl font-medium hover:bg-action-primary-hover transition-colors"
            >
              Open Health Vault
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-10 h-10 mx-auto mb-4 text-red-600" />
            <h1 className="text-lg font-semibold text-content-primary mb-2">Connection failed</h1>
            {message === 'Missing connection id.' && <p className="mb-6 text-sm text-content-secondary">{message}</p>}

            <button
              type="button"
              onClick={goToApp}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-stroke-default rounded-xl font-medium text-content-primary hover:bg-surface-sunken transition-colors"
            >
              Back to app
            </button>
          </>
        )}
      </div>
    </div>
  );
}
