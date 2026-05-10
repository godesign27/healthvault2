import * as Select from '@radix-ui/react-select';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, ChevronRight, Check, X, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';

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

const sizeTrigger = {
  xsmall: 'px-2 py-1 text-xs',
  small:  'px-3 py-1.5 text-sm',
  normal: 'px-4 py-2 text-sm',
} as const;

const sizeItem = {
  xsmall: 'px-2 py-1 text-xs',
  small:  'px-3 py-1.5 text-sm',
  normal: 'px-4 py-2 text-sm',
} as const;

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select value',
  size = 'normal',
  variant = 'outline',
  disabled = false,
  showCheckmark = false,
  className = '',
}: DropdownProps) {
  const triggerPadding = sizeTrigger[size];

  return (
    <Select.Root value={value} onValueChange={onChange} disabled={disabled}>
      <Select.Trigger
        className={cn(
          triggerPadding,
          'inline-flex items-center justify-between gap-2 w-full rounded transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus',
          variant === 'outline'
            ? cn(
                'border border-stroke-default bg-surface-raised',
                disabled
                  ? 'text-content-disabled cursor-not-allowed'
                  : value
                    ? 'text-content-primary hover:border-stroke-strong'
                    : 'text-content-placeholder hover:border-stroke-strong',
              )
            : cn(
                'border border-stroke-default bg-surface-sunken',
                disabled
                  ? 'text-content-disabled cursor-not-allowed'
                  : value
                    ? 'text-content-primary hover:bg-action-secondary'
                    : 'text-content-placeholder hover:bg-action-secondary',
              ),
          className,
        )}
      >
        <Select.Value placeholder={placeholder} />
        <div className="flex items-center gap-1 shrink-0">
          {!disabled && value && variant === 'outline' && (
            <span
              role="button"
              tabIndex={0}
              onPointerDown={(e) => {
                e.stopPropagation();
                onChange?.('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && onChange?.('')}
              className="hover:bg-action-secondary rounded-full p-0.5 transition-colors"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <Select.Icon asChild>
            <ChevronDown className="w-4 h-4 text-content-secondary" />
          </Select.Icon>
        </div>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={4}
          className={cn(
            'z-50 w-[--radix-select-trigger-width] overflow-hidden',
            'bg-surface-overlay border border-stroke-default rounded shadow-lg',
            'data-[state=open]:animate-fade-in',
            'max-h-60 overflow-y-auto',
          )}
        >
          <Select.ScrollUpButton className="flex items-center justify-center py-1 text-content-secondary">
            <ChevronUp className="w-4 h-4" />
          </Select.ScrollUpButton>

          <Select.Viewport>
            {options.map((option) => (
              <SelectItem
                key={option.value}
                option={option}
                showCheckmark={showCheckmark}
                itemSize={size}
              />
            ))}
          </Select.Viewport>

          <Select.ScrollDownButton className="flex items-center justify-center py-1 text-content-secondary">
            <ChevronDown className="w-4 h-4" />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

function SelectItem({
  option,
  showCheckmark,
  itemSize,
}: {
  option: DropdownOption;
  showCheckmark: boolean;
  itemSize: DropdownSize;
}) {
  if (option.submenu?.length) {
    return (
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <div
            className={cn(
              sizeItem[itemSize],
              'flex items-center justify-between cursor-pointer transition-colors',
              option.disabled
                ? 'text-content-disabled bg-surface-sunken cursor-not-allowed'
                : 'text-content-primary hover:bg-action-primary hover:text-content-on-action',
            )}
          >
            <span>{option.label}</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </DropdownMenu.Trigger>
      </DropdownMenu.Root>
    );
  }

  return (
    <Select.Item
      value={option.value}
      disabled={option.disabled}
      className={cn(
        sizeItem[itemSize],
        'flex items-center gap-2 cursor-pointer transition-colors outline-none',
        option.disabled
          ? 'text-content-disabled bg-surface-sunken cursor-not-allowed'
          : 'text-content-primary hover:bg-action-primary hover:text-content-on-action data-[highlighted]:bg-action-primary data-[highlighted]:text-content-on-action',
      )}
    >
      {showCheckmark && (
        <Select.ItemIndicator>
          <Check className="w-4 h-4" />
        </Select.ItemIndicator>
      )}
      <Select.ItemText>{option.label}</Select.ItemText>
    </Select.Item>
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
  className = '',
}: SimpleDropdownProps) {
  const options: DropdownOption[] = [
    { value: '1', label: 'Menu item 1' },
    { value: '2', label: 'Menu item 2' },
    { value: '3', label: 'Menu item 3' },
    { value: '4', label: 'Menu item 4' },
    { value: '5', label: 'Menu item 5' },
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
  className = '',
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
        { value: 'sub3', label: 'Submenu item 3' },
      ],
    },
    { value: '5', label: 'Menu item 5' },
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
