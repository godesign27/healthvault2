import { Search, X, Info } from 'lucide-react';
import { ReactNode } from 'react';

interface ActionFieldProps {
  label?: string;
  placeholder?: string;
  value?: string;
  helperText?: string;
  variant?: 'default' | 'search' | 'removable-tag';
  state?: 'default' | 'hover' | 'focused' | 'disabled' | 'readonly' | 'error' | 'warning' | 'success';
  size?: 'normal' | 'small';
  showLabel?: boolean;
  showHelper?: boolean;
  showInfoIcon?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onChange?: (value: string) => void;
  onRemove?: () => void;
  className?: string;
}

export function ActionField({
  label = 'Label text',
  placeholder = 'Input Nominal/ Nilai',
  value = '',
  helperText = 'Helper text',
  variant = 'default',
  state = 'default',
  size = 'normal',
  showLabel = true,
  showHelper = true,
  showInfoIcon = false,
  leftIcon,
  rightIcon,
  onChange,
  onRemove,
  className = ''
}: ActionFieldProps) {
  const sizeClasses = {
    normal: {
      input: 'px-3 py-2 text-sm',
      icon: 'w-4 h-4',
      label: 'text-sm',
      helper: 'text-xs'
    },
    small: {
      input: 'px-2.5 py-1.5 text-xs',
      icon: 'w-3.5 h-3.5',
      label: 'text-xs',
      helper: 'text-[10px]'
    }
  };

  const sizes = sizeClasses[size];

  const getStateClasses = () => {
    const isDisabled = state === 'disabled';
    const isReadonly = state === 'readonly';

    if (isDisabled) {
      return 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed';
    }

    if (isReadonly) {
      return 'border-gray-300 bg-gray-50 text-gray-600 cursor-default';
    }

    switch (state) {
      case 'error':
        return 'border-red-500 bg-white text-gray-900';
      case 'warning':
        return 'border-yellow-500 bg-white text-gray-900';
      case 'success':
        return 'border-green-500 bg-white text-gray-900';
      case 'focused':
        return 'border-[indigo-600] bg-white text-gray-900';
      case 'hover':
        return 'border-gray-400 bg-white text-gray-900';
      default:
        return 'border-[#5B5864] bg-white text-gray-900';
    }
  };

  const getLabelColor = () => {
    switch (state) {
      case 'error':
        return 'text-red-700';
      case 'warning':
        return 'text-yellow-700';
      case 'success':
        return 'text-green-700';
      case 'disabled':
        return 'text-gray-400';
      default:
        return 'text-gray-700';
    }
  };

  const getHelperColor = () => {
    switch (state) {
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'success':
        return 'text-green-600';
      case 'disabled':
        return 'text-gray-400';
      default:
        return 'text-gray-500';
    }
  };

  const getIconColor = () => {
    switch (state) {
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'success':
        return 'text-green-500';
      case 'disabled':
        return 'text-gray-400';
      default:
        return 'text-gray-500';
    }
  };

  const renderLeftIcon = () => {
    if (variant === 'search') {
      return <Search className={`${sizes.icon} ${getIconColor()}`} />;
    }
    if (leftIcon) {
      return <span className={getIconColor()}>{leftIcon}</span>;
    }
    return null;
  };

  const renderRightIcon = () => {
    if (variant === 'removable-tag') {
      return (
        <button
          onClick={onRemove}
          disabled={state === 'disabled'}
          className={`${getIconColor()} hover:text-gray-700 transition-colors disabled:cursor-not-allowed`}
          type="button"
        >
          <X className={sizes.icon} />
        </button>
      );
    }
    if (rightIcon) {
      return <span className={getIconColor()}>{rightIcon}</span>;
    }
    return null;
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {showLabel && (
        <label className={`${sizes.label} font-medium ${getLabelColor()} flex items-center gap-1.5`}>
          {label}
          {showInfoIcon && <Info className="w-3.5 h-3.5" />}
        </label>
      )}

      <div className="relative">
        <div
          className={`
            flex items-center gap-2 border transition-all
            ${sizes.input}
            ${getStateClasses()}
          `}
        >
          {renderLeftIcon()}

          <input
            type="text"
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={state === 'disabled'}
            readOnly={state === 'readonly'}
            className={`
              flex-1 bg-transparent outline-none placeholder-gray-400
              disabled:cursor-not-allowed
              ${state === 'readonly' ? 'cursor-default' : ''}
            `}
          />

          {renderRightIcon()}
        </div>
      </div>

      {showHelper && (
        <div className={`${sizes.helper} ${getHelperColor()}`}>
          {helperText}
        </div>
      )}
    </div>
  );
}

interface TextAreaFieldProps {
  label?: string;
  placeholder?: string;
  value?: string;
  helperText?: string;
  state?: 'default' | 'hover' | 'focused' | 'disabled' | 'readonly' | 'error' | 'warning' | 'success';
  size?: 'normal' | 'small';
  rows?: number;
  showLabel?: boolean;
  showHelper?: boolean;
  showInfoIcon?: boolean;
  onChange?: (value: string) => void;
  className?: string;
}

export function TextAreaField({
  label = 'Label text',
  placeholder = 'Input Nominal/ Nilai',
  value = '',
  helperText = 'Helper text',
  state = 'default',
  size = 'normal',
  rows = 3,
  showLabel = true,
  showHelper = true,
  showInfoIcon = false,
  onChange,
  className = ''
}: TextAreaFieldProps) {
  const sizeClasses = {
    normal: {
      input: 'px-3 py-2 text-sm',
      label: 'text-sm',
      helper: 'text-xs'
    },
    small: {
      input: 'px-2.5 py-1.5 text-xs',
      label: 'text-xs',
      helper: 'text-[10px]'
    }
  };

  const sizes = sizeClasses[size];

  const getStateClasses = () => {
    const isDisabled = state === 'disabled';
    const isReadonly = state === 'readonly';

    if (isDisabled) {
      return 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed';
    }

    if (isReadonly) {
      return 'border-gray-300 bg-gray-50 text-gray-600 cursor-default';
    }

    switch (state) {
      case 'error':
        return 'border-red-500 bg-white text-gray-900';
      case 'warning':
        return 'border-yellow-500 bg-white text-gray-900';
      case 'success':
        return 'border-green-500 bg-white text-gray-900';
      case 'focused':
        return 'border-[indigo-600] bg-white text-gray-900';
      case 'hover':
        return 'border-gray-400 bg-white text-gray-900';
      default:
        return 'border-[#5B5864] bg-white text-gray-900';
    }
  };

  const getLabelColor = () => {
    switch (state) {
      case 'error':
        return 'text-red-700';
      case 'warning':
        return 'text-yellow-700';
      case 'success':
        return 'text-green-700';
      case 'disabled':
        return 'text-gray-400';
      default:
        return 'text-gray-700';
    }
  };

  const getHelperColor = () => {
    switch (state) {
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'success':
        return 'text-green-600';
      case 'disabled':
        return 'text-gray-400';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {showLabel && (
        <label className={`${sizes.label} font-medium ${getLabelColor()} flex items-center gap-1.5`}>
          {label}
          {showInfoIcon && <Info className="w-3.5 h-3.5" />}
        </label>
      )}

      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={state === 'disabled'}
        readOnly={state === 'readonly'}
        rows={rows}
        className={`
          border transition-all resize-none
          ${sizes.input}
          ${getStateClasses()}
          outline-none placeholder-gray-400
        `}
      />

      {showHelper && (
        <div className={`${sizes.helper} ${getHelperColor()}`}>
          {helperText}
        </div>
      )}
    </div>
  );
}
