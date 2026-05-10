import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const sizeMap = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12', xl: 'w-16 h-16' } as const;

const colorMap = {
  primary:   'text-action-primary',
  secondary: 'text-content-secondary',
  success:   'text-content-feedback-success',
  error:     'text-content-feedback-error',
  warning:   'text-content-feedback-warning',
  info:      'text-content-feedback-info',
} as const;

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: keyof typeof colorMap;
  className?: string;
}

export function Spinner({ size = 'md', color = 'primary', className = '' }: SpinnerProps) {
  return (
    <Loader2
      className={cn('animate-spin', sizeMap[size], colorMap[color], className)}
    />
  );
}

interface SpinnerOverlayProps {
  message?: string;
}

export function SpinnerOverlay({ message = 'Loading...' }: SpinnerOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface-overlay rounded-lg p-8 shadow-xl flex flex-col items-center gap-4">
        <Spinner size="xl" />
        {message && <p className="text-content-secondary font-medium">{message}</p>}
      </div>
    </div>
  );
}

interface InlineSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: keyof typeof colorMap;
}

export function InlineSpinner({ message, size = 'md', color = 'primary' }: InlineSpinnerProps) {
  return (
    <div className="flex items-center gap-3">
      <Spinner size={size} color={color} />
      {message && <span className="text-content-secondary">{message}</span>}
    </div>
  );
}
