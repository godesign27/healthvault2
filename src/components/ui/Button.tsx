import { ReactNode, ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'link' | 'destructive';
export type ButtonSize    = 'x-small' | 'small' | 'normal';
export type ButtonShape   = 'rectangle' | 'circle' | 'square';

const variantClasses: Record<ButtonVariant, string> = {
  solid:       'bg-action-primary text-content-on-action hover:bg-action-primary-hover active:bg-action-primary-active disabled:bg-action-primary-disabled',
  outline:     'border border-stroke-default bg-transparent text-content-primary hover:bg-action-secondary active:bg-action-secondary-hover disabled:border-stroke-subtle disabled:text-content-disabled',
  ghost:       'bg-transparent text-content-primary hover:bg-action-ghost-hover active:bg-action-ghost-active disabled:text-content-disabled',
  link:        'bg-transparent text-content-link underline-offset-4 hover:underline hover:text-content-link-hover disabled:text-content-disabled',
  destructive: 'bg-action-destructive text-content-on-action hover:bg-action-destructive-hover disabled:bg-action-primary-disabled',
};

const sizeClasses: Record<ButtonSize, string> = {
  'x-small': 'text-[10px] gap-1',
  small:     'text-xs gap-1.5',
  normal:    'text-sm gap-2',
};

const shapeClasses: Record<ButtonShape, string> = {
  rectangle: 'rounded-lg',
  circle:    'rounded-full',
  square:    'rounded-none',
};

const paddingClasses: Record<ButtonSize, Record<ButtonShape, string>> = {
  'x-small': { rectangle: 'px-2 py-1',   circle: 'p-1.5', square: 'p-1.5' },
  small:     { rectangle: 'px-3 py-1.5', circle: 'p-2',   square: 'p-2' },
  normal:    { rectangle: 'px-4 py-2',   circle: 'p-2.5', square: 'p-2.5' },
};

const iconSizeMap: Record<ButtonSize, string> = {
  'x-small': 'w-3 h-3',
  small:     'w-3.5 h-3.5',
  normal:    'w-4 h-4',
};

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Button({
  children,
  variant = 'solid',
  size = 'normal',
  shape = 'rectangle',
  disabled = false,
  leftIcon,
  rightIcon,
  className,
  ...props
}: ButtonProps) {
  const iconSize = iconSizeMap[size];

  return (
    <button
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus focus-visible:ring-offset-2 disabled:pointer-events-none select-none',
        variantClasses[variant],
        sizeClasses[size],
        shapeClasses[shape],
        paddingClasses[size][shape],
        className,
      )}
      {...props}
    >
      {leftIcon && (
        <span className={cn('inline-flex items-center justify-center', iconSize)}>
          {leftIcon}
        </span>
      )}
      {shape === 'rectangle' && children}
      {shape !== 'rectangle' && !leftIcon && children}
      {rightIcon && (
        <span className={cn('inline-flex items-center justify-center', iconSize)}>
          {rightIcon}
        </span>
      )}
    </button>
  );
}
