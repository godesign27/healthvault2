import { Heart, Shield, FileText, Sparkles } from 'lucide-react';
import { OnboardingAssistantPanel, QuickAction } from '../components/OnboardingAssistantPanel';

interface OnboardingStartPageProps {
  darkMode?: boolean;
  onNext: () => void;
}

export function OnboardingStartPage({ darkMode = false, onNext }: OnboardingStartPageProps) {

  const quickActions: QuickAction[] = [
    {
      label: "What happens if I skip optional steps?",
      onClick: () => alert("You can skip Insurance and Preferences during onboarding. Identity verification is required for security. You can add insurance and update preferences anytime from your Dashboard.")
    },
    {
      label: "How long will this take?",
      onClick: () => alert("Identity verification takes about 2-3 minutes. Optional steps take 1-2 minutes each. You can skip them and return later.")
    },
    {
      label: "Is my data secure?",
      onClick: () => alert("Yes. All your health data is encrypted and stored securely. We follow HIPAA guidelines and never share your data without your explicit consent.")
    }
  ];

  return (
    <div className={`min-h-screen flex items-center justify-center ${
      darkMode ? 'bg-stone-950' : 'bg-stone-50'
    }`}>
      <div className="max-w-6xl w-full mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className={`rounded-lg border p-8 ${
              darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
            }`}>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-3 rounded-lg ${
                    darkMode ? 'bg-emerald-500/20' : 'bg-emerald-50'
                  }`}>
                    <Heart className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h1 className={`text-3xl font-bold ${
                    darkMode ? 'text-white' : 'text-stone-900'
                  }`}>
                    Welcome to Health Vault
                  </h1>
                </div>
                <p className={`text-lg ${
                  darkMode ? 'text-stone-400' : 'text-stone-600'
                }`}>
                  In a few steps, we'll verify your identity, optionally add insurance, and personalize how we can help you manage your health information.
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className={`flex items-start gap-4 p-4 rounded-lg ${
                  darkMode ? 'bg-stone-800' : 'bg-stone-50'
                }`}>
                  <Shield className={`w-6 h-6 mt-0.5 ${
                    darkMode ? 'text-emerald-400' : 'text-emerald-600'
                  }`} />
                  <div>
                    <h3 className={`font-semibold mb-1 ${
                      darkMode ? 'text-white' : 'text-stone-900'
                    }`}>
                      Identity Verification (Required)
                    </h3>
                    <p className={`text-sm ${
                      darkMode ? 'text-stone-400' : 'text-stone-600'
                    }`}>
                      We'll collect basic information to verify your identity and secure your health records.
                    </p>
                  </div>
                </div>

                <div className={`flex items-start gap-4 p-4 rounded-lg ${
                  darkMode ? 'bg-stone-800' : 'bg-stone-50'
                }`}>
                  <FileText className={`w-6 h-6 mt-0.5 ${
                    darkMode ? 'text-stone-500' : 'text-stone-400'
                  }`} />
                  <div>
                    <h3 className={`font-semibold mb-1 ${
                      darkMode ? 'text-white' : 'text-stone-900'
                    }`}>
                      Insurance Information (Optional)
                    </h3>
                    <p className={`text-sm ${
                      darkMode ? 'text-stone-400' : 'text-stone-600'
                    }`}>
                      Add your insurance details to help manage coverage and claims. You can skip this and add it later.
                    </p>
                  </div>
                </div>

                <div className={`flex items-start gap-4 p-4 rounded-lg ${
                  darkMode ? 'bg-stone-800' : 'bg-stone-50'
                }`}>
                  <Sparkles className={`w-6 h-6 mt-0.5 ${
                    darkMode ? 'text-stone-500' : 'text-stone-400'
                  }`} />
                  <div>
                    <h3 className={`font-semibold mb-1 ${
                      darkMode ? 'text-white' : 'text-stone-900'
                    }`}>
                      Health Preferences (Optional)
                    </h3>
                    <p className={`text-sm ${
                      darkMode ? 'text-stone-400' : 'text-stone-600'
                    }`}>
                      Choose how Health Vault can assist you with labs, forms, providers, and wellness.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onNext}
                  className="flex-1 px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
                >
                  Get Started
                </button>
                <button
                  onClick={onNext}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    darkMode
                      ? 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  Do This Later
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <OnboardingAssistantPanel
              step="0 of 5"
              title="Let's Get Started"
              message="This onboarding will take about 5-10 minutes. We'll create your account, verify your identity (required), and optionally collect insurance and preferences. Everything except account creation and identity verification can be skipped and completed later from your Dashboard."
              quickActions={quickActions}
              darkMode={darkMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
