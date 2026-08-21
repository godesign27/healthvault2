import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type CardState  = 'default' | 'hover' | 'selected' | 'hover-selected' | 'disabled';
export type CardShadow = 'none' | 'flat-right' | 'flat-angle-right' | 'blur';

const stateClasses: Record<CardState, string> = {
  default:          '',
  hover:            '[border-color:var(--hv-component-card-border-hover)]',
  selected:         '[background:var(--hv-component-card-background-selected)] [border-color:var(--hv-component-card-border-selected)]',
  'hover-selected': '[background:var(--hv-component-card-background-selected)] [border-color:var(--hv-component-card-border-selected)]',
  disabled:         '[background:var(--hv-component-card-background-disabled)] [border-color:var(--hv-component-card-border-disabled)] opacity-60',
};

const shadowClasses: Record<CardShadow, string> = {
  none:               'hv-surface-card--flat',
  'flat-right':       'hv-surface-card--flat shadow-[4px_4px_0_0_rgba(0,0,0,0.08)]',
  'flat-angle-right': 'hv-surface-card--flat shadow-[6px_6px_0_0_rgba(0,0,0,0.06)]',
  blur:               '',
};

interface CardProps {
  children?: ReactNode;
  state?: CardState;
  shadow?: CardShadow;
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

  return (
    <div
      className={cn(
        'hv-surface-card transition-all',
        stateClasses[state],
        shadowClasses[shadow],
        isDisabled ? 'cursor-not-allowed' : onClick ? 'cursor-pointer' : '',
        focusRing ? 'focus:outline-none focus:ring-2 focus:ring-stroke-focus focus:ring-offset-2' : '',
        className,
      )}
      onClick={!isDisabled ? onClick : undefined}
      tabIndex={focusRing ? 0 : undefined}
    >
      {children}
    </div>
  );
}

interface SkeletonCardProps {
  shadow?: CardShadow;
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
  shadow?: CardShadow;
  state?: CardState;
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
