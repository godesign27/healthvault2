import { Sparkles, HelpCircle } from 'lucide-react';

export interface QuickAction {
  label: string;
  onClick: () => void;
}

interface OnboardingAssistantPanelProps {
  step: string;
  title: string;
  message: string;
  quickActions?: QuickAction[];
  darkMode?: boolean;
}

export function OnboardingAssistantPanel({
  step,
  title,
  message,
  quickActions = [],
  darkMode = false
}: OnboardingAssistantPanelProps) {
  return (
    <div className={`rounded-lg border p-6 ${
      darkMode
        ? 'bg-surface-sunken border-stroke-default'
        : 'bg-white border-stroke-subtle'
    }`}>
      <div className="flex items-start gap-3 mb-4">
        <div className={`p-2 rounded-lg ${
          darkMode ? 'bg-emerald-500/20' : 'bg-emerald-50'
        }`}>
          <Sparkles className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold mb-1 ${
            darkMode ? 'text-white' : 'text-content-primary'
          }`}>
            {title}
          </h3>
          <p className={`text-sm ${
            darkMode ? 'text-content-secondary' : 'text-content-secondary'
          }`}>
            Step {step}
          </p>
        </div>
      </div>

      <div className={`text-sm leading-relaxed mb-4 ${
        darkMode ? 'text-content-primary' : 'text-content-primary'
      }`}>
        {message}
      </div>

      {quickActions.length > 0 && (
        <div className="space-y-2">
          <div className={`flex items-center gap-2 text-xs font-medium mb-2 ${
            darkMode ? 'text-content-secondary' : 'text-content-secondary'
          }`}>
            <HelpCircle className="w-3.5 h-3.5" />
            Quick Actions
          </div>
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                darkMode
                  ? 'bg-surface-sunken hover:bg-surface-overlay text-content-primary'
                  : 'bg-surface-sunken hover:bg-surface-sunken text-content-primary'
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
