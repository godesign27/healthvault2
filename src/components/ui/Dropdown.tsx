import { ChevronDown, ChevronRight, Check, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

export type DropdownSize    = 'normal' | 'small' | 'xsmall';
export type DropdownVariant = 'outline' | 'filled';

interface DropdownOption {
  value: string;
  label: string;
  submenu?: DropdownOption[];
  disabled?: boolean;
}

const sizeTrigger = { xsmall: 'px-2 py-1 text-xs', small: 'px-3 py-1.5 text-sm', normal: 'px-4 py-2 text-sm' } as const;
const sizeItem    = { xsmall: 'px-2 py-1 text-xs', small: 'px-3 py-1.5 text-sm', normal: 'px-4 py-2 text-sm' } as const;

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

export function Dropdown({ options, value, onChange, placeholder = 'Select value', size = 'normal', variant = 'outline', disabled = false, showCheckmark = false, className = '' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedLabel = options.find((o) => o.value === value)?.label;

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleSelect = (option: DropdownOption) => {
    if (option.disabled || option.submenu?.length) return;
    onChange?.(option.value);
    setIsOpen(false);
  };

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((v) => !v)}
        className={cn(
          sizeTrigger[size],
          'inline-flex items-center justify-between gap-2 w-full rounded transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus',
          variant === 'outline'
            ? cn('border border-stroke-default bg-surface-raised', disabled ? 'text-content-disabled cursor-not-allowed' : value ? 'text-content-primary hover:border-stroke-strong' : 'text-content-placeholder hover:border-stroke-strong')
            : cn('border border-stroke-default bg-surface-sunken', disabled ? 'text-content-disabled cursor-not-allowed' : value ? 'text-content-primary hover:bg-action-secondary' : 'text-content-placeholder hover:bg-action-secondary'),
        )}
      >
        <span className="truncate">{selectedLabel || placeholder}</span>
        <div className="flex items-center gap-1 shrink-0">
          {!disabled && value && variant === 'outline' && (
            <span role="button" tabIndex={0}
              onMouseDown={(e) => { e.stopPropagation(); onChange?.(''); }}
              onKeyDown={(e) => e.key === 'Enter' && onChange?.('')}
              className="hover:bg-action-secondary rounded-full p-0.5 transition-colors"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={cn('w-4 h-4 text-content-secondary transition-transform', isOpen && 'rotate-180')} />
        </div>
      </button>
      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-1 w-full bg-surface-overlay border border-stroke-default rounded shadow-lg max-h-60 overflow-y-auto">
          {options.map((option) => (
            <OptionItem key={option.value} option={option} selectedValue={value} showCheckmark={showCheckmark} itemPadding={sizeItem[size]} onSelect={handleSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

function OptionItem({ option, selectedValue, showCheckmark, itemPadding, onSelect }: { option: DropdownOption; selectedValue?: string; showCheckmark: boolean; itemPadding: string; onSelect: (o: DropdownOption) => void }) {
  const [subOpen, setSubOpen] = useState(false);
  if (option.submenu?.length) {
    return (
      <div className="relative" onMouseEnter={() => setSubOpen(true)} onMouseLeave={() => setSubOpen(false)}>
        <div className={cn(itemPadding, 'flex items-center justify-between cursor-pointer transition-colors', option.disabled ? 'text-content-disabled cursor-not-allowed' : 'text-content-primary hover:bg-action-primary hover:text-content-on-action')}>
          <span>{option.label}</span>
          <ChevronRight className="w-4 h-4" />
        </div>
        {subOpen && (
          <div className="absolute left-full top-0 bg-surface-overlay border border-stroke-default rounded shadow-lg min-w-[160px]">
            {option.submenu!.map((sub) => (
              <button key={sub.value} disabled={sub.disabled} onClick={() => onSelect(sub)} className={cn(itemPadding, 'flex items-center gap-2 w-full text-left transition-colors', sub.disabled ? 'text-content-disabled cursor-not-allowed' : 'text-content-primary hover:bg-action-primary hover:text-content-on-action')}>
                {sub.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
  return (
    <button type="button" disabled={option.disabled} onClick={() => onSelect(option)} className={cn(itemPadding, 'flex items-center gap-2 w-full text-left cursor-pointer transition-colors outline-none', option.disabled ? 'text-content-disabled cursor-not-allowed' : 'text-content-primary hover:bg-action-primary hover:text-content-on-action')}>
      {showCheckmark && <span className="w-4 h-4 flex items-center justify-center shrink-0">{selectedValue === option.value && <Check className="w-4 h-4" />}</span>}
      {option.label}
    </button>
  );
}

export function SimpleDropdown({ value, onChange, size = 'normal', variant = 'outline', disabled = false, className = '' }: { value: string; onChange: (v: string) => void; size?: DropdownSize; variant?: DropdownVariant; disabled?: boolean; className?: string }) {
  return <Dropdown options={[{value:'1',label:'Menu item 1'},{value:'2',label:'Menu item 2'},{value:'3',label:'Menu item 3'},{value:'4',label:'Menu item 4'},{value:'5',label:'Menu item 5'}]} value={value} onChange={onChange} size={size} variant={variant} disabled={disabled} className={className} />;
}

export function DropdownWithSubmenu({ value, onChange, size = 'normal', showCheckmark = false, className = '' }: { value: string; onChange: (v: string) => void; size?: DropdownSize; showCheckmark?: boolean; className?: string }) {
  return <Dropdown options={[{value:'1',label:'Menu item 1'},{value:'2',label:'Menu item 2'},{value:'3',label:'Menu item 3'},{value:'4',label:'Menu item 4'},{value:'submenu',label:'Submenu',submenu:[{value:'sub1',label:'Submenu item 1'},{value:'sub2',label:'Submenu item 2'},{value:'sub3',label:'Submenu item 3'}]},{value:'5',label:'Menu item 5'}]} value={value} onChange={onChange} size={size} showCheckmark={showCheckmark} className={className} />;
}
