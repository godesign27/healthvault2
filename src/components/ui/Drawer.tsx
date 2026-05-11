import { X, Menu } from 'lucide-react';
import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

const positionBase = {
  left:   'left-0 top-0 h-full',
  right:  'right-0 top-0 h-full',
  top:    'top-0 left-0 w-full',
  bottom: 'bottom-0 left-0 w-full',
} as const;

const translateClosed = {
  left:   '-translate-x-full',
  right:  'translate-x-full',
  top:    '-translate-y-full',
  bottom: 'translate-y-full',
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
  const sizeClass  = isVertical
    ? (size === 'large' ? 'w-full md:w-96' : 'w-full md:w-80')
    : 'h-80 md:h-96';

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return createPortal(
    <>
      <div
        aria-hidden="true"
        className={cn(
          'fixed inset-0 z-40 backdrop-blur-sm transition-opacity duration-300',
          '[background:var(--hv-component-drawer-overlay-background)]',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'fixed z-50 flex flex-col transition-transform duration-300 ease-in-out',
          '[background:var(--hv-component-drawer-background-default)] rounded-hv-drawer shadow-hv-drawer',
          sizeClass,
          positionBase[position],
          isOpen ? 'translate-x-0 translate-y-0' : translateClosed[position],
          className,
        )}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b [border-color:var(--hv-component-drawer-border-default)] shrink-0">
          <h2 className="text-lg font-semibold [color:var(--hv-component-drawer-text-title)]">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-content-secondary hover:text-content-primary hover:bg-action-secondary rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">{children}</div>

        {showFooter && (
          <div className="px-4 py-4 border-t [border-color:var(--hv-component-drawer-border-default)] shrink-0">
            {footer || (
              <div className="flex gap-2 justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-content-primary bg-surface-raised border border-stroke-default rounded-hv-button hover:bg-action-secondary transition-colors"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 text-sm font-medium text-content-on-action bg-action-primary rounded-hv-button hover:bg-action-primary-hover transition-colors">
                  Save
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>,
    document.body,
  );
}

export function DrawerTrigger({ onClick, children, className = '' }: { onClick: () => void; children?: ReactNode; className?: string }) {
  return (
    <button onClick={onClick} className={cn('p-2 text-content-secondary hover:bg-action-secondary rounded transition-colors', className)}>
      {children || <Menu className="w-6 h-6" />}
    </button>
  );
}

export function DrawerHeader({ title, onClose, className = '' }: { title: string; onClose: () => void; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between px-4 py-4 border-b border-stroke-subtle', className)}>
      <h2 className="text-lg font-semibold text-content-primary">{title}</h2>
      <button onClick={onClose} className="p-1 text-content-secondary hover:text-content-primary hover:bg-action-secondary rounded transition-colors">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

export function DrawerContent({ children, className = '' }: { children: ReactNode; position?: string; className?: string }) {
  return <div className={cn('flex-1 overflow-y-auto p-4', className)}>{children}</div>;
}

export function DrawerFooter({ children, onCancel, onSave, className = '' }: { children?: ReactNode; onCancel?: () => void; onSave?: () => void; className?: string }) {
  return (
    <div className={cn('px-4 py-4 border-t border-stroke-subtle', className)}>
      {children || (
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-content-primary bg-surface-raised border border-stroke-default rounded hover:bg-action-secondary transition-colors">Cancel</button>
          <button onClick={onSave} className="px-4 py-2 text-sm font-medium text-content-on-action bg-action-primary rounded hover:bg-action-primary-hover transition-colors">Save</button>
        </div>
      )}
    </div>
  );
}
