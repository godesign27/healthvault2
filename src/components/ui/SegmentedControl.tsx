import { useState } from 'react';

interface SegmentedControlProps {
  options: string[];
  value?: string;
  onChange?: (value: string) => void;
  size?: 'small' | 'normal' | 'x-small';
  variant?: 'solid' | 'outline';
  position?: 'left' | 'middle' | 'right';
  disabled?: boolean;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  size = 'normal',
  variant = 'solid',
  position = 'middle',
  disabled = false
}: SegmentedControlProps) {
  const [selectedValue, setSelectedValue] = useState(value || options[0]);

  const handleChange = (option: string) => {
    if (disabled) return;
    setSelectedValue(option);
    onChange?.(option);
  };

  const sizeClasses = {
    'x-small': 'text-[10px] px-2 py-0.5',
    'small': 'text-xs px-3 py-1',
    'normal': 'text-sm px-4 py-2'
  };

  const getButtonClasses = (option: string, index: number) => {
    const isSelected = option === selectedValue;
    const isFirst = index === 0;
    const isLast = index === options.length - 1;

    let baseClasses = `${sizeClasses[size]} transition-colors font-medium `;

    if (variant === 'solid') {
      if (isSelected) {
        baseClasses += disabled
          ? 'bg-gray-400 text-white cursor-not-allowed'
          : 'bg-[indigo-600] text-white';
      } else {
        baseClasses += disabled
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200';
      }
    } else {
      if (isSelected) {
        baseClasses += disabled
          ? 'border-2 border-gray-400 bg-white text-gray-400 cursor-not-allowed'
          : 'border-2 border-[indigo-600] bg-white text-[indigo-600]';
      } else {
        baseClasses += disabled
          ? 'border border-gray-300 bg-white text-gray-400 cursor-not-allowed'
          : 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400';
      }
    }

    if (position === 'left') {
      if (isFirst) baseClasses += ' rounded-l';
    } else if (position === 'right') {
      if (isLast) baseClasses += ' rounded-r';
    } else {
      if (isFirst) baseClasses += ' rounded-l';
      if (isLast) baseClasses += ' rounded-r';
    }

    if (!isFirst && variant === 'outline') {
      baseClasses += ' -ml-px';
    }

    return baseClasses;
  };

  return (
    <div className="inline-flex">
      {options.map((option, index) => (
        <button
          key={option}
          onClick={() => handleChange(option)}
          className={getButtonClasses(option, index)}
          disabled={disabled}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
