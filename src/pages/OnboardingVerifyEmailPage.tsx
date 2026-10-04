import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { OnboardingAssistantPanel, QuickAction } from '../components/OnboardingAssistantPanel';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';

interface OnboardingVerifyEmailPageProps {
  darkMode?: boolean;
  email: string;
  onNext: () => void;
  onBack: () => void;
}

export function OnboardingVerifyEmailPage({ darkMode = false, email, onNext, onBack }: OnboardingVerifyEmailPageProps) {
  const [verificationEmail, setVerificationEmail] = useState(email);
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const requestPending = useRef(false);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleVerify = async () => {
    const codeString = code.trim();
    if (requestPending.current || !codeString || !verificationEmail.trim()) return;
    requestPending.current = true;
    setIsVerifying(true);
    setError('');

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: verificationEmail.trim(),
        token: codeString,
        type: 'signup'
      });

      if (verifyError) throw verifyError;
      if (!data.session) throw new Error('Verification failed');

      // Mark email as verified in user_profiles
      const userId = data.session.user.id;
      await supabase
        .from('user_profiles')
        .upsert({ user_id: userId, email_verified: true }, { onConflict: 'user_id' });

      onNext();
    } catch (error: any) {
      setError('The code could not be verified. Enter the complete latest code, or request a new one if it has expired.');
      setCode('');
      inputRef.current?.focus();
    } finally {
      requestPending.current = false;
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (requestPending.current || resendTimer > 0 || !verificationEmail.trim()) return;
    requestPending.current = true;
    setIsResending(true);
    setError('');
    setCode('');

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: verificationEmail.trim()
      });

      if (resendError) throw resendError;

      setResendTimer(60);
    } catch (error: any) {
      setError('Failed to resend code. Please try again.');
    } finally {
      requestPending.current = false;
      setIsResending(false);
    }
  };

  const quickActions: QuickAction[] = [
    { label: "Change my email", onClick: onBack },
  ];

  const suggestedQuestions = [
    "Why do I need to verify my email?",
    "I didn't receive a code — what should I do?",
    "How long is the verification code valid?",
  ];


  return (
    <OnboardingLayout
      currentStep={1}
      darkMode={darkMode}
      onBack={onBack}
      assistant={
        <OnboardingAssistantPanel
          step="1 of 5"
          title="Verify Your Email"
          message="Enter the complete verification code from your email, then select Verify email."
          quickActions={quickActions}
          suggestedQuestions={suggestedQuestions}
          darkMode={darkMode}
        />
      }
    >
      <div className="hv-surface-card hv-surface-card--flat p-8">
        <button
          onClick={onBack}
          className={`flex items-center gap-2 mb-6 text-sm font-medium transition-colors ${
            darkMode
              ? 'text-content-secondary hover:text-content-primary'
              : 'text-content-secondary hover:text-content-primary'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="mb-8 text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            darkMode ? 'bg-emerald-900/20' : 'bg-emerald-50'
          }`}>
            <Mail className={`w-8 h-8 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${
            darkMode ? 'text-white' : 'text-content-primary'
          }`}>
            Verify Your Email
          </h2>
          <p className={`text-sm ${
            darkMode ? 'text-content-secondary' : 'text-content-secondary'
          }`}>
            Enter the complete code sent to
          </p>
          <p className={`text-sm font-medium ${
            darkMode ? 'text-emerald-400' : 'text-emerald-600'
          }`}>
            {email}
          </p>
        </div>

        <div className="mb-6">
          <form onSubmit={(event) => { event.preventDefault(); void handleVerify(); }}>
            {!email && (
              <div className="mb-4">
                <label htmlFor="verification-email" className="block text-sm font-medium text-content-primary mb-2">Account email</label>
                <input id="verification-email" type="email" autoComplete="email" required value={verificationEmail}
                  onChange={(event) => setVerificationEmail(event.target.value)} disabled={isVerifying || isResending}
                  className="w-full min-h-12 px-4 py-3 rounded-lg border border-stroke-default bg-surface-raised text-content-primary text-base" />
              </div>
            )}
            <label htmlFor="email-verification-code" className="block text-sm font-medium text-content-primary mb-2">
              Verification code
            </label>
            <input
              id="email-verification-code"
              ref={inputRef}
              type="text"
              autoComplete="one-time-code"
              autoCapitalize="none"
              spellCheck={false}
              value={code}
              onChange={(event) => { setCode(event.target.value); setError(''); }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'verification-code-error' : undefined}
              className="w-full min-h-12 px-4 py-3 rounded-lg border border-stroke-default bg-surface-raised text-content-primary text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus"
              disabled={isVerifying || isResending}
              required
            />
            <Button type="submit" className="w-full min-h-12 mt-4" disabled={!code.trim() || isVerifying || isResending}>
              {isVerifying ? 'Verifying…' : 'Verify email'}
            </Button>
          </form>

          {error && (
            <p id="verification-code-error" role="alert" className="text-red-500 text-sm text-center mb-4">{error}</p>
          )}

          {isVerifying && (
            <p className={`text-sm text-center ${
              darkMode ? 'text-content-secondary' : 'text-content-secondary'
            }`}>
              Verifying code...
            </p>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={handleResend}
            disabled={resendTimer > 0 || isResending || isVerifying}
            className={`text-sm font-medium transition-colors ${
              resendTimer > 0 || isResending
                ? darkMode
                  ? 'text-content-secondary cursor-not-allowed'
                  : 'text-content-secondary cursor-not-allowed'
                : darkMode
                  ? 'text-emerald-400 hover:text-emerald-300'
                  : 'text-emerald-600 hover:text-emerald-700'
            }`}
          >
            {isResending
              ? 'Sending...'
              : resendTimer > 0
                ? `Resend code in ${resendTimer}s`
                : 'Resend code'
            }
          </button>
        </div>

        <div className={`mt-6 p-4 rounded-lg ${
          darkMode ? 'bg-surface-sunken' : 'bg-surface-sunken'
        }`}>
          <p className={`text-sm ${
            darkMode ? 'text-content-secondary' : 'text-content-secondary'
          }`}>
            Use the latest code you received. If you don't receive it within a few minutes, check your spam folder or request a new code.
          </p>
        </div>
      </div>
    </OnboardingLayout>
  );
}
