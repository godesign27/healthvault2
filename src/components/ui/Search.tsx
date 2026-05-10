import { useState } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { cn } from '../../lib/utils';

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

const sizeClass = {
  small:  'px-3 py-1.5 text-sm pl-9',
  medium: 'px-4 py-2 text-sm pl-10',
  large:  'px-4 py-3 text-base pl-11',
} as const;

const iconSize = {
  small:  'w-4 h-4',
  medium: 'w-4 h-4',
  large:  'w-5 h-5',
} as const;

const iconLeft = {
  small:  'left-2.5',
  medium: 'left-3',
  large:  'left-3',
} as const;

const variantClass = {
  default:  'border-0 bg-surface-sunken focus:bg-surface-raised focus:ring-1 focus:ring-stroke-focus',
  outlined: 'border border-stroke-default bg-surface-raised focus:border-action-primary focus:ring-1 focus:ring-action-primary',
  filled:   'border-0 bg-surface-sunken focus:bg-action-secondary',
} as const;

export function Search({
  placeholder = 'Search...',
  value,
  onChange,
  onClear,
  variant = 'outlined',
  size = 'medium',
  showClearButton = false,
  disabled = false,
}: SearchProps) {
  const [internal, setInternal] = useState(value ?? '');
  const controlled = value !== undefined;
  const current    = controlled ? value : internal;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!controlled) setInternal(e.target.value);
    onChange?.(e.target.value);
  };

  const handleClear = () => {
    if (!controlled) setInternal('');
    onChange?.('');
    onClear?.();
  };

  return (
    <div className="relative w-full">
      <SearchIcon
        className={cn(
          'absolute top-1/2 -translate-y-1/2 text-content-tertiary pointer-events-none',
          iconLeft[size],
          iconSize[size],
        )}
      />
      <input
        type="text"
        value={current}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'w-full rounded outline-none transition-all text-content-primary placeholder:text-content-placeholder',
          sizeClass[size],
          variantClass[variant],
          showClearButton && current ? 'pr-10' : 'pr-4',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      />
      {showClearButton && current && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-action-secondary transition-colors"
        >
          <X className={cn(iconSize[size], 'text-content-secondary')} />
        </button>
      )}
    </div>
  );
}

interface SearchWithButtonProps extends SearchProps {
  buttonText?: string;
  onSearch?: () => void;
}

export function SearchWithButton({ buttonText = 'Search', onSearch, ...searchProps }: SearchWithButtonProps) {
  return (
    <div className="flex gap-2 w-full">
      <div className="flex-1">
        <Search {...searchProps} />
      </div>
      <button
        onClick={onSearch}
        className="px-5 py-2 bg-action-primary text-content-on-action rounded hover:bg-action-primary-hover transition-colors font-medium whitespace-nowrap text-sm"
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
  dropdownOptions = ['All'],
  selectedOption = 'All',
  onSelectOption,
  ...searchProps
}: SearchWithDropdownProps) {
  return (
    <div className="flex gap-2 w-full">
      <select
        value={selectedOption}
        onChange={(e) => onSelectOption?.(e.target.value)}
        className="px-3 py-2 border border-stroke-default rounded bg-surface-raised text-content-primary focus:border-action-primary focus:ring-1 focus:ring-action-primary outline-none text-sm"
      >
        {dropdownOptions.map((opt, i) => (
          <option key={i} value={opt}>{opt}</option>
        ))}
      </select>
      <div className="flex-1">
        <Search {...searchProps} />
      </div>
    </div>
  );
}

export function SearchStacked({
  dropdownOptions = ['All'],
  selectedOption = 'All',
  onSelectOption,
  ...searchProps
}: SearchWithDropdownProps) {
  return (
    <div className="flex flex-col gap-3 w-full">
      <select
        value={selectedOption}
        onChange={(e) => onSelectOption?.(e.target.value)}
        className="px-3 py-2 border border-stroke-default rounded bg-surface-raised text-content-primary focus:border-action-primary focus:ring-1 focus:ring-action-primary outline-none text-sm"
      >
        {dropdownOptions.map((opt, i) => (
          <option key={i} value={opt}>{opt}</option>
        ))}
      </select>
      <Search {...searchProps} />
    </div>
  );
}

export function SearchIconOnly({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const btn = { small: 'w-8 h-8', medium: 'w-10 h-10', large: 'w-12 h-12' };
  const ico = { small: 'w-4 h-4', medium: 'w-5 h-5', large: 'w-6 h-6' };

  return (
    <button className={cn(btn[size], 'flex items-center justify-center border border-stroke-default rounded bg-surface-raised hover:bg-action-secondary transition-colors')}>
      <SearchIcon className={cn(ico[size], 'text-content-secondary')} />
    </button>
  );
}
