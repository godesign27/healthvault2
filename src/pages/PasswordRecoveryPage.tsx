import { useState, type FormEvent } from 'react';
import { KeyRound } from 'lucide-react';

interface PasswordRecoveryPageProps {
  onSave: (password: string, confirmation: string) => Promise<void>;
  onCancel: () => Promise<void>;
}

export function PasswordRecoveryPage({ onSave, onCancel }: PasswordRecoveryPageProps) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    setNotice('');
    try {
      await onSave(password, confirmation);
      setPassword('');
      setConfirmation('');
      setNotice('Password updated. Sign in with your new password.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update your password. Request a new link.');
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
      setError('Unable to sign out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-sunken p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-center text-2xl font-bold text-content-primary">Set new password</h1>
        <p className="mb-8 text-center text-content-secondary">Choose a new password for your Health Vault.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="mb-2 block text-sm font-medium text-content-primary">
              New password (at least 12 characters)
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-stroke-default px-4 py-2.5 text-content-primary focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-content-primary">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-stroke-default px-4 py-2.5 text-content-primary focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          {error ? (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : null}
          {notice ? <p className="text-sm text-content-secondary">{notice}</p> : null}
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
