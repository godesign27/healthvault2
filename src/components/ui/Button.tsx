import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'solid' | 'outline' | 'link';
  size?: 'normal' | 'small' | 'x-small';
  shape?: 'rectangle' | 'circle' | 'square';
  disabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function Button({
  children,
  variant = 'solid',
  size = 'normal',
  shape = 'rectangle',
  disabled = false,
  leftIcon,
  rightIcon,
  onClick,
  className = ''
}: ButtonProps) {
  const sizeClasses = {
    'x-small': {
      text: 'text-[10px]',
      padding: shape === 'rectangle' ? 'px-2 py-1' : 'p-1.5',
      icon: 'w-3 h-3',
      gap: 'gap-1'
    },
    'small': {
      text: 'text-xs',
      padding: shape === 'rectangle' ? 'px-3 py-1.5' : 'p-2',
      icon: 'w-3.5 h-3.5',
      gap: 'gap-1.5'
    },
    'normal': {
      text: 'text-sm',
      padding: shape === 'rectangle' ? 'px-4 py-2' : 'p-2.5',
      icon: 'w-4 h-4',
      gap: 'gap-2'
    }
  };

  const getVariantClasses = () => {
    if (disabled) {
      if (variant === 'outline') {
        return 'border border-gray-300 bg-white text-gray-400 cursor-not-allowed';
      } else if (variant === 'link') {
        return 'text-gray-400 cursor-not-allowed underline';
      }
      return 'bg-gray-400 text-white cursor-not-allowed';
    }

    switch (variant) {
      case 'solid':
        return 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800';
      case 'outline':
        return 'border border-indigo-600 bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white active:bg-indigo-700';
      case 'link':
        return 'text-indigo-600 hover:text-indigo-700 active:text-indigo-800 underline';
      default:
        return '';
    }
  };

  const getShapeClasses = () => {
    switch (shape) {
      case 'circle':
        return 'rounded-full';
      case 'square':
        return 'rounded-none';
      default:
        return 'rounded-lg';
    }
  };

  const baseClasses = `
    inline-flex items-center justify-center font-medium transition-colors
    ${sizeClasses[size].text}
    ${sizeClasses[size].padding}
    ${sizeClasses[size].gap}
    ${getVariantClasses()}
    ${getShapeClasses()}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={baseClasses}
    >
      {leftIcon && <span className={`inline-flex items-center justify-center ${sizeClasses[size].icon}`}>{leftIcon}</span>}
      {shape === 'rectangle' && children}
      {rightIcon && <span className={`inline-flex items-center justify-center ${sizeClasses[size].icon}`}>{rightIcon}</span>}
    </button>
  );
}
