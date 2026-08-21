import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onCancel: () => void;
  onCreateAccount?: () => void;
  darkMode?: boolean;
  title?: string;
  description?: string;
  allowSignup?: boolean;
}

export function LoginPage({
  onLoginSuccess,
  onCancel,
  onCreateAccount,
  darkMode = false,
  title,
  description,
  allowSignup = true,
}: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignup, setIsSignup] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignup) {
        // Route to the full onboarding flow instead of bypassing email verification
        onCreateAccount?.();
        return;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        onLoginSuccess();
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${isSignup ? 'sign up' : 'login'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      darkMode ? 'bg-surface-raised' : 'bg-surface-sunken'
    }`}>
      <div className={`w-full max-w-md rounded-xl shadow-lg overflow-hidden ${
        darkMode ? 'bg-surface-sunken' : 'bg-white'
      }`}>
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-xl overflow-hidden">
              <img
                src={darkMode ? "/hv_logo-dark.png" : "/hv_logo-light.png"}
                alt="Health Vault"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <h2 className={`text-2xl font-bold text-center mb-2 ${
            darkMode ? 'text-white' : 'text-content-primary'
          }`}>
            {title || (isSignup ? 'Create Account' : 'Sign In')}
          </h2>
          <p className={`text-center mb-8 ${
            darkMode ? 'text-content-secondary' : 'text-content-secondary'
          }`}>
            {description || (isSignup ? 'Create your Health Vault account' : 'Sign in to your Health Vault')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-content-primary' : 'text-content-primary'
              }`}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                  darkMode
                    ? 'bg-surface-sunken border-stroke-default text-white placeholder:text-content-placeholder focus:border-indigo-500'
                    : 'bg-white border-stroke-default text-content-primary placeholder:text-content-placeholder focus:border-indigo-500'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-content-primary' : 'text-content-primary'
              }`}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                  darkMode
                    ? 'bg-surface-sunken border-stroke-default text-white placeholder:text-content-placeholder focus:border-indigo-500'
                    : 'bg-white border-stroke-default text-content-primary placeholder:text-content-placeholder focus:border-indigo-500'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  darkMode
                    ? 'bg-surface-sunken text-content-primary hover:bg-surface-overlay'
                    : 'bg-surface-sunken text-content-primary hover:bg-surface-overlay'
                } disabled:opacity-50`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                {loading ? (isSignup ? 'Creating account...' : 'Signing in...') : (isSignup ? 'Create Account' : 'Sign In')}
              </button>
            </div>
          </form>

          {allowSignup && <div className={`mt-6 pt-6 border-t text-center ${
            darkMode ? 'border-stroke-default' : 'border-stroke-subtle'
          }`}>
            <p className={`text-sm ${
              darkMode ? 'text-content-secondary' : 'text-content-secondary'
            }`}>
              {isSignup ? 'Already have an account?' : "Don't have an account?"}
              {' '}
              <button
                type="button"
                onClick={() => {
                  if (!isSignup && onCreateAccount) {
                    onCreateAccount();
                  } else {
                    setIsSignup(!isSignup);
                    setError('');
                  }
                }}
                className={`font-medium transition-colors ${
                  darkMode
                    ? 'text-indigo-400 hover:text-indigo-300'
                    : 'text-indigo-600 hover:text-indigo-700'
                }`}
              >
                {isSignup ? 'Sign in' : 'Create an account'}
              </button>
            </p>
          </div>}
        </div>
      </div>
    </div>
  );
}
