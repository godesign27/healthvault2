import { useState } from 'react';
import { ArrowLeft, TestTube, FileText, Users, Heart } from 'lucide-react';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { OnboardingAssistantPanel, QuickAction } from '../components/OnboardingAssistantPanel';
import { supabase } from '../lib/supabase';

interface OnboardingPreferencesPageProps {
  darkMode?: boolean;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function OnboardingPreferencesPage({ darkMode = false, onNext, onBack, onSkip }: OnboardingPreferencesPageProps) {
  const [preferences, setPreferences] = useState({
    helpWithLabs: false,
    helpWithForms: false,
    helpWithProviders: false,
    helpWithWellnessSuggestions: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error('No user session');
      }

      const userId = session.user.id;

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          help_with_labs: preferences.helpWithLabs,
          help_with_forms: preferences.helpWithForms,
          help_with_providers: preferences.helpWithProviders,
          help_with_wellness_suggestions: preferences.helpWithWellnessSuggestions
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      onNext();
    } catch (error) {
      console.error('Failed to save preferences:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePreference = (key: keyof typeof preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const turnAllOn = () => {
    setPreferences({
      helpWithLabs: true,
      helpWithForms: true,
      helpWithProviders: true,
      helpWithWellnessSuggestions: true
    });
  };

  const turnAllOff = () => {
    setPreferences({
      helpWithLabs: false,
      helpWithForms: false,
      helpWithProviders: false,
      helpWithWellnessSuggestions: false
    });
  };

  const quickActions: QuickAction[] = [
    {
      label: "Turn everything on",
      onClick: turnAllOn
    },
    {
      label: "Turn everything off",
      onClick: turnAllOff
    },
    {
      label: "What do these do?",
      onClick: () => alert("These preferences control how the AI assistant helps you:\n\n• Labs: Get summaries and insights on test results\n• Forms: Help completing and organizing medical forms\n• Providers: Reminders and connections with your care team\n• Wellness: Educational tips and suggestions (not medical advice)\n\nYou can change these anytime in Settings.")
    }
  ];

  const preferenceItems = [
    {
      key: 'helpWithLabs' as const,
      icon: TestTube,
      title: 'Help me organize and understand my lab results',
      description: 'Get AI-powered summaries and insights on your test results, track trends over time, and identify potential concerns to discuss with your doctor.'
    },
    {
      key: 'helpWithForms' as const,
      icon: FileText,
      title: 'Help me manage and share my medical forms',
      description: 'Organize medical forms, fill out patient intake documents, and securely share forms with providers when needed.'
    },
    {
      key: 'helpWithProviders' as const,
      icon: Users,
      title: 'Help me stay connected with my providers',
      description: 'Track your care team, manage appointments, and get reminders for follow-ups and preventive care.'
    },
    {
      key: 'helpWithWellnessSuggestions' as const,
      icon: Heart,
      title: 'Provide non-diagnostic, educational wellness suggestions',
      description: 'Receive personalized wellness tips, healthy lifestyle suggestions, and educational health information based on your profile.'
    }
  ];

  return (
    <OnboardingLayout
      currentStep={4}
      darkMode={darkMode}
      onBack={onBack}
      assistant={
        <OnboardingAssistantPanel
          step="4 of 5"
          title="Health Preferences"
          message="Choose how Health Vault can assist you. These preferences help personalize your experience. You can change them anytime from your Settings."
          quickActions={quickActions}
          darkMode={darkMode}
        />
      }
    >
      <div className={`rounded-lg border p-8 ${
        darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
      }`}>
        <div className="mb-6">
          <h2 className={`text-2xl font-bold mb-2 ${
            darkMode ? 'text-white' : 'text-stone-900'
          }`}>
            How can Health Vault help you?
          </h2>
          <p className={`text-sm ${
            darkMode ? 'text-stone-400' : 'text-stone-600'
          }`}>
            Choose what you'd like us to focus on. You can change this anytime.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {preferenceItems.map((item) => {
            const Icon = item.icon;
            const isActive = preferences[item.key];

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => togglePreference(item.key)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  isActive
                    ? darkMode
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-emerald-600 bg-emerald-50'
                    : darkMode
                      ? 'border-stone-700 bg-stone-800 hover:border-stone-600'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${
                    isActive
                      ? darkMode
                        ? 'bg-emerald-500/20'
                        : 'bg-emerald-100'
                      : darkMode
                        ? 'bg-stone-700'
                        : 'bg-stone-100'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      isActive
                        ? 'text-emerald-600'
                        : darkMode
                          ? 'text-stone-400'
                          : 'text-stone-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-semibold ${
                        darkMode ? 'text-white' : 'text-stone-900'
                      }`}>
                        {item.title}
                      </h3>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isActive
                          ? 'bg-emerald-600 border-emerald-600'
                          : darkMode
                            ? 'border-stone-600'
                            : 'border-stone-300'
                      }`}>
                        {isActive && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <p className={`text-sm ${
                      darkMode ? 'text-stone-400' : 'text-stone-600'
                    }`}>
                      {item.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onBack}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                darkMode
                  ? 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              type="button"
              onClick={onSkip}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                darkMode
                  ? 'text-stone-400 hover:text-stone-300'
                  : 'text-stone-600 hover:text-stone-700'
              }`}
            >
              Skip for now
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </OnboardingLayout>
  );
}
