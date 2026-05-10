import { useState } from 'react';
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

export function Slider({ min = 0, max = 100, step = 1, value, defaultValue = 50, onChange, disabled = false, error = false, showValue = false, showTicks = false, label, className = '' }: SliderProps) {
  const [internal, setInternal] = useState(defaultValue);
  const controlled   = value !== undefined;
  const displayValue = controlled ? value! : internal;
  const percentage   = ((displayValue - min) / (max - min)) * 100;

  const fillColor = error ? 'var(--hv-color-action-destructive-default)' : disabled ? 'var(--hv-color-neutral-400)' : 'var(--hv-color-action-primary-default)';
  const trackBg   = `linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${percentage}%, var(--hv-color-surface-sunken) ${percentage}%, var(--hv-color-surface-sunken) 100%)`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    if (!controlled) setInternal(v);
    onChange?.(v);
  };

  return (
    <div className={cn('w-full', className)}>
      {label && <label className="block text-sm font-medium text-content-secondary mb-2">{label}</label>}
      <div className="relative">
        {showValue && (
          <div className="absolute -top-8 bg-hv-neutral-900 text-hv-neutral-0 text-xs px-2 py-1 rounded pointer-events-none" style={{ left: `calc(${percentage}% - 20px)` }}>
            {displayValue}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-hv-neutral-900" />
          </div>
        )}
        <input
          type="range"
          min={min} max={max} step={step}
          value={displayValue}
          onChange={handleChange}
          disabled={disabled}
          style={{ background: trackBg }}
          className={cn(
            'w-full h-2 rounded-full appearance-none cursor-pointer',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus focus-visible:ring-offset-2',
            disabled && 'cursor-not-allowed opacity-60',
            '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5',
            '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-surface-raised [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform',
            error ? '[&::-webkit-slider-thumb]:border-action-destructive' : disabled ? '[&::-webkit-slider-thumb]:border-stroke-subtle' : '[&::-webkit-slider-thumb]:border-action-primary hover:[&::-webkit-slider-thumb]:scale-110',
            '[&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-surface-raised [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-action-primary',
          )}
        />
        {showTicks && (
          <div className="flex justify-between mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="text-xs text-content-tertiary">{Math.round(min + ((max - min) / 4) * i)}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
