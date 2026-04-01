import { X, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

interface BannerProps {
  message: string;
  variant?: 'info' | 'error' | 'success' | 'warning';
  style?: 'outline' | 'solid' | 'light';
  onClose?: () => void;
}

export function Banner({
  message,
  variant = 'info',
  style = 'solid',
  onClose
}: BannerProps) {
  const icons = {
    info: Info,
    error: AlertCircle,
    success: CheckCircle,
    warning: AlertTriangle
  };

  const Icon = icons[variant];

  const variantStyles = {
    outline: {
      info: 'bg-white border border-[#3B9CFF] text-gray-800',
      error: 'bg-white border border-[#C81E1E] text-gray-800',
      success: 'bg-white border border-[#0B8457] text-gray-800',
      warning: 'bg-white border border-[#8B6914] text-gray-800'
    },
    solid: {
      info: 'bg-[#3B9CFF] text-white',
      error: 'bg-[#C81E1E] text-white',
      success: 'bg-[#0B8457] text-white',
      warning: 'bg-[#8B6914] text-white'
    },
    light: {
      info: 'bg-blue-50 border border-blue-200 text-blue-800',
      error: 'bg-red-50 border border-red-200 text-red-800',
      success: 'bg-green-50 border border-green-200 text-green-800',
      warning: 'bg-yellow-50 border border-yellow-200 text-yellow-800'
    }
  };

  const iconColors = {
    outline: {
      info: 'text-[#3B9CFF]',
      error: 'text-[#C81E1E]',
      success: 'text-[#0B8457]',
      warning: 'text-[#8B6914]'
    },
    solid: {
      info: 'text-white',
      error: 'text-white',
      success: 'text-white',
      warning: 'text-white'
    },
    light: {
      info: 'text-blue-600',
      error: 'text-red-600',
      success: 'text-green-600',
      warning: 'text-yellow-600'
    }
  };

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded w-full
        ${variantStyles[style][variant]}
      `}
    >
      <Icon
        className={`flex-shrink-0 w-5 h-5 ${iconColors[style][variant]}`}
      />
      <span className="flex-1 text-sm font-medium">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className={`flex-shrink-0 p-1 rounded hover:bg-black/10 transition-colors`}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
