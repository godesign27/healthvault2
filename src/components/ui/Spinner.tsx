import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
};

const colorClasses = {
  primary: 'text-[indigo-600]',
  secondary: 'text-gray-600',
  success: 'text-green-600',
  error: 'text-red-600',
  warning: 'text-yellow-600',
  info: 'text-blue-600'
};

export function Spinner({ size = 'md', color = 'primary', className = '' }: SpinnerProps) {
  return (
    <Loader2
      className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
    />
  );
}

interface SpinnerOverlayProps {
  message?: string;
}

export function SpinnerOverlay({ message = 'Loading...' }: SpinnerOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 shadow-xl flex flex-col items-center gap-4">
        <Spinner size="xl" />
        {message && <p className="text-gray-700 font-medium">{message}</p>}
      </div>
    </div>
  );
}

interface InlineSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
}

export function InlineSpinner({ message, size = 'md', color = 'primary' }: InlineSpinnerProps) {
  return (
    <div className="flex items-center gap-3">
      <Spinner size={size} color={color} />
      {message && <span className="text-gray-700">{message}</span>}
    </div>
  );
}
