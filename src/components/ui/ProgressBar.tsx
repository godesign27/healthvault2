import { cn } from '../../lib/utils';

const sizeMap = {
  tiny:    'h-2',
  xsmall:  'h-2.5',
  small:   'h-3',
  normal:  'h-4',
  large:   'h-5',
  xlarge:  'h-6',
  xxl:     'h-8',
  hero:    'h-12',
} as const;

const variantFillMap = {
  master:   'bg-hv-neutral-900',
  progress: 'bg-action-primary',
  error:    'bg-action-destructive',
  success:  'bg-content-feedback-success',
  warning:  'bg-content-feedback-warning',
} as const;

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: keyof typeof sizeMap;
  variant?: keyof typeof variantFillMap;
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
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'w-full rounded-sm overflow-hidden relative',
          sizeMap[size],
          showTrack ? 'bg-surface-sunken' : 'bg-transparent',
        )}
      >
        <div
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          className={cn(
            'h-full transition-all duration-300 ease-out flex items-center justify-center',
            variantFillMap[variant],
          )}
          style={{ width: `${percentage}%` }}
        >
          {showText && percentage >= 20 && (
            <span className="text-xs text-content-on-action font-medium px-2">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
