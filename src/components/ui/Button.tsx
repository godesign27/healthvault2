import { ReactNode, ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus focus-visible:ring-offset-2 disabled:pointer-events-none select-none',
  {
    variants: {
      variant: {
        solid:
          'bg-action-primary text-content-on-action hover:bg-action-primary-hover active:bg-action-primary-active disabled:bg-action-primary-disabled',
        outline:
          'border border-stroke-default bg-transparent text-content-primary hover:bg-action-secondary active:bg-action-secondary-hover disabled:border-stroke-subtle disabled:text-content-disabled',
        ghost:
          'bg-transparent text-content-primary hover:bg-action-ghost-hover active:bg-action-ghost-active disabled:text-content-disabled',
        link:
          'bg-transparent text-content-link underline-offset-4 hover:underline hover:text-content-link-hover disabled:text-content-disabled',
        destructive:
          'bg-action-destructive text-content-on-action hover:bg-action-destructive-hover disabled:bg-action-primary-disabled',
      },
      size: {
        'x-small': 'text-[10px] gap-1',
        small:     'text-xs gap-1.5',
        normal:    'text-sm gap-2',
      },
      shape: {
        rectangle: 'rounded-lg',
        circle:    'rounded-full',
        square:    'rounded-none',
      },
    },
    compoundVariants: [
      { size: 'x-small', shape: 'rectangle', class: 'px-2 py-1' },
      { size: 'x-small', shape: 'circle',    class: 'p-1.5' },
      { size: 'x-small', shape: 'square',    class: 'p-1.5' },
      { size: 'small',   shape: 'rectangle', class: 'px-3 py-1.5' },
      { size: 'small',   shape: 'circle',    class: 'p-2' },
      { size: 'small',   shape: 'square',    class: 'p-2' },
      { size: 'normal',  shape: 'rectangle', class: 'px-4 py-2' },
      { size: 'normal',  shape: 'circle',    class: 'p-2.5' },
      { size: 'normal',  shape: 'square',    class: 'p-2.5' },
    ],
    defaultVariants: {
      variant: 'solid',
      size:    'normal',
      shape:   'rectangle',
    },
  }
);

const iconSizeMap = {
  'x-small': 'w-3 h-3',
  small:     'w-3.5 h-3.5',
  normal:    'w-4 h-4',
} as const;

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
    VariantProps<typeof buttonVariants> {
  children?: ReactNode;
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
  const iconSize = iconSizeMap[size ?? 'normal'];

  return (
    <button
      disabled={disabled}
      className={cn(buttonVariants({ variant, size, shape }), className)}
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
