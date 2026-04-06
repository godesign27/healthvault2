import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { OnboardingAssistantPanel, QuickAction } from '../components/OnboardingAssistantPanel';
import { supabase } from '../lib/supabase';

interface OnboardingVerifyEmailPageProps {
  darkMode?: boolean;
  email: string;
  onNext: () => void;
  onBack: () => void;
}

export function OnboardingVerifyEmailPage({ darkMode = false, email, onNext, onBack }: OnboardingVerifyEmailPageProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setCode(newCode);

    if (pastedData.length === 6) {
      handleVerify(pastedData);
    } else if (pastedData.length > 0) {
      inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
    }
  };

  const handleVerify = async (codeString: string) => {
    setIsVerifying(true);
    setError('');

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email,
        token: codeString,
        type: 'signup'
      });

      if (verifyError) throw verifyError;
      if (!data.session) throw new Error('Verification failed');

      console.log('Email verified successfully');
      onNext();
    } catch (error: any) {
      console.error('Verification failed:', error);
      setError(error.message?.includes('expired')
        ? 'Code expired. Please request a new code.'
        : error.message?.includes('Invalid') || error.message?.includes('invalid')
        ? 'Invalid code. Please check and try again.'
        : 'Verification failed. Please try again.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError('');
    setCode(['', '', '', '', '', '']);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (resendError) throw resendError;

      setResendTimer(60);
    } catch (error: any) {
      console.error('Failed to resend code:', error);
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const quickActions: QuickAction[] = [
    {
      label: "Why do I need to verify my email?",
      onClick: () => alert("Email verification ensures that you have access to the email address you provided and helps keep your account secure. It's a required step to protect your health information.")
    },
    {
      label: "I didn't receive a code",
      onClick: () => alert("Please check your spam/junk folder. If you still don't see it, wait for the timer to expire and click 'Resend Code'.")
    },
    {
      label: "Can I change my email?",
      onClick: onBack
    }
  ];

  const inputClass = `w-12 h-14 text-center text-2xl font-semibold rounded-lg border-2 ${
    error
      ? 'border-red-500 focus:ring-red-500'
      : darkMode
        ? 'bg-stone-800 border-stone-700 text-white focus:border-emerald-500 focus:ring-emerald-500'
        : 'bg-white border-stone-300 text-stone-900 focus:border-emerald-500 focus:ring-emerald-500'
  } focus:outline-none focus:ring-2 transition-colors`;

  return (
    <OnboardingLayout
      currentStep={1}
      darkMode={darkMode}
      onBack={onBack}
      assistant={
        <OnboardingAssistantPanel
          step="1 of 5"
          title="Verify Your Email"
          message="We've sent a 6-digit verification code to your email address. Please enter it below to continue."
          quickActions={quickActions}
          darkMode={darkMode}
        />
      }
    >
      <div className={`rounded-lg border p-8 ${
        darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
      }`}>
        <button
          onClick={onBack}
          className={`flex items-center gap-2 mb-6 text-sm font-medium transition-colors ${
            darkMode
              ? 'text-stone-400 hover:text-stone-300'
              : 'text-stone-600 hover:text-stone-900'
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
            darkMode ? 'text-white' : 'text-stone-900'
          }`}>
            Verify Your Email
          </h2>
          <p className={`text-sm ${
            darkMode ? 'text-stone-400' : 'text-stone-600'
          }`}>
            Enter the 6-digit code sent to
          </p>
          <p className={`text-sm font-medium ${
            darkMode ? 'text-emerald-400' : 'text-emerald-600'
          }`}>
            {email}
          </p>
        </div>

        <div className="mb-6">
          <div className="flex gap-2 justify-center mb-4" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={inputClass}
                disabled={isVerifying}
              />
            ))}
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center mb-4">{error}</p>
          )}

          {isVerifying && (
            <p className={`text-sm text-center ${
              darkMode ? 'text-stone-400' : 'text-stone-600'
            }`}>
              Verifying code...
            </p>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={handleResend}
            disabled={resendTimer > 0 || isResending}
            className={`text-sm font-medium transition-colors ${
              resendTimer > 0 || isResending
                ? darkMode
                  ? 'text-stone-600 cursor-not-allowed'
                  : 'text-stone-400 cursor-not-allowed'
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
          darkMode ? 'bg-stone-800' : 'bg-stone-50'
        }`}>
          <p className={`text-sm ${
            darkMode ? 'text-stone-400' : 'text-stone-600'
          }`}>
            The verification code expires after 60 minutes. If you don't receive it within a few minutes, check your spam folder or request a new code.
          </p>
        </div>
      </div>
    </OnboardingLayout>
  );
}
