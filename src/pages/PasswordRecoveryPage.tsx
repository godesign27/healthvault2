import { useResultToast } from '../hooks/useResultToast';
import { useState, type FormEvent } from 'react';
import { KeyRound } from 'lucide-react';
import { PasswordField } from '../components/auth/PasswordField';
import { friendlyRecoveryError, validateNewPassword } from '../lib/password-recovery';

interface PasswordRecoveryPageProps {
  onSave: (password: string, confirmation: string, authenticatorCode: string) => Promise<void>;
  onCancel: () => Promise<void>;
  authenticatorRequired?: boolean;
}

const inputClassName = 'w-full bg-surface-raised rounded-lg border border-stroke-default px-4 py-2.5 text-content-primary focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20';

export function PasswordRecoveryPage({ onSave, onCancel, authenticatorRequired = false }: PasswordRecoveryPageProps) {
  const { notify, feedback } = useResultToast();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [authenticatorCode, setAuthenticatorCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setError('');
    const validation = validateNewPassword(password, confirmation);
    if (validation) { setError(validation); return; }
    if (authenticatorRequired && !/^\d{6}$/.test(authenticatorCode.trim())) { setError('Enter the 6-digit code from your authenticator app.'); return; }
    setLoading(true);
    try {
      await onSave(password, confirmation, authenticatorCode);
      setPassword('');
      setConfirmation('');
      setAuthenticatorCode('');
      notify('Password updated. Sign in with your new password.');
    } catch (err) {
      notify(friendlyRecoveryError(err instanceof Error ? err.message : 'Unable to update your password. Request a new link.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      await onCancel();
    } catch {
      notify('Unable to sign out. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-sunken p-4">
      {feedback}
      <div className="w-full max-w-md rounded-xl bg-surface-raised p-8 shadow-lg">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl">
            <img src="/hv_logo-light.png" alt="Health Vault" className="h-full w-full object-contain" />
          </div>
        </div>
        <h1 className="mb-2 text-center text-2xl font-bold text-content-primary">Set new password</h1>
        <p className="mb-8 text-center text-content-secondary">Choose a new password for your Health Vault.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordField
            id="new-password"
            label="New password (at least 12 characters)"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            disabled={loading}
            inputClassName={inputClassName}
          />
          <PasswordField
            id="confirm-password"
            label="Confirm new password"
            value={confirmation}
            onChange={setConfirmation}
            autoComplete="new-password"
            disabled={loading}
            inputClassName={inputClassName}
          />
          {authenticatorRequired ? (
            <div>
              <label htmlFor="authenticator-code" className="mb-2 block text-sm font-medium text-content-primary">
                Authenticator code
              </label>
              <input
                id="authenticator-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={authenticatorCode}
                onChange={(event) => setAuthenticatorCode(event.target.value)}
                disabled={loading}
                className={inputClassName}
              />
            </div>
          ) : null}
          {error ? (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => { void handleCancel(); }}
            disabled={loading}
            className="text-sm font-medium text-indigo-600 disabled:opacity-50"
          >
            Cancel and sign out
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            <KeyRound className="h-4 w-4" />
            {loading ? 'Updating password...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
