import { ReactNode } from 'react';

type ShadowType = 'none' | 'flat-right' | 'flat-angle-right' | 'blur';

interface CardProps {
  children?: ReactNode;
  shadow?: ShadowType;
  state?: 'default' | 'hover' | 'selected' | 'hover-selected' | 'disabled';
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
  focusRing = false
}: CardProps) {
  const shadowStyles = {
    'none': '',
    'flat-right': 'shadow-[4px_4px_0_0_rgba(0,0,0,0.1)]',
    'flat-angle-right': 'shadow-[6px_6px_0_0_rgba(0,0,0,0.08)]',
    'blur': 'shadow-[0_4px_12px_0_rgba(0,0,0,0.1)]'
  };

  const stateStyles = {
    'default': 'bg-white border-neutral-30',
    'hover': 'bg-neutral-00 border-neutral-80',
    'selected': 'bg-action-10 border-action-90',
    'hover-selected': 'bg-action-10 border-action-90',
    'disabled': 'bg-neutral-10 border-neutral-30'
  };

  const baseStyles = 'border transition-all';
  const shadowClass = shadowStyles[shadow];
  const stateClass = stateStyles[state];
  const cursorClass = state === 'disabled' ? 'cursor-not-allowed' : onClick ? 'cursor-pointer' : '';
  const focusClass = focusRing ? 'focus:outline-none focus:ring-2 focus:ring-[indigo-600] focus:ring-offset-2' : '';

  return (
    <div
      className={`${baseStyles} ${shadowClass} ${stateClass} ${cursorClass} ${focusClass} ${className}`}
      onClick={state !== 'disabled' ? onClick : undefined}
      tabIndex={focusRing ? 0 : undefined}
    >
      {children}
    </div>
  );
}

interface SkeletonCardProps {
  shadow?: ShadowType;
  className?: string;
}

export function SkeletonCard({ shadow = 'flat-right', className = '' }: SkeletonCardProps) {
  return (
    <Card shadow={shadow} className={className}>
      <div className="p-6 space-y-4">
        <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        </div>
      </div>
    </Card>
  );
}

interface ContentCardProps {
  shadow?: ShadowType;
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
  onClick
}: ContentCardProps) {
  return (
    <Card shadow={shadow} state={state} className={className} onClick={onClick}>
      <div className="p-6 space-y-4">
        {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
        {description && <p className="text-sm text-gray-600">{description}</p>}
        {footer && <div className="pt-2 border-t border-gray-200">{footer}</div>}
      </div>
    </Card>
  );
}
