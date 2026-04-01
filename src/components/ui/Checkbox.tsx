import { Check, Minus } from 'lucide-react';

export type CheckboxSize = '20px' | '18px' | '16px' | '14px';
export type CheckboxVariant = 'primary' | 'error';

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
  className = ''
}: CheckboxProps) {
  const getSizeClasses = () => {
    switch (size) {
      case '20px':
        return 'w-5 h-5';
      case '18px':
        return 'w-[18px] h-[18px]';
      case '16px':
        return 'w-4 h-4';
      case '14px':
        return 'w-3.5 h-3.5';
      default:
        return 'w-5 h-5';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case '20px':
        return 'w-4 h-4';
      case '18px':
        return 'w-3.5 h-3.5';
      case '16px':
        return 'w-3 h-3';
      case '14px':
        return 'w-2.5 h-2.5';
      default:
        return 'w-4 h-4';
    }
  };

  const getCheckboxClasses = () => {
    const baseClasses = `${getSizeClasses()} rounded border-2 flex items-center justify-center transition-all cursor-pointer`;

    if (disabled) {
      if (checked || indeterminate) {
        if (variant === 'error') {
          return `${baseClasses} bg-[#8B1F1F] border-[#8B1F1F] cursor-not-allowed`;
        }
        return `${baseClasses} bg-stone-400 border-stone-400 cursor-not-allowed`;
      }
      return `${baseClasses} bg-gray-100 border-gray-300 cursor-not-allowed`;
    }

    if (checked || indeterminate) {
      if (variant === 'error') {
        return `${baseClasses} bg-[#C1292E] border-[#C1292E] hover:bg-[#A01F23]`;
      }
      return `${baseClasses} bg-stone-900 border-stone-900 hover:bg-stone-800`;
    }

    if (variant === 'error') {
      return `${baseClasses} bg-white border-[#C1292E] hover:border-[#A01F23]`;
    }

    return `${baseClasses} bg-white border-stone-400 hover:border-indigo-600`;
  };

  const getFocusClasses = () => {
    return 'focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2';
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
    <label className={`inline-flex items-center gap-2 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${className}`}>
      <div className={getFocusClasses()}>
        <div
          role="checkbox"
          aria-checked={indeterminate ? 'mixed' : checked}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          className={getCheckboxClasses()}
        >
          {indeterminate ? (
            <Minus className={`${getIconSize()} text-white`} strokeWidth={3} />
          ) : checked ? (
            <Check className={`${getIconSize()} text-white`} strokeWidth={3} />
          ) : null}
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
  className = ''
}: CheckboxGroupProps) {
  const handleChange = (optionValue: string, isChecked: boolean) => {
    if (isChecked) {
      onChange([...value, optionValue]);
    } else {
      onChange(value.filter(v => v !== optionValue));
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {options.map(option => (
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
