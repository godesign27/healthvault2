import { Sparkles, Pin } from 'lucide-react';
import { AIInsight } from '../../lib/records/types';

interface AIResultCardProps {
  insight: AIInsight;
  darkMode?: boolean;
  onPin?: () => void;
}

export function AIResultCard({ insight, darkMode = false, onPin }: AIResultCardProps) {
  return (
    <div className={`p-4 rounded-lg border-2 ${
      darkMode
        ? 'bg-emerald-500/10 border-emerald-500/30'
        : 'bg-emerald-50 border-emerald-200'
    }`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-500" />
          <span className={`font-semibold ${
            darkMode ? 'text-emerald-400' : 'text-emerald-700'
          }`}>
            AI {insight.intent === 'SUMMARIZE' ? 'Summary' : insight.intent === 'COMPARE' ? 'Comparison' : 'Analysis'}
          </span>
        </div>
        {onPin && (
          <button
            onClick={onPin}
            className={`p-1.5 rounded transition-colors ${
              darkMode
                ? 'hover:bg-surface-sunken text-content-secondary'
                : 'hover:bg-white text-content-secondary'
            }`}
            title="Pin to Notes"
          >
            <Pin className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className={`text-sm whitespace-pre-wrap ${
        darkMode ? 'text-content-primary' : 'text-content-primary'
      }`}>
        {insight.result}
      </div>

      <div className={`mt-3 text-xs ${
        darkMode ? 'text-content-secondary' : 'text-content-secondary'
      }`}>
        Generated {new Date(insight.createdAt).toLocaleTimeString()}
      </div>
    </div>
  );
}
