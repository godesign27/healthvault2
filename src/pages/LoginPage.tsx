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
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        onLoginSuccess();
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
      darkMode ? 'bg-stone-900' : 'bg-stone-50'
    }`}>
      <div className={`w-full max-w-md rounded-xl shadow-lg overflow-hidden ${
        darkMode ? 'bg-stone-800' : 'bg-white'
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
            darkMode ? 'text-white' : 'text-stone-900'
          }`}>
            {title || (isSignup ? 'Create Admin Account' : 'Admin Login')}
          </h2>
          <p className={`text-center mb-8 ${
            darkMode ? 'text-stone-400' : 'text-stone-600'
          }`}>
            {description || (isSignup ? 'Sign up to create your admin account' : 'Sign in to access the Health Vault dashboard')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-stone-300' : 'text-stone-700'
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
                    ? 'bg-stone-700 border-stone-600 text-white placeholder-stone-400 focus:border-indigo-500'
                    : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 focus:border-indigo-500'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-stone-300' : 'text-stone-700'
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
                    ? 'bg-stone-700 border-stone-600 text-white placeholder-stone-400 focus:border-indigo-500'
                    : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 focus:border-indigo-500'
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
                    ? 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
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
            darkMode ? 'border-stone-700' : 'border-stone-200'
          }`}>
            <p className={`text-sm ${
              darkMode ? 'text-stone-400' : 'text-stone-600'
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
