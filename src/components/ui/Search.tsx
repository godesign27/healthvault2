import React, { useState } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';

interface SearchProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onClear?: () => void;
  variant?: 'default' | 'outlined' | 'filled';
  size?: 'small' | 'medium' | 'large';
  showClearButton?: boolean;
  disabled?: boolean;
}

export function Search({
  placeholder = 'Search...',
  value = '',
  onChange,
  onClear,
  variant = 'outlined',
  size = 'medium',
  showClearButton = false,
  disabled = false
}: SearchProps) {
  const [internalValue, setInternalValue] = useState(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onChange?.(newValue);
  };

  const handleClear = () => {
    setInternalValue('');
    onChange?.('');
    onClear?.();
  };

  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-4 py-3 text-lg'
  };

  const variantClasses = {
    default: 'border-0 bg-slate-100 focus:bg-white focus:ring-2 focus:ring-teal-500',
    outlined: 'border border-slate-300 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500',
    filled: 'border-0 bg-slate-100 focus:bg-slate-200'
  };

  return (
    <div className="relative w-full">
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
      <input
        type="text"
        value={internalValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full pl-10 rounded-md outline-none transition-all
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${showClearButton && internalValue ? 'pr-10' : 'pr-4'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      />
      {showClearButton && internalValue && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200 transition-colors"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>
      )}
    </div>
  );
}

interface SearchWithButtonProps extends SearchProps {
  buttonText?: string;
  onSearch?: () => void;
}

export function SearchWithButton({
  buttonText = 'Button',
  onSearch,
  ...searchProps
}: SearchWithButtonProps) {
  return (
    <div className="flex gap-2 w-full">
      <div className="flex-1">
        <Search {...searchProps} />
      </div>
      <button
        onClick={onSearch}
        className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors font-medium whitespace-nowrap"
      >
        {buttonText}
      </button>
    </div>
  );
}

interface SearchWithDropdownProps extends SearchProps {
  dropdownOptions?: string[];
  selectedOption?: string;
  onSelectOption?: (option: string) => void;
}

export function SearchWithDropdown({
  dropdownOptions = ['Select an option'],
  selectedOption = 'Select an option',
  onSelectOption,
  ...searchProps
}: SearchWithDropdownProps) {
  return (
    <div className="flex gap-2 w-full">
      <select
        value={selectedOption}
        onChange={(e) => onSelectOption?.(e.target.value)}
        className="px-4 py-2 border border-slate-300 rounded-md bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500 outline-none"
      >
        {dropdownOptions.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
      <div className="flex-1">
        <Search {...searchProps} />
      </div>
    </div>
  );
}

interface SearchStackedProps extends SearchProps {
  dropdownOptions?: string[];
  selectedOption?: string;
  onSelectOption?: (option: string) => void;
}

export function SearchStacked({
  dropdownOptions = ['Select an option'],
  selectedOption = 'Select an option',
  onSelectOption,
  ...searchProps
}: SearchStackedProps) {
  return (
    <div className="flex flex-col gap-3 w-full">
      <select
        value={selectedOption}
        onChange={(e) => onSelectOption?.(e.target.value)}
        className="px-4 py-2 border border-slate-300 rounded-md bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500 outline-none"
      >
        {dropdownOptions.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
      <Search {...searchProps} />
    </div>
  );
}

export function SearchIconOnly({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-10 h-10',
    large: 'w-12 h-12'
  };

  const iconSizes = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  };

  return (
    <button className={`${sizeClasses[size]} flex items-center justify-center border border-slate-300 rounded-md bg-white hover:bg-slate-50 transition-colors`}>
      <SearchIcon className={`${iconSizes[size]} text-slate-600`} />
    </button>
  );
}
