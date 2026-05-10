import { Search, X, Info } from 'lucide-react';
import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';

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

const inputSize = {
  normal: { input: 'px-3 py-2 text-sm', icon: 'w-4 h-4', label: 'text-sm', helper: 'text-xs' },
  small:  { input: 'px-2.5 py-1.5 text-xs', icon: 'w-3.5 h-3.5', label: 'text-xs', helper: 'text-[10px]' },
} as const;

const stateBorder = {
  default:  'border-stroke-default bg-surface-raised text-content-primary hover:border-stroke-strong',
  hover:    'border-stroke-strong bg-surface-raised text-content-primary',
  focused:  'border-action-primary bg-surface-raised text-content-primary ring-1 ring-action-primary',
  disabled: 'border-stroke-subtle bg-surface-sunken text-content-disabled cursor-not-allowed',
  readonly: 'border-stroke-subtle bg-surface-sunken text-content-secondary cursor-default',
  error:    'border-stroke-feedback-error bg-surface-raised text-content-primary',
  warning:  'border-stroke-feedback-warning bg-surface-raised text-content-primary',
  success:  'border-stroke-feedback-success bg-surface-raised text-content-primary',
} as const;

const labelColor = {
  default:  'text-content-secondary',
  hover:    'text-content-secondary',
  focused:  'text-action-primary',
  disabled: 'text-content-disabled',
  readonly: 'text-content-secondary',
  error:    'text-content-feedback-error',
  warning:  'text-content-feedback-warning',
  success:  'text-content-feedback-success',
} as const;

const helperColor = {
  default:  'text-content-tertiary',
  hover:    'text-content-tertiary',
  focused:  'text-content-tertiary',
  disabled: 'text-content-disabled',
  readonly: 'text-content-tertiary',
  error:    'text-content-feedback-error',
  warning:  'text-content-feedback-warning',
  success:  'text-content-feedback-success',
} as const;

const iconColor = {
  default:  'text-content-tertiary',
  hover:    'text-content-tertiary',
  focused:  'text-action-primary',
  disabled: 'text-content-disabled',
  readonly: 'text-content-tertiary',
  error:    'text-content-feedback-error',
  warning:  'text-content-feedback-warning',
  success:  'text-content-feedback-success',
} as const;

export function ActionField({
  label = 'Label text',
  placeholder = 'Enter value',
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
  className = '',
}: ActionFieldProps) {
  const s = inputSize[size];

  const leftEl = variant === 'search'
    ? <Search className={cn(s.icon, iconColor[state])} />
    : leftIcon
      ? <span className={iconColor[state]}>{leftIcon}</span>
      : null;

  const rightEl = variant === 'removable-tag'
    ? (
      <button
        type="button"
        onClick={onRemove}
        disabled={state === 'disabled'}
        className={cn(iconColor[state], 'hover:text-content-primary transition-colors disabled:cursor-not-allowed')}
      >
        <X className={s.icon} />
      </button>
    )
    : rightIcon
      ? <span className={iconColor[state]}>{rightIcon}</span>
      : null;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {showLabel && (
        <label className={cn(s.label, 'font-medium flex items-center gap-1.5', labelColor[state])}>
          {label}
          {showInfoIcon && <Info className="w-3.5 h-3.5" />}
        </label>
      )}

      <div
        className={cn(
          'flex items-center gap-2 border rounded transition-colors',
          s.input,
          stateBorder[state],
        )}
      >
        {leftEl}
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={state === 'disabled'}
          readOnly={state === 'readonly'}
          className={cn(
            'flex-1 bg-transparent outline-none placeholder:text-content-placeholder',
            'disabled:cursor-not-allowed',
            state === 'readonly' && 'cursor-default',
          )}
        />
        {rightEl}
      </div>

      {showHelper && (
        <div className={cn(s.helper, helperColor[state])}>{helperText}</div>
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
  placeholder = 'Enter value',
  value = '',
  helperText = 'Helper text',
  state = 'default',
  size = 'normal',
  rows = 3,
  showLabel = true,
  showHelper = true,
  showInfoIcon = false,
  onChange,
  className = '',
}: TextAreaFieldProps) {
  const s = inputSize[size];

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {showLabel && (
        <label className={cn(s.label, 'font-medium flex items-center gap-1.5', labelColor[state])}>
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
        className={cn(
          'border rounded resize-none transition-colors outline-none',
          'placeholder:text-content-placeholder',
          s.input,
          stateBorder[state],
          'disabled:cursor-not-allowed',
          state === 'readonly' && 'cursor-default',
        )}
      />

      {showHelper && (
        <div className={cn(s.helper, helperColor[state])}>{helperText}</div>
      )}
    </div>
  );
}
