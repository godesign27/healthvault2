interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'tiny' | 'xsmall' | 'small' | 'normal' | 'large' | 'xlarge' | 'xxl' | 'hero';
  variant?: 'master' | 'progress' | 'error' | 'success' | 'warning';
  showText?: boolean;
  showTrack?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  size = 'normal',
  variant = 'progress',
  showText = false,
  showTrack = true,
  className = ''
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    'tiny': 'h-2',
    'xsmall': 'h-2.5',
    'small': 'h-3',
    'normal': 'h-4',
    'large': 'h-5',
    'xlarge': 'h-6',
    'xxl': 'h-8',
    'hero': 'h-12'
  };

  const variantColors = {
    'master': 'bg-[#1C2938]',
    'progress': 'bg-[indigo-600]',
    'error': 'bg-[#C81E1E]',
    'success': 'bg-[#0B8457]',
    'warning': 'bg-[#8B6914]'
  };

  const trackColor = showTrack ? 'bg-gray-200' : 'bg-transparent';

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full ${sizeClasses[size]} ${trackColor} rounded-sm overflow-hidden relative`}>
        <div
          className={`h-full ${variantColors[variant]} transition-all duration-300 ease-out flex items-center justify-center`}
          style={{ width: `${percentage}%` }}
        >
          {showText && percentage >= 20 && (
            <span className="text-xs text-white font-medium px-2">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
