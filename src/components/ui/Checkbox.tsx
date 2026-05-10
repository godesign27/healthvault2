import { Check, Minus } from 'lucide-react';
import { useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

export type CheckboxSize = '20px' | '18px' | '16px' | '14px';
export type CheckboxVariant = 'primary' | 'error';

const sizeMap = {
  '20px': { box: 'w-5 h-5',           icon: 'w-4 h-4' },
  '18px': { box: 'w-[18px] h-[18px]', icon: 'w-3.5 h-3.5' },
  '16px': { box: 'w-4 h-4',           icon: 'w-3 h-3' },
  '14px': { box: 'w-3.5 h-3.5',       icon: 'w-2.5 h-2.5' },
} as const;

interface CheckboxProps {
  checked?: boolean;
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  variant?: CheckboxVariant;
  size?: CheckboxSize;
  label?: string;
  className?: string;
}

export function Checkbox({
  checked = false,
  indeterminate = false,
  onChange,
  disabled = false,
  variant = 'primary',
  size = '20px',
  label,
  className = '',
}: CheckboxProps) {
  const { box, icon } = sizeMap[size];
  const isError = variant === 'error';
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <label
      className={cn(
        'inline-flex items-center gap-2',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        className
      )}
    >
      {/* hidden native input for accessibility */}
      <input
        ref={inputRef}
        type="checkbox"
        checked={checked}
        onChange={(e) => { if (!disabled) onChange?.(e.target.checked); }}
        disabled={disabled}
        className="sr-only"
      />

      {/* custom visual */}
      <span
        aria-hidden="true"
        className={cn(
          box,
          'rounded border-2 flex items-center justify-center transition-all shrink-0',
          !checked && !indeterminate && !isError && 'bg-surface-raised border-stroke-default hover:border-stroke-strong',
          !checked && !indeterminate && isError  && 'bg-surface-raised border-stroke-feedback-error',
          (checked || indeterminate) && !isError && 'bg-hv-neutral-900 border-hv-neutral-900 hover:bg-hv-neutral-800',
          (checked || indeterminate) && isError  && 'bg-action-destructive border-action-destructive hover:bg-action-destructive-hover',
          disabled && !checked && !indeterminate && 'bg-surface-sunken border-stroke-subtle cursor-not-allowed',
          disabled && (checked || indeterminate) && 'bg-hv-neutral-400 border-hv-neutral-400 cursor-not-allowed',
        )}
      >
        {(checked || indeterminate) && (
          indeterminate
            ? <Minus className={cn(icon, 'text-white')} strokeWidth={3} />
            : <Check className={cn(icon, 'text-white')} strokeWidth={3} />
        )}
      </span>

      {label && (
        <span className={cn('text-sm select-none', disabled ? 'text-content-disabled' : 'text-content-secondary')}>
          {label}
        </span>
      )}
    </label>
  );
}

interface CheckboxGroupProps {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  value: string[];
  onChange: (value: string[]) => void;
  variant?: CheckboxVariant;
  size?: CheckboxSize;
  disabled?: boolean;
  className?: string;
}

export function CheckboxGroup({
  options,
  value,
  onChange,
  variant = 'primary',
  size = '16px',
  disabled = false,
  className = '',
}: CheckboxGroupProps) {
  const handleChange = (optionValue: string, isChecked: boolean) => {
    onChange(isChecked
      ? [...value, optionValue]
      : value.filter((v) => v !== optionValue)
    );
  };

  return (
    <div className={cn('space-y-2', className)}>
      {options.map((option) => (
        <Checkbox
          key={option.value}
          checked={value.includes(option.value)}
          onChange={(checked) => handleChange(option.value, checked)}
          disabled={disabled || option.disabled}
          variant={variant}
          size={size}
          label={option.label}
        />
      ))}
    </div>
  );
}
