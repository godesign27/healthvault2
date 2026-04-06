import { useEffect, useState } from 'react';
import { CheckCircle, FileText, Shield, Settings } from 'lucide-react';
import { OnboardingAssistantPanel } from '../components/OnboardingAssistantPanel';
import { supabase } from '../lib/supabase';

interface OnboardingCompletePageProps {
  darkMode?: boolean;
  onGoToDashboard: () => void;
}

export function OnboardingCompletePage({ darkMode = false, onGoToDashboard }: OnboardingCompletePageProps) {
  const [hasInsurance, setHasInsurance] = useState(false);
  const [hasPreferences, setHasPreferences] = useState(false);
  const [isCompleting, setIsCompleting] = useState(true);

  useEffect(() => {
    const completeOnboarding = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          throw new Error('No user session');
        }

        const userId = session.user.id;

        const { data: insurance } = await supabase
          .from('insurance_policies')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        setHasInsurance(!!insurance);

        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (preferences) {
          const hasAnyPreference = preferences.help_with_labs ||
                                   preferences.help_with_forms ||
                                   preferences.help_with_providers ||
                                   preferences.help_with_wellness_suggestions;
          setHasPreferences(hasAnyPreference);
        }

        const { error } = await supabase
          .from('user_profiles')
          .update({ onboarding_complete: true })
          .eq('user_id', userId);

        if (error) throw error;

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('first_name')
          .eq('user_id', userId)
          .maybeSingle();

        try {
          await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/welcome-email`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: session.user.email,
                firstName: profile?.first_name || '',
              }),
            }
          );
        } catch {
          // Non-blocking: email failure should not prevent dashboard access
        }
      } catch (error) {
        console.error('Failed to complete onboarding:', error);
      } finally {
        setIsCompleting(false);
      }
    };

    completeOnboarding();
  }, []);

  if (isCompleting) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? 'bg-stone-950' : 'bg-stone-50'
      }`}>
        <div className="text-center">
          <div className={`text-lg ${
            darkMode ? 'text-stone-400' : 'text-stone-600'
          }`}>
            Completing setup...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${
      darkMode ? 'bg-stone-950' : 'bg-stone-50'
    }`}>
      <header className={`sticky top-0 z-50 border-b ${
        darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg overflow-hidden">
                <img
                  src={darkMode ? "/hv_logo-dark.png" : "/hv_logo-light.png"}
                  alt="Health Vault"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className={`text-sm font-bold ${
                darkMode ? 'text-white' : 'text-stone-900'
              }`}>Health Vault</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 57px)' }}>
      <div className="max-w-6xl w-full mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className={`rounded-lg border p-8 ${
              darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
            }`}>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-4">
                  <CheckCircle className="w-12 h-12 text-emerald-600" />
                </div>
                <h1 className={`text-3xl font-bold mb-2 ${
                  darkMode ? 'text-white' : 'text-stone-900'
                }`}>
                  Your Health Vault is Ready
                </h1>
                <p className={`text-lg ${
                  darkMode ? 'text-stone-400' : 'text-stone-600'
                }`}>
                  You're all set to start managing your health information
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className={`flex items-start gap-4 p-4 rounded-lg ${
                  darkMode ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'
                }`}>
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className={`font-semibold mb-1 ${
                      darkMode ? 'text-white' : 'text-stone-900'
                    }`}>
                      Identity Verified
                    </h3>
                    <p className={`text-sm ${
                      darkMode ? 'text-stone-400' : 'text-stone-600'
                    }`}>
                      Your identity has been verified and your account is secure.
                    </p>
                  </div>
                </div>

                <div className={`flex items-start gap-4 p-4 rounded-lg ${
                  hasInsurance
                    ? darkMode
                      ? 'bg-emerald-500/10 border border-emerald-500/20'
                      : 'bg-emerald-50 border border-emerald-200'
                    : darkMode
                      ? 'bg-stone-800'
                      : 'bg-stone-50'
                }`}>
                  <div className="flex-shrink-0">
                    {hasInsurance ? (
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <Shield className={`w-6 h-6 ${
                        darkMode ? 'text-stone-500' : 'text-stone-400'
                      }`} />
                    )}
                  </div>
                  <div>
                    <h3 className={`font-semibold mb-1 ${
                      darkMode ? 'text-white' : 'text-stone-900'
                    }`}>
                      Insurance
                    </h3>
                    <p className={`text-sm ${
                      darkMode ? 'text-stone-400' : 'text-stone-600'
                    }`}>
                      {hasInsurance
                        ? 'Your insurance information has been added.'
                        : 'You can add insurance anytime from the Insurance page.'}
                    </p>
                  </div>
                </div>

                <div className={`flex items-start gap-4 p-4 rounded-lg ${
                  hasPreferences
                    ? darkMode
                      ? 'bg-emerald-500/10 border border-emerald-500/20'
                      : 'bg-emerald-50 border border-emerald-200'
                    : darkMode
                      ? 'bg-stone-800'
                      : 'bg-stone-50'
                }`}>
                  <div className="flex-shrink-0">
                    {hasPreferences ? (
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <Settings className={`w-6 h-6 ${
                        darkMode ? 'text-stone-500' : 'text-stone-400'
                      }`} />
                    )}
                  </div>
                  <div>
                    <h3 className={`font-semibold mb-1 ${
                      darkMode ? 'text-white' : 'text-stone-900'
                    }`}>
                      Preferences
                    </h3>
                    <p className={`text-sm ${
                      darkMode ? 'text-stone-400' : 'text-stone-600'
                    }`}>
                      {hasPreferences
                        ? 'Your health preferences have been saved.'
                        : 'You can customize preferences anytime from Settings.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg mb-6 ${
                darkMode ? 'bg-stone-800' : 'bg-stone-50'
              }`}>
                <h3 className={`font-semibold mb-2 ${
                  darkMode ? 'text-white' : 'text-stone-900'
                }`}>
                  What's Next?
                </h3>
                <ul className={`space-y-2 text-sm ${
                  darkMode ? 'text-stone-400' : 'text-stone-600'
                }`}>
                  <li className="flex items-start gap-2">
                    <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Upload or connect your health records</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Add your care team and providers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Settings className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Explore the AI health assistant for help anytime</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={onGoToDashboard}
                className="w-full px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors shadow-sm"
              >
                Go to Dashboard
              </button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <OnboardingAssistantPanel
              step="Complete"
              title="Welcome to Health Vault"
              message="You're all set! I'm here to help you manage your health information. You can ask me to explain lab results, help with forms, connect with providers, or get wellness suggestions anytime."
              quickActions={[]}
              darkMode={darkMode}
            />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
