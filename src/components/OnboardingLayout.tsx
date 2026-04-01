import { ReactNode } from 'react';
import { Check } from 'lucide-react';

interface OnboardingLayoutProps {
  children: ReactNode;
  assistant: ReactNode;
  currentStep: number;
  darkMode?: boolean;
}

const steps = [
  { number: 1, label: 'Account' },
  { number: 2, label: 'Identity' },
  { number: 3, label: 'Insurance' },
  { number: 4, label: 'Preferences' },
  { number: 5, label: 'Complete' }
];

export function OnboardingLayout({
  children,
  assistant,
  currentStep,
  darkMode = false
}: OnboardingLayoutProps) {
  return (
    <div className={`min-h-screen ${
      darkMode ? 'bg-stone-950' : 'bg-stone-50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-2">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full font-medium text-sm transition-colors ${
                      step.number < currentStep
                        ? 'bg-emerald-600 text-white'
                        : step.number === currentStep
                          ? darkMode
                            ? 'bg-emerald-500 text-white'
                            : 'bg-emerald-600 text-white'
                          : darkMode
                            ? 'bg-stone-800 text-stone-400 border border-stone-700'
                            : 'bg-white text-stone-400 border border-stone-300'
                    }`}>
                      {step.number < currentStep ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        step.number
                      )}
                    </div>
                    <span className={`text-xs mt-2 ${
                      step.number === currentStep
                        ? darkMode ? 'text-emerald-400' : 'text-emerald-600'
                        : darkMode ? 'text-stone-500' : 'text-stone-500'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-2 ${
                      step.number < currentStep
                        ? 'bg-emerald-600'
                        : darkMode
                          ? 'bg-stone-800'
                          : 'bg-stone-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {children}
          </div>
          <div className="lg:col-span-1">
            {assistant}
          </div>
        </div>
      </div>
    </div>
  );
}
