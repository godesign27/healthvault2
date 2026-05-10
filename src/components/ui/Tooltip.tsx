import * as RadixTooltip from '@radix-ui/react-tooltip';
import { ReactNode, useState } from 'react';
import { cn } from '../../lib/utils';

export type TooltipPosition = 'top' | 'right' | 'bottom' | 'left';
export type TooltipVariant = 'default' | 'inverse';
export type TooltipSize = 'normal' | 'small';

interface TooltipProps {
  content: string;
  position?: TooltipPosition;
  variant?: TooltipVariant;
  size?: TooltipSize;
  children: ReactNode;
  className?: string;
}

export function Tooltip({
  content,
  position = 'top',
  variant = 'default',
  size = 'normal',
  children,
  className = '',
}: TooltipProps) {
  return (
    <RadixTooltip.Provider delayDuration={300}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>
          <span className={cn('inline-block', className)}>{children}</span>
        </RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={position}
            sideOffset={6}
            className={cn(
              'z-[9999] rounded shadow-lg whitespace-nowrap pointer-events-none',
              'data-[state=delayed-open]:animate-fade-in',
              size === 'small' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-2',
              variant === 'inverse'
                ? 'bg-surface-overlay text-content-primary border border-stroke-subtle'
                : 'bg-hv-neutral-900 text-hv-neutral-0',
            )}
          >
            {content}
            <RadixTooltip.Arrow
              className={cn(
                variant === 'inverse' ? 'fill-surface-overlay' : 'fill-hv-neutral-900'
              )}
            />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}

interface TooltipPopoverProps {
  title: string;
  description: string;
  position?: TooltipPosition;
  variant?: TooltipVariant;
  children: ReactNode;
  className?: string;
}

export function TooltipPopover({
  title,
  description,
  position = 'top',
  variant = 'default',
  children,
  className = '',
}: TooltipPopoverProps) {
  return (
    <RadixTooltip.Provider delayDuration={300}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>
          <span className={cn('inline-block', className)}>{children}</span>
        </RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={position}
            sideOffset={6}
            className={cn(
              'z-[9999] rounded shadow-lg pointer-events-none p-4 max-w-xs',
              'data-[state=delayed-open]:animate-fade-in',
              variant === 'inverse'
                ? 'bg-surface-overlay text-content-primary border border-stroke-subtle'
                : 'bg-hv-neutral-900 text-hv-neutral-0',
            )}
          >
            <h4 className="font-bold text-sm mb-1">{title}</h4>
            <p className="text-xs opacity-90">{description}</p>
            <RadixTooltip.Arrow
              className={cn(
                variant === 'inverse' ? 'fill-surface-overlay' : 'fill-hv-neutral-900'
              )}
            />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}

interface TooltipConfirmationProps {
  title: string;
  message: string;
  position?: TooltipPosition;
  variant?: TooltipVariant;
  onConfirm: () => void;
  onCancel: () => void;
  children: ReactNode;
  className?: string;
}

export function TooltipConfirmation({
  title,
  message,
  position = 'top',
  variant = 'default',
  onConfirm,
  onCancel,
  children,
  className = '',
}: TooltipConfirmationProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => { onConfirm(); setOpen(false); };
  const handleCancel  = () => { onCancel();  setOpen(false); };

  return (
    <RadixTooltip.Provider>
      <RadixTooltip.Root open={open} onOpenChange={setOpen}>
        <RadixTooltip.Trigger asChild>
          <span className={cn('inline-block', className)}>{children}</span>
        </RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={position}
            sideOffset={6}
            className={cn(
              'z-[9999] rounded shadow-lg p-4 max-w-xs',
              variant === 'inverse'
                ? 'bg-surface-overlay text-content-primary border border-stroke-subtle'
                : 'bg-hv-neutral-900 text-hv-neutral-0',
            )}
          >
            <div className="flex items-start gap-2 mb-3">
              <span className="text-content-feedback-warning mt-0.5">⚠</span>
              <div>
                <h4 className="font-bold text-sm mb-1">{title}</h4>
                <p className="text-xs opacity-90">{message}</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancel}
                className={cn(
                  'px-3 py-1.5 text-xs rounded transition-colors',
                  variant === 'inverse'
                    ? 'bg-surface-sunken hover:bg-action-secondary-hover text-content-primary'
                    : 'bg-hv-neutral-700 hover:bg-hv-neutral-600 text-white'
                )}
              >
                No
              </button>
              <button
                onClick={handleConfirm}
                className="px-3 py-1.5 text-xs rounded bg-action-primary hover:bg-action-primary-hover text-content-on-action transition-colors"
              >
                Yes
              </button>
            </div>
            <RadixTooltip.Arrow
              className={cn(
                variant === 'inverse' ? 'fill-surface-overlay' : 'fill-hv-neutral-900'
              )}
            />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
