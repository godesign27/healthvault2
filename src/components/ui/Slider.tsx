import * as RadixSlider from '@radix-ui/react-slider';
import { cn } from '../../lib/utils';

interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  error?: boolean;
  showValue?: boolean;
  showTicks?: boolean;
  label?: string;
  className?: string;
}

export function Slider({
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue = 50,
  onChange,
  disabled = false,
  error = false,
  showValue = false,
  showTicks = false,
  label,
  className = '',
}: SliderProps) {
  const controlled = value !== undefined;
  const displayValue = controlled ? value : defaultValue;
  const percentage = ((displayValue - min) / (max - min)) * 100;

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-content-secondary mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        {showValue && (
          <div
            className="absolute -top-8 bg-hv-neutral-900 text-hv-neutral-0 text-xs px-2 py-1 rounded pointer-events-none"
            style={{ left: `calc(${percentage}% - 20px)` }}
          >
            {displayValue}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-hv-neutral-900" />
          </div>
        )}

        <RadixSlider.Root
          min={min}
          max={max}
          step={step}
          value={controlled ? [value!] : undefined}
          defaultValue={[defaultValue]}
          onValueChange={([v]) => onChange?.(v)}
          disabled={disabled}
          className="relative flex items-center w-full h-5 select-none touch-none"
        >
          <RadixSlider.Track className="relative h-2 w-full rounded-full bg-surface-sunken overflow-hidden">
            <RadixSlider.Range
              className={cn(
                'absolute h-full rounded-full',
                error    ? 'bg-action-destructive' :
                disabled ? 'bg-hv-neutral-400' :
                           'bg-action-primary',
              )}
            />
          </RadixSlider.Track>

          <RadixSlider.Thumb
            className={cn(
              'block w-5 h-5 rounded-full bg-surface-raised shadow-md border-2 transition-transform',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus focus-visible:ring-offset-2',
              error    ? 'border-action-destructive' :
              disabled ? 'border-hv-neutral-400 cursor-not-allowed' :
                         'border-action-primary hover:scale-110 cursor-pointer',
            )}
          />
        </RadixSlider.Root>

        {showTicks && (
          <div className="flex justify-between mt-1">
            {Array.from({ length: 5 }).map((_, i) => {
              const tickValue = min + ((max - min) / 4) * i;
              return (
                <span key={i} className="text-xs text-content-tertiary">
                  {Math.round(tickValue)}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
