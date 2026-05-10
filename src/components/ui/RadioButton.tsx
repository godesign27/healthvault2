import * as RadioGroup from '@radix-ui/react-radio-group';
import { cn } from '../../lib/utils';

const sizeMap = {
  '14px': { box: 'w-3.5 h-3.5', dot: 'w-1.5 h-1.5' },
  '16px': { box: 'w-4 h-4',     dot: 'w-2 h-2' },
} as const;

interface RadioButtonProps {
  label?: string;
  size?: '14px' | '16px';
  disabled?: boolean;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  name?: string;
  value?: string;
}

export function RadioButton({
  label,
  size = '16px',
  disabled = false,
  checked = false,
  onChange,
  name,
  value = 'radio',
}: RadioButtonProps) {
  const { box, dot } = sizeMap[size];

  return (
    <RadioGroup.Root
      value={checked ? value : ''}
      onValueChange={(v) => onChange?.(v === value)}
      name={name}
      disabled={disabled}
    >
      <label className={cn('flex items-center gap-2', disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer')}>
        <RadioGroup.Item
          value={value}
          className={cn(
            box,
            'rounded-full border-2 bg-surface-raised transition-all relative',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus focus-visible:ring-offset-2',
            checked
              ? 'border-action-primary'
              : 'border-stroke-default hover:border-action-primary',
            disabled && 'cursor-not-allowed border-stroke-subtle',
          )}
        >
          <RadioGroup.Indicator className="flex items-center justify-center absolute inset-0">
            <div
              className={cn(
                dot,
                'rounded-full',
                disabled ? 'bg-hv-neutral-400' : 'bg-action-primary',
              )}
            />
          </RadioGroup.Indicator>
        </RadioGroup.Item>
        {label && (
          <span className={cn('text-sm select-none', disabled ? 'text-content-disabled' : 'text-content-secondary')}>
            {label}
          </span>
        )}
      </label>
    </RadioGroup.Root>
  );
}
