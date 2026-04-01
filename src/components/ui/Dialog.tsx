import React from 'react';
import { X, ExternalLink, AlertTriangle, Info } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  variant?: 'light' | 'dark';
  size?: 'small' | 'medium' | 'large' | 'full';
  showIcon?: boolean;
  iconType?: 'warning' | 'info';
  footerContent?: React.ReactNode;
  headerAction?: React.ReactNode;
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
  headerAction
}: DialogProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-lg',
    large: 'max-w-2xl',
    full: 'max-w-5xl'
  };

  const isDark = variant === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className={`relative ${sizeClasses[size]} w-full bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'bg-slate-800 text-white border-slate-700' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            {showIcon && iconType === 'warning' && (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            )}
            {showIcon && iconType === 'info' && (
              <Info className="w-5 h-5 text-blue-500" />
            )}
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <div className="flex items-center gap-2">
            {headerAction}
            <button
              onClick={onClose}
              className={`p-1 rounded hover:bg-slate-100 ${isDark ? 'hover:bg-slate-700' : ''}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>

        {footerContent && (
          <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
            {footerContent}
          </div>
        )}
      </div>
    </div>
  );
}

interface DialogIconButtonProps {
  icon: 'external' | 'close' | 'warning' | 'info';
  onClick?: () => void;
  variant?: 'primary' | 'danger' | 'warning';
}

export function DialogIconButton({ icon, onClick, variant = 'primary' }: DialogIconButtonProps) {
  const Icon = icon === 'external' ? ExternalLink : icon === 'close' ? X : icon === 'warning' ? AlertTriangle : Info;

  const colorClasses = {
    primary: 'text-blue-600 hover:bg-blue-50',
    danger: 'text-red-600 hover:bg-red-50',
    warning: 'text-amber-600 hover:bg-amber-50'
  };

  return (
    <button
      onClick={onClick}
      className={`p-2 rounded transition-colors ${colorClasses[variant]}`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}
