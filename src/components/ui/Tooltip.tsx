import { ReactNode, useState, useRef } from 'react';
import { cn } from '../../lib/utils';

export type TooltipPosition = 'top' | 'right' | 'bottom' | 'left';
export type TooltipVariant  = 'default' | 'inverse';
export type TooltipSize     = 'normal' | 'small';

const positionClasses: Record<TooltipPosition, string> = {
  top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left:   'right-full top-1/2 -translate-y-1/2 mr-2',
  right:  'left-full top-1/2 -translate-y-1/2 ml-2',
};

interface TooltipProps {
  content: string;
  position?: TooltipPosition;
  variant?: TooltipVariant;
  size?: TooltipSize;
  children: ReactNode;
  className?: string;
}

export function Tooltip({ content, position = 'top', variant = 'default', size = 'normal', children, className = '' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const show = () => { timer.current = setTimeout(() => setVisible(true), 300); };
  const hide = () => { clearTimeout(timer.current); setVisible(false); };

  return (
    <span className={cn('inline-block relative', className)} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {children}
      {visible && (
        <span role="tooltip" className={cn(
          'absolute z-[9999] rounded shadow-lg whitespace-nowrap pointer-events-none',
          size === 'small' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-2',
          variant === 'inverse' ? 'bg-surface-overlay text-content-primary border border-stroke-subtle' : 'bg-hv-neutral-900 text-hv-neutral-0',
          positionClasses[position],
        )}>
          {content}
        </span>
      )}
    </span>
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

export function TooltipPopover({ title, description, position = 'top', variant = 'default', children, className = '' }: TooltipPopoverProps) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const show = () => { timer.current = setTimeout(() => setVisible(true), 300); };
  const hide = () => { clearTimeout(timer.current); setVisible(false); };

  return (
    <span className={cn('inline-block relative', className)} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {children}
      {visible && (
        <span role="tooltip" className={cn(
          'absolute z-[9999] rounded shadow-lg pointer-events-none p-4 max-w-xs',
          variant === 'inverse' ? 'bg-surface-overlay text-content-primary border border-stroke-subtle' : 'bg-hv-neutral-900 text-hv-neutral-0',
          positionClasses[position],
        )}>
          <h4 className="font-bold text-sm mb-1">{title}</h4>
          <p className="text-xs opacity-90">{description}</p>
        </span>
      )}
    </span>
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

export function TooltipConfirmation({ title, message, position = 'top', variant = 'default', onConfirm, onCancel, children, className = '' }: TooltipConfirmationProps) {
  const [open, setOpen] = useState(false);
  const handleConfirm = () => { onConfirm(); setOpen(false); };
  const handleCancel  = () => { onCancel();  setOpen(false); };

  return (
    <span className={cn('inline-block relative', className)}>
      <span onClick={() => setOpen((v) => !v)}>{children}</span>
      {open && (
        <span className={cn(
          'absolute z-[9999] rounded shadow-lg p-4 max-w-xs',
          variant === 'inverse' ? 'bg-surface-overlay text-content-primary border border-stroke-subtle' : 'bg-hv-neutral-900 text-hv-neutral-0',
          positionClasses[position],
        )}>
          <div className="flex items-start gap-2 mb-3">
            <span className="text-content-feedback-warning mt-0.5">⚠</span>
            <div>
              <h4 className="font-bold text-sm mb-1">{title}</h4>
              <p className="text-xs opacity-90">{message}</p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={handleCancel} className={cn('px-3 py-1.5 text-xs rounded transition-colors', variant === 'inverse' ? 'bg-surface-sunken text-content-primary' : 'bg-hv-neutral-700 hover:bg-hv-neutral-600 text-white')}>No</button>
            <button onClick={handleConfirm} className="px-3 py-1.5 text-xs rounded bg-action-primary hover:bg-action-primary-hover text-content-on-action transition-colors">Yes</button>
          </div>
        </span>
      )}
    </span>
  );
}
