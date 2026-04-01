import { useState } from 'react';

interface RadioButtonProps {
  label?: string;
  size?: '14px' | '16px';
  disabled?: boolean;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  name?: string;
}

export function RadioButton({
  label,
  size = '16px',
  disabled = false,
  checked = false,
  onChange,
  name
}: RadioButtonProps) {
  const [isFocused, setIsFocused] = useState(false);

  const sizeClasses = {
    '14px': 'w-3.5 h-3.5',
    '16px': 'w-4 h-4'
  };

  const handleChange = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  return (
    <label className={`flex items-center gap-2 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
      <div className="relative">
        <input
          type="radio"
          name={name}
          checked={checked}
          disabled={disabled}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="sr-only"
        />
        <div
          className={`
            ${sizeClasses[size]}
            rounded-full border-2 transition-all
            ${checked
              ? 'border-[indigo-600] bg-white'
              : 'border-gray-400 bg-white'
            }
            ${disabled && checked ? 'border-gray-400' : ''}
            ${isFocused && !disabled ? 'ring-2 ring-[#3B9CFF] ring-offset-2' : ''}
            ${!disabled && !checked ? 'hover:border-[indigo-600]' : ''}
          `}
        >
          {checked && (
            <div
              className={`
                absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                rounded-full bg-[indigo-600]
                ${size === '14px' ? 'w-1.5 h-1.5' : 'w-2 h-2'}
                ${disabled ? 'bg-gray-400' : ''}
              `}
            />
          )}
        </div>
      </div>
      {label && (
        <span className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
          {label}
        </span>
      )}
    </label>
  );
}
