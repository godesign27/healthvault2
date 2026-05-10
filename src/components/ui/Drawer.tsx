import * as RadixDialog from '@radix-ui/react-dialog';
import { X, Menu } from 'lucide-react';
import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  position?: 'left' | 'right' | 'top' | 'bottom';
  title?: string;
  children?: ReactNode;
  footer?: ReactNode;
  showFooter?: boolean;
  size?: 'default' | 'large';
  className?: string;
}

const positionClasses = {
  left:   'left-0 top-0 h-full data-[state=open]:animate-slide-in-left data-[state=closed]:animate-slide-out-left',
  right:  'right-0 top-0 h-full data-[state=open]:animate-slide-in-right data-[state=closed]:animate-slide-out-right',
  top:    'top-0 left-0 w-full data-[state=open]:animate-slide-in-top data-[state=closed]:animate-slide-out-top',
  bottom: 'bottom-0 left-0 w-full data-[state=open]:animate-slide-in-bottom data-[state=closed]:animate-slide-out-bottom',
} as const;

export function Drawer({
  isOpen,
  onClose,
  position = 'left',
  title = 'Drawer Title',
  children,
  footer,
  showFooter = false,
  size = 'default',
  className = '',
}: DrawerProps) {
  const isVertical = position === 'left' || position === 'right';
  const sizeClass = isVertical
    ? (size === 'large' ? 'w-full md:w-96' : 'w-full md:w-80')
    : 'h-80 md:h-96';

  return (
    <RadixDialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in" />
        <RadixDialog.Content
          className={cn(
            'fixed z-50 bg-surface-overlay shadow-2xl flex flex-col',
            'focus-visible:outline-none',
            sizeClass,
            positionClasses[position],
            className,
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-stroke-subtle shrink-0">
            <RadixDialog.Title className="text-lg font-semibold text-content-primary">
              {title}
            </RadixDialog.Title>
            <RadixDialog.Close asChild>
              <button className="p-1 text-content-secondary hover:text-content-primary hover:bg-action-secondary rounded transition-colors">
                <X className="w-5 h-5" />
              </button>
            </RadixDialog.Close>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4">
            {children}
          </div>

          {/* Footer */}
          {showFooter && (
            <div className="px-4 py-4 border-t border-stroke-subtle shrink-0">
              {footer || (
                <div className="flex gap-2 justify-end">
                  <RadixDialog.Close asChild>
                    <button className="px-4 py-2 text-sm font-medium text-content-primary bg-surface-raised border border-stroke-default rounded hover:bg-action-secondary transition-colors">
                      Cancel
                    </button>
                  </RadixDialog.Close>
                  <button className="px-4 py-2 text-sm font-medium text-content-on-action bg-action-primary rounded hover:bg-action-primary-hover transition-colors">
                    Save
                  </button>
                </div>
              )}
            </div>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

interface DrawerTriggerProps {
  onClick: () => void;
  children?: ReactNode;
  className?: string;
}

export function DrawerTrigger({ onClick, children, className = '' }: DrawerTriggerProps) {
  return (
    <button
      onClick={onClick}
      className={cn('p-2 text-content-secondary hover:bg-action-secondary rounded transition-colors', className)}
    >
      {children || <Menu className="w-6 h-6" />}
    </button>
  );
}

interface DrawerHeaderProps {
  title: string;
  onClose: () => void;
  className?: string;
}

export function DrawerHeader({ title, onClose, className = '' }: DrawerHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between px-4 py-4 border-b border-stroke-subtle', className)}>
      <h2 className="text-lg font-semibold text-content-primary">{title}</h2>
      <button
        onClick={onClose}
        className="p-1 text-content-secondary hover:text-content-primary hover:bg-action-secondary rounded transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

interface DrawerContentProps {
  children: ReactNode;
  position?: 'left' | 'right' | 'top' | 'bottom';
  className?: string;
}

export function DrawerContent({ children, className = '' }: DrawerContentProps) {
  return (
    <div className={cn('flex-1 overflow-y-auto p-4', className)}>
      {children}
    </div>
  );
}

interface DrawerFooterProps {
  children?: ReactNode;
  onCancel?: () => void;
  onSave?: () => void;
  className?: string;
}

export function DrawerFooter({ children, onCancel, onSave, className = '' }: DrawerFooterProps) {
  return (
    <div className={cn('px-4 py-4 border-t border-stroke-subtle', className)}>
      {children || (
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-content-primary bg-surface-raised border border-stroke-default rounded hover:bg-action-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 text-sm font-medium text-content-on-action bg-action-primary rounded hover:bg-action-primary-hover transition-colors"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}
