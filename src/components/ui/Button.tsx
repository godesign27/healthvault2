import { ReactNode, ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'link' | 'destructive';
export type ButtonSize    = 'x-small' | 'small' | 'normal';
export type ButtonShape   = 'rectangle' | 'circle' | 'square';

const variantClasses: Record<ButtonVariant, string> = {
  solid:       '[background:var(--hv-component-button-background-primary-default)] [color:var(--hv-component-button-text-primary-default)] hover:[background:var(--hv-component-button-background-primary-hover)] active:[background:var(--hv-component-button-background-primary-active)] disabled:[background:var(--hv-component-button-background-primary-disabled)]',
  outline:     'border [border-color:var(--hv-component-button-border-secondary-default)] bg-transparent [color:var(--hv-component-button-text-secondary-default)] hover:[background:var(--hv-component-button-background-secondary-hover)] active:[background:var(--hv-component-button-background-secondary-active)] disabled:[border-color:var(--hv-color-border-subtle)] disabled:[color:var(--hv-component-button-text-secondary-disabled)]',
  ghost:       'bg-transparent [color:var(--hv-component-button-text-ghost-default)] hover:[background:var(--hv-component-button-background-ghost-hover)] active:[background:var(--hv-component-button-background-ghost-active)] disabled:[color:var(--hv-color-text-disabled)]',
  link:        'bg-transparent text-content-link underline-offset-4 hover:underline hover:text-content-link-hover disabled:text-content-disabled',
  destructive: '[background:var(--hv-component-button-background-destructive-default)] [color:var(--hv-component-button-text-destructive-default)] hover:[background:var(--hv-component-button-background-destructive-hover)] disabled:[background:var(--hv-component-button-background-destructive-disabled)]',
};

const sizeClasses: Record<ButtonSize, string> = {
  'x-small': 'text-[10px] gap-1',
  small:     'text-xs gap-1.5',
  normal:    'text-sm gap-2',
};

const shapeClasses: Record<ButtonShape, string> = {
  rectangle: 'rounded-hv-button',
  circle:    'rounded-hv-button-pill',
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
        'focus-visible:[--tw-ring-color:var(--hv-component-button-focus-ring-default)] focus-visible:[--tw-ring-offset-color:var(--hv-component-button-focus-ring-offset)]',
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
