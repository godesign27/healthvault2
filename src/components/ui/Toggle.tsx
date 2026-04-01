import { AlertCircle } from 'lucide-react';

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

export function Toggle({
  checked = false,
  onChange,
  disabled = false,
  size = 'normal',
  label,
  error = false,
  errorMessage,
  className = ''
}: ToggleProps) {
  const getSizeClasses = () => {
    if (size === 'small') {
      return {
        track: 'w-9 h-5',
        thumb: 'w-4 h-4',
        translate: checked ? 'translate-x-4' : 'translate-x-0.5'
      };
    }
    return {
      track: 'w-11 h-6',
      thumb: 'w-5 h-5',
      translate: checked ? 'translate-x-5' : 'translate-x-0.5'
    };
  };

  const getTrackClasses = () => {
    const sizes = getSizeClasses();
    const baseClasses = `${sizes.track} relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer`;

    if (disabled) {
      if (checked) {
        return `${baseClasses} bg-[indigo-400] cursor-not-allowed`;
      }
      return `${baseClasses} bg-gray-300 cursor-not-allowed`;
    }

    if (checked) {
      return `${baseClasses} bg-[indigo-600] hover:bg-[indigo-700]`;
    }

    return `${baseClasses} bg-gray-400 hover:bg-gray-500`;
  };

  const getThumbClasses = () => {
    const sizes = getSizeClasses();
    return `${sizes.thumb} ${sizes.translate} inline-block rounded-full bg-white transition-transform duration-200 ease-in-out`;
  };

  const handleClick = () => {
    if (!disabled) {
      onChange?.(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      <div className={`inline-flex items-center gap-3 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
        {label && (
          <span className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-700'} select-none`}>
            {label}
          </span>
        )}
        <div
          role="switch"
          aria-checked={checked}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          className={`${getTrackClasses()} focus:outline-none focus:ring-2 focus:ring-[indigo-600] focus:ring-offset-2`}
        >
          <span className={getThumbClasses()} />
        </div>
      </div>
      {error && errorMessage && (
        <div className="flex items-center gap-1 text-[#EF4444] text-xs ml-1">
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

export function ToggleGroup({
  options,
  value,
  onChange,
  size = 'normal',
  disabled = false,
  className = ''
}: ToggleGroupProps) {
  const handleChange = (optionValue: string, isChecked: boolean) => {
    if (isChecked) {
      onChange([...value, optionValue]);
    } else {
      onChange(value.filter(v => v !== optionValue));
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {options.map(option => (
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
