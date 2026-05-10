import { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const cardVariants = cva(
  'border transition-all',
  {
    variants: {
      state: {
        default:        'bg-surface-raised border-stroke-subtle',
        hover:          'bg-surface-raised border-stroke-strong',
        selected:       'bg-action-primary-subtle border-action-primary',
        'hover-selected': 'bg-action-primary-subtle border-action-primary',
        disabled:       'bg-surface-sunken border-stroke-subtle opacity-60',
      },
      shadow: {
        none:               '',
        'flat-right':       'shadow-[4px_4px_0_0_rgba(0,0,0,0.08)]',
        'flat-angle-right': 'shadow-[6px_6px_0_0_rgba(0,0,0,0.06)]',
        blur:               'shadow-[0_4px_12px_0_rgba(0,0,0,0.08)]',
      },
    },
    defaultVariants: {
      state:  'default',
      shadow: 'flat-right',
    },
  }
);

interface CardProps extends VariantProps<typeof cardVariants> {
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
  focusRing?: boolean;
}

export function Card({
  children,
  shadow = 'flat-right',
  state = 'default',
  className = '',
  onClick,
  focusRing = false,
}: CardProps) {
  const isDisabled = state === 'disabled';
  const cursorClass = isDisabled ? 'cursor-not-allowed' : onClick ? 'cursor-pointer' : '';
  const focusClass = focusRing
    ? 'focus:outline-none focus:ring-2 focus:ring-stroke-focus focus:ring-offset-2'
    : '';

  return (
    <div
      className={cn(cardVariants({ state, shadow }), cursorClass, focusClass, className)}
      onClick={!isDisabled ? onClick : undefined}
      tabIndex={focusRing ? 0 : undefined}
    >
      {children}
    </div>
  );
}

interface SkeletonCardProps {
  shadow?: 'none' | 'flat-right' | 'flat-angle-right' | 'blur';
  className?: string;
}

export function SkeletonCard({ shadow = 'flat-right', className = '' }: SkeletonCardProps) {
  return (
    <Card shadow={shadow} className={className}>
      <div className="p-6 space-y-4">
        <div className="w-12 h-12 rounded-full bg-surface-sunken animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 bg-surface-sunken rounded animate-pulse" />
          <div className="h-4 bg-surface-sunken rounded w-3/4 animate-pulse" />
        </div>
      </div>
    </Card>
  );
}

interface ContentCardProps {
  shadow?: 'none' | 'flat-right' | 'flat-angle-right' | 'blur';
  state?: 'default' | 'hover' | 'selected' | 'hover-selected' | 'disabled';
  title?: string;
  description?: string;
  footer?: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function ContentCard({
  shadow = 'flat-right',
  state = 'default',
  title,
  description,
  footer,
  className = '',
  onClick,
}: ContentCardProps) {
  return (
    <Card shadow={shadow} state={state} className={className} onClick={onClick}>
      <div className="p-6 space-y-4">
        {title && <h3 className="text-lg font-semibold text-content-primary">{title}</h3>}
        {description && <p className="text-sm text-content-secondary">{description}</p>}
        {footer && (
          <div className="pt-2 border-t border-stroke-subtle">
            {footer}
          </div>
        )}
      </div>
    </Card>
  );
}
