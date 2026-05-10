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

export function RadioButton({ label, size = '16px', disabled = false, checked = false, onChange, name, value = 'radio' }: RadioButtonProps) {
  const { box, dot } = sizeMap[size];
  return (
    <label className={cn('flex items-center gap-2', disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer')}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          box, 'rounded-full border-2 bg-surface-raised transition-all relative flex items-center justify-center',
          checked ? 'border-action-primary' : 'border-stroke-default hover:border-action-primary',
          disabled && 'border-stroke-subtle cursor-not-allowed',
        )}
      >
        {checked && <span className={cn(dot, 'rounded-full', disabled ? 'bg-hv-neutral-400' : 'bg-action-primary')} />}
      </span>
      {label && (
        <span className={cn('text-sm select-none', disabled ? 'text-content-disabled' : 'text-content-secondary')}>{label}</span>
      )}
    </label>
  );
}
