import { X, Info, AlertTriangle, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ToastProps {
  message: string;
  variant?: 'info' | 'error' | 'success' | 'warning' | 'loading';
  style?: 'inline' | 'solid';
  onClose?: () => void;
}

const icons = {
  info:    Info,
  error:   AlertCircle,
  success: CheckCircle,
  warning: AlertTriangle,
  loading: Loader2,
} as const;

const inlineBorder = {
  info:    'border-l-4 border-content-feedback-info',
  error:   'border-l-4 border-content-feedback-error',
  success: 'border-l-4 border-content-feedback-success',
  warning: 'border-l-4 border-content-feedback-warning',
  loading: 'border-l-4 border-stroke-default',
} as const;

const solidBg = {
  info:    'bg-surface-feedback-info',
  error:   'bg-surface-feedback-error',
  success: 'bg-surface-feedback-success',
  warning: 'bg-surface-feedback-warning',
  loading: 'bg-surface-sunken',
} as const;

const inlineIconColor = {
  info:    'text-content-feedback-info',
  error:   'text-content-feedback-error',
  success: 'text-content-feedback-success',
  warning: 'text-content-feedback-warning',
  loading: 'text-content-tertiary',
} as const;

export function Toast({ message, variant = 'info', style = 'inline', onClose }: ToastProps) {
  const Icon = icons[variant];
  const isInline = style === 'inline';

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded shadow-lg min-w-[300px] max-w-md',
        isInline
          ? cn('bg-surface-overlay text-content-primary', inlineBorder[variant])
          : cn(solidBg[variant], 'text-content-primary'),
      )}
    >
      <Icon
        className={cn(
          'shrink-0 w-5 h-5',
          isInline ? inlineIconColor[variant] : 'text-content-primary',
          variant === 'loading' && 'animate-spin',
        )}
      />
      <span className="flex-1 text-sm font-medium">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 p-1 rounded hover:bg-black/10 transition-colors text-content-secondary"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
