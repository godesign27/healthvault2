import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { OnboardingAssistantPanel, QuickAction } from '../components/OnboardingAssistantPanel';
import { supabase } from '../lib/supabase';

interface OnboardingAccountPageProps {
  darkMode?: boolean;
  onNext: (email: string) => void;
  onBack: () => void;
}

export function OnboardingAccountPage({ darkMode = false, onNext, onBack }: OnboardingAccountPageProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      });

      if (signUpError) throw signUpError;

      if (!data.user || data.user.identities?.length === 0) {
        setErrors({ email: 'This email is already registered. Please log in instead.' });
        return;
      }

      onNext(formData.email);
    } catch (error: any) {
      console.error('Failed to create account:', error);
      if (error.message?.includes('already registered') || error.message?.includes('User already registered')) {
        setErrors({ email: 'This email is already registered. Please log in instead.' });
      } else {
        alert(error.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoData = () => {
    const randomNum = Math.floor(Math.random() * 10000);
    setFormData({
      email: `demo${randomNum}@healthvault.com`,
      password: 'DemoPassword123!',
      confirmPassword: 'DemoPassword123!'
    });
  };

  const quickActions: QuickAction[] = [
    { label: "Use demo data", onClick: fillDemoData },
  ];

  const suggestedQuestions = [
    "Why do I need to create an account?",
    "What if I already have an account?",
    "How is my password protected?",
  ];

  const inputClass = (fieldName: string) => `w-full px-4 py-2 pr-12 rounded-lg border ${
    errors[fieldName]
      ? 'border-red-500 focus:ring-red-500'
      : darkMode
        ? 'bg-surface-sunken border-stroke-default text-white focus:ring-emerald-500'
        : 'bg-white border-stroke-default text-content-primary focus:ring-emerald-500'
  } focus:outline-none focus:ring-2`;

  const labelClass = `block text-sm font-medium mb-2 ${
    darkMode ? 'text-content-primary' : 'text-content-primary'
  }`;

  return (
    <OnboardingLayout
      currentStep={1}
      darkMode={darkMode}
      onBack={onBack}
      assistant={
        <OnboardingAssistantPanel
          step="1 of 5"
          title="Create Your Account"
          message="Let's start by creating your secure Health Vault account. You'll use this email and password to access your health information anytime, anywhere."
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
          Back to Home
        </button>

        <div className="mb-6">
          <h2 className={`text-2xl font-bold mb-2 ${
            darkMode ? 'text-white' : 'text-content-primary'
          }`}>
            Create Your Account
          </h2>
          <p className={`text-sm ${
            darkMode ? 'text-content-secondary' : 'text-content-secondary'
          }`}>
            All fields marked with * are required
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={labelClass}>
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="you@example.com"
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.email
                  ? 'border-red-500 focus:ring-red-500'
                  : darkMode
                    ? 'bg-surface-sunken border-stroke-default text-white focus:ring-emerald-500'
                    : 'bg-white border-stroke-default text-content-primary focus:ring-emerald-500'
              } focus:outline-none focus:ring-2`}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="At least 8 characters"
                  className={inputClass('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${
                    darkMode
                      ? 'text-content-secondary hover:text-content-primary'
                      : 'text-content-secondary hover:text-content-primary'
                  }`}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Re-enter password"
                  className={inputClass('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${
                    darkMode
                      ? 'text-content-secondary hover:text-content-primary'
                      : 'text-content-secondary hover:text-content-primary'
                  }`}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div className={`p-4 rounded-lg ${
            darkMode ? 'bg-surface-sunken' : 'bg-surface-sunken'
          }`}>
            <p className={`text-sm ${
              darkMode ? 'text-content-secondary' : 'text-content-secondary'
            }`}>
              Your password must be at least 8 characters long and should include a mix of letters, numbers, and symbols for better security.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating Account...' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </OnboardingLayout>
  );
}
