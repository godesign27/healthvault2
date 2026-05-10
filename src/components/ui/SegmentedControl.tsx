import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { cn } from '../../lib/utils';

interface SegmentedControlProps {
  options: string[];
  value?: string;
  onChange?: (value: string) => void;
  size?: 'small' | 'normal' | 'x-small';
  variant?: 'solid' | 'outline';
  disabled?: boolean;
}

const sizePadding = {
  'x-small': 'text-[10px] px-2 py-0.5',
  small:     'text-xs px-3 py-1',
  normal:    'text-sm px-4 py-2',
} as const;

export function SegmentedControl({
  options,
  value,
  onChange,
  size = 'normal',
  variant = 'solid',
  disabled = false,
}: SegmentedControlProps) {
  const padding = sizePadding[size];

  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(v) => v && onChange?.(v)}
      disabled={disabled}
      className="inline-flex rounded overflow-hidden"
    >
      {options.map((option, i) => {
        const isFirst = i === 0;
        const isLast  = i === options.length - 1;

        return (
          <ToggleGroup.Item
            key={option}
            value={option}
            className={cn(
              padding,
              'font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus focus-visible:ring-inset',
              isFirst && 'rounded-l',
              isLast  && 'rounded-r',
              variant === 'solid' ? cn(
                'data-[state=on]:bg-action-primary data-[state=on]:text-content-on-action',
                disabled
                  ? 'bg-surface-sunken text-content-disabled cursor-not-allowed data-[state=on]:bg-hv-neutral-400'
                  : 'bg-surface-sunken text-content-secondary hover:bg-action-secondary data-[state=off]:hover:bg-action-secondary',
              ) : cn(
                'border border-stroke-default bg-surface-raised',
                !isFirst && '-ml-px',
                'data-[state=on]:border-action-primary data-[state=on]:text-action-primary data-[state=on]:z-10',
                disabled
                  ? 'text-content-disabled cursor-not-allowed'
                  : 'text-content-secondary hover:border-stroke-strong',
              ),
            )}
          >
            {option}
          </ToggleGroup.Item>
        );
      })}
    </ToggleGroup.Root>
  );
}
