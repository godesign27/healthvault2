import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronRight } from 'lucide-react';
import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface MenuItem {
  label: string;
  onClick?: () => void;
  submenu?: MenuItem[];
  disabled?: boolean;
  icon?: ReactNode;
  separator?: boolean;
}

interface PopupMenuProps {
  items: MenuItem[];
  size?: 'normal' | 'small' | 'xsmall';
  showScrollbar?: boolean;
  maxHeight?: string;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const sizeClasses = {
  normal: 'text-sm py-2 px-3',
  small:  'text-xs py-1.5 px-2.5',
  xsmall: 'text-xs py-1 px-2',
} as const;

const widthClasses = {
  normal: 'min-w-[200px]',
  small:  'min-w-[160px]',
  xsmall: 'min-w-[140px]',
} as const;

export function PopupMenu({
  items,
  size = 'normal',
  showScrollbar = false,
  maxHeight = '300px',
  trigger,
  open,
  onOpenChange,
}: PopupMenuProps) {
  const itemClass = sizeClasses[size];

  const renderItem = (item: MenuItem, index: number) => {
    if (item.separator) {
      return <DropdownMenu.Separator key={index} className="my-1 border-t border-stroke-subtle" />;
    }

    if (item.submenu?.length) {
      return (
        <DropdownMenu.Sub key={index}>
          <DropdownMenu.SubTrigger
            disabled={item.disabled}
            className={cn(
              itemClass,
              'flex items-center justify-between w-full cursor-pointer outline-none transition-colors rounded-sm',
              item.disabled
                ? 'text-content-disabled cursor-not-allowed'
                : 'text-content-primary hover:bg-action-primary hover:text-content-on-action data-[highlighted]:bg-action-primary data-[highlighted]:text-content-on-action data-[state=open]:bg-action-secondary',
            )}
          >
            <span className="flex items-center gap-2">
              {item.icon}
              {item.label}
            </span>
            <ChevronRight className="w-4 h-4" />
          </DropdownMenu.SubTrigger>
          <DropdownMenu.Portal>
            <DropdownMenu.SubContent
              sideOffset={4}
              className={cn(
                'z-50 bg-surface-overlay border border-stroke-default rounded shadow-lg py-1',
                widthClasses[size],
                'data-[state=open]:animate-fade-in',
              )}
            >
              {item.submenu.map((sub, si) => (
                <DropdownMenu.Item
                  key={si}
                  disabled={sub.disabled}
                  onSelect={sub.onClick}
                  className={cn(
                    itemClass,
                    'flex items-center gap-2 cursor-pointer outline-none transition-colors rounded-sm',
                    sub.disabled
                      ? 'text-content-disabled cursor-not-allowed'
                      : 'text-content-primary hover:bg-action-primary hover:text-content-on-action data-[highlighted]:bg-action-primary data-[highlighted]:text-content-on-action',
                  )}
                >
                  {sub.icon}
                  {sub.label}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.SubContent>
          </DropdownMenu.Portal>
        </DropdownMenu.Sub>
      );
    }

    return (
      <DropdownMenu.Item
        key={index}
        disabled={item.disabled}
        onSelect={item.onClick}
        className={cn(
          itemClass,
          'flex items-center gap-2 cursor-pointer outline-none transition-colors rounded-sm',
          item.disabled
            ? 'text-content-disabled cursor-not-allowed'
            : 'text-content-primary hover:bg-action-primary hover:text-content-on-action data-[highlighted]:bg-action-primary data-[highlighted]:text-content-on-action',
        )}
      >
        {item.icon}
        {item.label}
      </DropdownMenu.Item>
    );
  };

  if (trigger) {
    return (
      <DropdownMenu.Root open={open} onOpenChange={onOpenChange}>
        <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            sideOffset={4}
            className={cn(
              'z-50 bg-surface-overlay border border-stroke-default rounded shadow-lg py-1',
              widthClasses[size],
              showScrollbar && 'overflow-y-auto',
              'data-[state=open]:animate-fade-in',
            )}
            style={{ maxHeight: showScrollbar ? maxHeight : undefined }}
          >
            {items.map(renderItem)}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    );
  }

  return (
    <div
      className={cn(
        'bg-surface-overlay border border-stroke-default rounded shadow-lg py-1',
        widthClasses[size],
        showScrollbar && 'overflow-y-auto',
      )}
      style={{ maxHeight: showScrollbar ? maxHeight : undefined }}
    >
      {items.map((item, index) => {
        if (item.separator) {
          return <div key={index} className="my-1 border-t border-stroke-subtle" />;
        }
        return (
          <button
            key={index}
            onClick={item.onClick}
            disabled={item.disabled}
            className={cn(
              itemClass,
              'flex items-center gap-2 w-full text-left transition-colors',
              item.disabled
                ? 'text-content-disabled cursor-not-allowed'
                : 'text-content-primary hover:bg-action-primary hover:text-content-on-action',
            )}
          >
            {item.icon}
            <span className="flex-1">{item.label}</span>
            {item.submenu && <ChevronRight className="w-4 h-4 text-content-secondary" />}
          </button>
        );
      })}
    </div>
  );
}
