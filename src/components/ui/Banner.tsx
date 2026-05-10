import { X, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BannerProps {
  message: string;
  variant?: 'info' | 'error' | 'success' | 'warning';
  style?: 'outline' | 'solid' | 'light';
  onClose?: () => void;
}

const icons = {
  info:    Info,
  error:   AlertCircle,
  success: CheckCircle,
  warning: AlertTriangle,
} as const;

const outlineBorder = {
  info:    'border border-content-feedback-info',
  error:   'border border-content-feedback-error',
  success: 'border border-content-feedback-success',
  warning: 'border border-content-feedback-warning',
} as const;

const solidBg = {
  info:    'bg-surface-feedback-info',
  error:   'bg-surface-feedback-error',
  success: 'bg-surface-feedback-success',
  warning: 'bg-surface-feedback-warning',
} as const;

const iconColor = {
  info:    'text-content-feedback-info',
  error:   'text-content-feedback-error',
  success: 'text-content-feedback-success',
  warning: 'text-content-feedback-warning',
} as const;

export function Banner({ message, variant = 'info', style = 'solid', onClose }: BannerProps) {
  const Icon = icons[variant];

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded w-full',
        style === 'outline' && cn('bg-surface-raised text-content-primary', outlineBorder[variant]),
        style === 'solid'   && cn(solidBg[variant], 'text-content-primary'),
        style === 'light'   && cn(solidBg[variant], 'text-content-primary'),
      )}
    >
      <Icon className={cn('shrink-0 w-5 h-5', iconColor[variant])} />
      <span className="flex-1 text-sm font-medium">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 p-1 rounded hover:bg-black/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
