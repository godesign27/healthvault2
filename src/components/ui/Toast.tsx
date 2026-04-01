import { X, Info, AlertTriangle, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ToastProps {
  message: string;
  variant?: 'info' | 'error' | 'success' | 'warning' | 'loading';
  style?: 'inline' | 'solid';
  onClose?: () => void;
}

export function Toast({
  message,
  variant = 'info',
  style = 'inline',
  onClose
}: ToastProps) {
  const icons = {
    info: Info,
    error: AlertCircle,
    success: CheckCircle,
    warning: AlertTriangle,
    loading: Loader2
  };

  const Icon = icons[variant];

  const variantStyles = {
    inline: {
      info: 'bg-white border-l-4 border-[#3B9CFF] text-gray-800',
      error: 'bg-white border-l-4 border-[#C81E1E] text-gray-800',
      success: 'bg-white border-l-4 border-[#0B8457] text-gray-800',
      warning: 'bg-white border-l-4 border-[#8B6914] text-gray-800',
      loading: 'bg-white border-l-4 border-gray-400 text-gray-800'
    },
    solid: {
      info: 'bg-[#3B9CFF] text-white',
      error: 'bg-[#C81E1E] text-white',
      success: 'bg-[#0B8457] text-white',
      warning: 'bg-[#8B6914] text-white',
      loading: 'bg-gray-700 text-white'
    }
  };

  const iconColors = {
    inline: {
      info: 'text-[#3B9CFF]',
      error: 'text-[#C81E1E]',
      success: 'text-[#0B8457]',
      warning: 'text-[#8B6914]',
      loading: 'text-gray-400'
    },
    solid: {
      info: 'text-white',
      error: 'text-white',
      success: 'text-white',
      warning: 'text-white',
      loading: 'text-white'
    }
  };

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded shadow-lg min-w-[300px] max-w-md
        ${variantStyles[style][variant]}
      `}
    >
      <Icon
        className={`flex-shrink-0 w-5 h-5 ${iconColors[style][variant]} ${variant === 'loading' ? 'animate-spin' : ''}`}
      />
      <span className="flex-1 text-sm font-medium">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className={`flex-shrink-0 p-1 rounded hover:bg-black/10 transition-colors ${style === 'solid' ? 'text-white' : 'text-gray-500'}`}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
