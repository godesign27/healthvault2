import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X, ExternalLink, AlertTriangle, Info } from 'lucide-react';
import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

const sizeMap = {
  small:  'max-w-md',
  medium: 'max-w-lg',
  large:  'max-w-2xl',
  full:   'max-w-5xl',
} as const;

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  variant?: 'light' | 'dark';
  size?: keyof typeof sizeMap;
  showIcon?: boolean;
  iconType?: 'warning' | 'info';
  footerContent?: ReactNode;
  headerAction?: ReactNode;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  children,
  variant = 'light',
  size = 'medium',
  showIcon = false,
  iconType = 'warning',
  footerContent,
  headerAction,
}: DialogProps) {
  const isDark = variant === 'dark';
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 [background:var(--hv-component-dialog-overlay-background)]"
        />
        <DialogPrimitive.Content
          className={cn(
            'fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            sizeMap[size],
            'w-[calc(100%-2rem)] max-h-[90vh] flex flex-col focus-visible:outline-none',
            'rounded-hv-dialog shadow-hv-dialog',
            '[background:var(--hv-component-dialog-background-default)]',
          )}
        >
          <div
            className={cn(
              'flex items-center justify-between px-6 py-4 border-b',
              isDark
                ? 'bg-hv-neutral-800 text-hv-neutral-0 border-hv-neutral-700'
                : '[border-color:var(--hv-component-dialog-border-default)]',
            )}
          >
            <div className="flex items-center gap-3">
              {showIcon && iconType === 'warning' && (
                <AlertTriangle className="w-5 h-5 text-content-feedback-error" />
              )}
              {showIcon && iconType === 'info' && (
                <Info className="w-5 h-5 text-content-feedback-info" />
              )}
              <DialogPrimitive.Title className="text-lg font-semibold [color:var(--hv-component-dialog-text-title)]">
                {title}
              </DialogPrimitive.Title>
            </div>
            <div className="flex items-center gap-2">
              {headerAction}
              <DialogPrimitive.Close
                className={cn(
                  'p-1 rounded transition-colors',
                  isDark
                    ? 'hover:bg-hv-neutral-700 text-hv-neutral-200'
                    : 'hover:bg-action-secondary text-content-secondary',
                )}
              >
                <X className="w-5 h-5" />
              </DialogPrimitive.Close>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>

          {footerContent && (
            <div className="px-6 py-4 border-t [border-color:var(--hv-component-dialog-footer-border)] flex justify-end gap-2">
              {footerContent}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

interface DialogIconButtonProps {
  icon: 'external' | 'close' | 'warning' | 'info';
  onClick?: () => void;
  variant?: 'primary' | 'danger' | 'warning';
}

export function DialogIconButton({ icon, onClick, variant = 'primary' }: DialogIconButtonProps) {
  const Icon = icon === 'external' ? ExternalLink : icon === 'close' ? X : icon === 'warning' ? AlertTriangle : Info;
  const colorMap = {
    primary: 'text-action-primary hover:bg-action-primary-subtle',
    danger:  'text-content-feedback-error hover:bg-surface-feedback-error',
    warning: 'text-content-feedback-warning hover:bg-surface-feedback-warning',
  };
  return (
    <button onClick={onClick} className={cn('p-2 rounded transition-colors', colorMap[variant])}>
      <Icon className="w-4 h-4" />
    </button>
  );
}
