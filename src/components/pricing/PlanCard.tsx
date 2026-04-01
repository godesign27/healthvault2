import { CheckCircle2 } from 'lucide-react';

interface PlanCardProps {
  title: string;
  price: string;
  period?: string;
  features: string[];
  badge?: string;
  ctaLabel: string;
  onCta: () => void;
  subtext?: string;
  darkMode?: boolean;
}

export function PlanCard({
  title,
  price,
  period,
  features,
  badge,
  ctaLabel,
  onCta,
  subtext,
  darkMode = false
}: PlanCardProps) {
  return (
    <div
      className={`relative rounded-2xl p-8 shadow-sm border ${
        darkMode
          ? 'bg-stone-800 border-stone-700'
          : 'bg-white border-stone-200'
      }`}
    >
      {badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
            darkMode
              ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
              : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
          }`}>
            {badge}
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className={`text-xl font-semibold mb-2 ${
          darkMode ? 'text-white' : 'text-stone-900'
        }`}>
          {title}
        </h3>
        <div className="flex items-baseline justify-center gap-1">
          <span className={`text-4xl font-bold ${
            darkMode ? 'text-white' : 'text-stone-900'
          }`}>
            {price}
          </span>
          {period && (
            <span className={`text-sm ${
              darkMode ? 'text-stone-400' : 'text-stone-600'
            }`}>
              {period}
            </span>
          )}
        </div>
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              darkMode ? 'text-emerald-400' : 'text-emerald-600'
            }`} />
            <span className={`text-sm ${
              darkMode ? 'text-stone-300' : 'text-stone-700'
            }`}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <button
        onClick={onCta}
        className={`w-full rounded-lg px-4 py-3 text-sm font-semibold shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
          badge
            ? darkMode
              ? 'bg-indigo-500 text-white hover:bg-indigo-400 focus-visible:outline-indigo-600'
              : 'bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-indigo-600'
            : darkMode
            ? 'bg-indigo-500/80 text-white hover:bg-indigo-500 focus-visible:outline-indigo-600'
            : 'bg-indigo-600/90 text-white hover:bg-indigo-600 focus-visible:outline-indigo-600'
        }`}
      >
        {ctaLabel}
      </button>

      {subtext && (
        <p className={`mt-4 text-xs text-center ${
          darkMode ? 'text-stone-500' : 'text-stone-500'
        }`}>
          {subtext}
        </p>
      )}
    </div>
  );
}
