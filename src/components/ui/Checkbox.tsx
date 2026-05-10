import * as RadixCheckbox from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
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

  return (
    <label
      className={cn(
        'inline-flex items-center gap-2',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        className
      )}
    >
      <RadixCheckbox.Root
        checked={indeterminate ? 'indeterminate' : checked}
        onCheckedChange={(val) => {
          if (!disabled) onChange?.(val === true);
        }}
        disabled={disabled}
        className={cn(
          box,
          'rounded border-2 flex items-center justify-center transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus focus-visible:ring-offset-2',
          // unchecked
          !checked && !indeterminate && !isError && 'bg-surface-raised border-stroke-default hover:border-stroke-strong',
          !checked && !indeterminate && isError  && 'bg-surface-raised border-stroke-feedback-error',
          // checked/indeterminate primary
          (checked || indeterminate) && !isError && 'bg-hv-neutral-900 border-hv-neutral-900 hover:bg-hv-neutral-800',
          // checked/indeterminate error
          (checked || indeterminate) && isError  && 'bg-action-destructive border-action-destructive hover:bg-action-destructive-hover',
          // disabled unchecked
          disabled && !checked && !indeterminate && 'bg-surface-sunken border-stroke-subtle cursor-not-allowed',
          // disabled checked
          disabled && (checked || indeterminate) && 'bg-hv-neutral-400 border-hv-neutral-400 cursor-not-allowed',
        )}
      >
        <RadixCheckbox.Indicator>
          {indeterminate ? (
            <Minus className={cn(icon, 'text-white')} strokeWidth={3} />
          ) : (
            <Check className={cn(icon, 'text-white')} strokeWidth={3} />
          )}
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>

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
