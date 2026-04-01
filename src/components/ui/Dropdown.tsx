import { ChevronDown, Check, X, ChevronRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export type DropdownSize = 'normal' | 'small' | 'xsmall';
export type DropdownVariant = 'outline' | 'filled';

interface DropdownOption {
  value: string;
  label: string;
  submenu?: DropdownOption[];
  disabled?: boolean;
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  size?: DropdownSize;
  variant?: DropdownVariant;
  disabled?: boolean;
  showCheckmark?: boolean;
  className?: string;
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select value',
  size = 'normal',
  variant = 'outline',
  disabled = false,
  showCheckmark = false,
  className = ''
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hoveredSubmenu, setHoveredSubmenu] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSizeClasses = () => {
    switch (size) {
      case 'xsmall':
        return 'px-2 py-1 text-xs';
      case 'small':
        return 'px-3 py-1.5 text-sm';
      case 'normal':
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  const getButtonClasses = () => {
    const baseClasses = `flex items-center justify-between transition-all ${getSizeClasses()}`;

    if (disabled) {
      return `${baseClasses} bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed`;
    }

    if (variant === 'filled') {
      if (isFocused) {
        return `${baseClasses} bg-white text-gray-900 border border-[indigo-600]`;
      }
      if (value) {
        return `${baseClasses} bg-gray-50 text-gray-900 border border-[#5B5864] hover:bg-gray-100`;
      }
      return `${baseClasses} bg-gray-50 text-gray-500 border border-[#5B5864] hover:bg-gray-100`;
    }

    if (isFocused) {
      return `${baseClasses} bg-white text-gray-900 border border-[indigo-600]`;
    }
    if (value) {
      return `${baseClasses} bg-white text-gray-900 border border-[#5B5864] hover:border-gray-400`;
    }
    return `${baseClasses} bg-white text-gray-500 border border-[#5B5864] hover:border-gray-400`;
  };

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
    setIsFocused(false);
  };

  const renderOption = (option: DropdownOption) => {
    const isSelected = option.value === value;
    const hasSubmenu = option.submenu && option.submenu.length > 0;
    const isHovered = hoveredSubmenu === option.value;
    const isDisabled = option.disabled || false;

    return (
      <div
        key={option.value}
        className="relative"
        onMouseEnter={() => hasSubmenu && !isDisabled && setHoveredSubmenu(option.value)}
        onMouseLeave={() => hasSubmenu && setHoveredSubmenu(null)}
      >
        <button
          onClick={() => !hasSubmenu && !isDisabled && handleSelect(option.value)}
          disabled={isDisabled}
          className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors ${
            isDisabled
              ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
              : isSelected
              ? 'bg-[#0D4B56] text-white'
              : 'text-gray-700 hover:bg-[#0D4B56] hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            {showCheckmark && isSelected && <Check className="w-4 h-4" />}
            {option.label}
          </span>
          {hasSubmenu && <ChevronRight className="w-4 h-4" />}
        </button>

        {hasSubmenu && isHovered && (
          <div className="absolute left-full top-0 ml-1 bg-white border border-[#5B5864] shadow-lg z-50 min-w-[160px]">
            {option.submenu!.map(subOption => (
              <button
                key={subOption.value}
                onClick={() => handleSelect(subOption.value)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  subOption.value === value
                    ? 'bg-[#0D4B56] text-white'
                    : 'text-gray-700 hover:bg-[#0D4B56] hover:text-white'
                }`}
              >
                {subOption.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setIsFocused(!isOpen);
          }
        }}
        onFocus={() => !disabled && setIsFocused(true)}
        className={`${getButtonClasses()} w-full`}
        disabled={disabled}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1 ml-2">
          {showCheckmark && value && <Check className="w-4 h-4 text-[indigo-600]" />}
          {!disabled && value && variant === 'outline' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChange?.('');
              }}
              className="hover:bg-[indigo-600] hover:text-white rounded-full p-0.5 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-[#5B5864] shadow-lg z-40 max-h-60 overflow-y-auto w-full">
          {options.map(renderOption)}
        </div>
      )}
    </div>
  );
}

interface SimpleDropdownProps {
  value: string;
  onChange: (value: string) => void;
  size?: DropdownSize;
  variant?: DropdownVariant;
  disabled?: boolean;
  className?: string;
}

export function SimpleDropdown({
  value,
  onChange,
  size = 'normal',
  variant = 'outline',
  disabled = false,
  className = ''
}: SimpleDropdownProps) {
  const options: DropdownOption[] = [
    { value: '1', label: 'Menu item 1' },
    { value: '2', label: 'Menu item 2' },
    { value: '3', label: 'Menu item 3' },
    { value: '4', label: 'Menu item 4' },
    { value: '5', label: 'Menu item 5' }
  ];

  return (
    <Dropdown
      options={options}
      value={value}
      onChange={onChange}
      size={size}
      variant={variant}
      disabled={disabled}
      className={className}
    />
  );
}

export function DropdownWithSubmenu({
  value,
  onChange,
  size = 'normal',
  showCheckmark = false,
  className = ''
}: {
  value: string;
  onChange: (value: string) => void;
  size?: DropdownSize;
  showCheckmark?: boolean;
  className?: string;
}) {
  const options: DropdownOption[] = [
    { value: '1', label: 'Menu item 1' },
    { value: '2', label: 'Menu item 2' },
    { value: '3', label: 'Menu item 3' },
    { value: '4', label: 'Menu item 4' },
    {
      value: 'submenu',
      label: 'Submenu',
      submenu: [
        { value: 'sub1', label: 'Submenu item 1' },
        { value: 'sub2', label: 'Submenu item 2' },
        { value: 'sub3', label: 'Submenu item 3' }
      ]
    },
    { value: '5', label: 'Menu item 5' }
  ];

  return (
    <Dropdown
      options={options}
      value={value}
      onChange={onChange}
      size={size}
      showCheckmark={showCheckmark}
      className={className}
    />
  );
}
