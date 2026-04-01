import { useState } from 'react';

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
  value: controlledValue,
  defaultValue = 50,
  onChange,
  disabled = false,
  error = false,
  showValue = false,
  showTicks = false,
  label,
  className = ''
}: SliderProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  const percentage = ((value - min) / (max - min)) * 100;

  const trackColorClass = error
    ? 'bg-red-600'
    : disabled
    ? 'bg-gray-400'
    : 'bg-[indigo-600]';

  const handleColorClass = error
    ? 'bg-red-700 border-red-700'
    : disabled
    ? 'bg-gray-400 border-gray-400'
    : 'bg-[indigo-600] border-[indigo-600]';

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        <div className="relative h-2 bg-gray-200 rounded-full">
          <div
            className={`absolute h-full rounded-full transition-all ${trackColorClass}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="absolute top-0 left-0 w-full h-2 opacity-0 cursor-pointer disabled:cursor-not-allowed"
          style={{ margin: 0 }}
        />

        <div
          className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 bg-white shadow-md transition-all ${handleColorClass} ${
            disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110'
          }`}
          style={{ left: `calc(${percentage}% - 10px)` }}
        />

        {showValue && (
          <div
            className="absolute -top-8 bg-gray-900 text-white text-xs px-2 py-1 rounded"
            style={{ left: `calc(${percentage}% - 20px)` }}
          >
            {value}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
          </div>
        )}

        {showTicks && (
          <div className="flex justify-between mt-1">
            {Array.from({ length: 5 }).map((_, i) => {
              const tickValue = min + ((max - min) / 4) * i;
              return (
                <span key={i} className="text-xs text-gray-500">
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
