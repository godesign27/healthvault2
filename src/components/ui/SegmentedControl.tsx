import { cn } from '../../lib/utils';

interface SegmentedControlProps {
  options: string[];
  value?: string;
  onChange?: (value: string) => void;
  size?: 'small' | 'normal' | 'x-small';
  variant?: 'solid' | 'outline';
  disabled?: boolean;
}

const sizePadding = { 'x-small': 'text-[10px] px-2 py-0.5', small: 'text-xs px-3 py-1', normal: 'text-sm px-4 py-2' } as const;

export function SegmentedControl({ options, value, onChange, size = 'normal', variant = 'solid', disabled = false }: SegmentedControlProps) {
  const padding = sizePadding[size];
  return (
    <div className="inline-flex rounded overflow-hidden">
      {options.map((option, i) => {
        const isFirst    = i === 0;
        const isLast     = i === options.length - 1;
        const isSelected = value === option;
        return (
          <button
            key={option}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onChange?.(option)}
            className={cn(
              padding, 'font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus focus-visible:ring-inset',
              isFirst && 'rounded-l',
              isLast  && 'rounded-r',
              variant === 'solid'
                ? (isSelected ? 'bg-action-primary text-content-on-action' : disabled ? 'bg-surface-sunken text-content-disabled cursor-not-allowed' : 'bg-surface-sunken text-content-secondary hover:bg-action-secondary')
                : cn('border border-stroke-default bg-surface-raised', !isFirst && '-ml-px', isSelected ? 'border-action-primary text-action-primary z-10' : disabled ? 'text-content-disabled cursor-not-allowed' : 'text-content-secondary hover:border-stroke-strong'),
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
