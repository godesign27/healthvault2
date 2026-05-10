import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ToggleSize = 'normal' | 'small';

interface ToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: ToggleSize;
  label?: string;
  error?: boolean;
  errorMessage?: string;
  className?: string;
}

export function Toggle({ checked = false, onChange, disabled = false, size = 'normal', label, error = false, errorMessage, className = '' }: ToggleProps) {
  const isSmall = size === 'small';
  return (
    <div className={cn('inline-flex flex-col gap-1', className)}>
      <div className={cn('inline-flex items-center gap-3', disabled && 'cursor-not-allowed')}>
        {label && <span className={cn('text-sm select-none', disabled ? 'text-content-disabled' : 'text-content-secondary')}>{label}</span>}
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => !disabled && onChange?.(!checked)}
          className={cn(
            'relative inline-flex items-center rounded-full transition-colors duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus focus-visible:ring-offset-2',
            isSmall ? 'w-9 h-5' : 'w-11 h-6',
            checked
              ? (disabled ? 'bg-hv-neutral-400' : 'bg-action-primary hover:bg-action-primary-hover')
              : (disabled ? 'bg-hv-neutral-200' : 'bg-hv-neutral-300 hover:bg-hv-neutral-400'),
            disabled && 'cursor-not-allowed',
          )}
        >
          <span className={cn(
            'block rounded-full bg-white shadow transition-transform duration-200',
            isSmall ? 'w-4 h-4' : 'w-5 h-5',
            isSmall ? (checked ? 'translate-x-4' : 'translate-x-0.5') : (checked ? 'translate-x-5' : 'translate-x-0.5'),
          )} />
        </button>
      </div>
      {error && errorMessage && (
        <div className="flex items-center gap-1 text-content-feedback-error text-xs ml-1">
          <AlertCircle className="w-3 h-3" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}

interface ToggleGroupProps {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  value: string[];
  onChange: (value: string[]) => void;
  size?: ToggleSize;
  disabled?: boolean;
  className?: string;
}

export function ToggleGroup({ options, value, onChange, size = 'normal', disabled = false, className = '' }: ToggleGroupProps) {
  const handleChange = (optionValue: string, isChecked: boolean) => {
    onChange(isChecked ? [...value, optionValue] : value.filter((v) => v !== optionValue));
  };
  return (
    <div className={cn('space-y-3', className)}>
      {options.map((option) => (
        <Toggle
          key={option.value}
          checked={value.includes(option.value)}
          onChange={(checked) => handleChange(option.value, checked)}
          disabled={disabled || option.disabled}
          size={size}
          label={option.label}
        />
      ))}
    </div>
  );
}
