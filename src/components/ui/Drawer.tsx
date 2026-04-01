import { X, Menu, Image } from 'lucide-react';
import { ReactNode, useEffect } from 'react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  position?: 'left' | 'right' | 'top' | 'bottom';
  title?: string;
  children?: ReactNode;
  footer?: ReactNode;
  showFooter?: boolean;
  size?: 'default' | 'large';
  className?: string;
}

export function Drawer({
  isOpen,
  onClose,
  position = 'left',
  title = 'Drawer Title',
  children,
  footer,
  showFooter = false,
  size = 'default',
  className = ''
}: DrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const getDrawerClasses = () => {
    const baseClasses = 'fixed bg-white shadow-2xl transition-transform duration-300 ease-in-out z-50';
    const desktopSizeClasses = size === 'large' ? 'md:w-96' : 'md:w-80';

    switch (position) {
      case 'left':
        return `${baseClasses} w-full ${desktopSizeClasses} top-0 left-0 h-full ${isOpen ? 'translate-x-0' : '-translate-x-full'}`;
      case 'right':
        return `${baseClasses} w-full ${desktopSizeClasses} top-0 right-0 h-full ${isOpen ? 'translate-x-0' : 'translate-x-full'}`;
      case 'top':
        return `${baseClasses} w-full h-80 md:h-96 top-0 left-0 ${isOpen ? 'translate-y-0' : '-translate-y-full'}`;
      case 'bottom':
        return `${baseClasses} w-full h-80 md:h-96 bottom-0 left-0 ${isOpen ? 'translate-y-0' : 'translate-y-full'}`;
      default:
        return baseClasses;
    }
  };

  const getScrollbarClasses = () => {
    if (position === 'left') {
      return 'border-r-4 border-gray-300';
    }
    if (position === 'right') {
      return 'border-l-4 border-gray-300';
    }
    if (position === 'top') {
      return 'border-b-4 border-gray-300';
    }
    if (position === 'bottom') {
      return 'border-t-4 border-gray-300';
    }
    return '';
  };

  const defaultContent = (
    <div className="flex items-center justify-center py-12 text-gray-400">
      <div className="text-center">
        <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Replace Me</p>
      </div>
    </div>
  );

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div className={`${getDrawerClasses()} ${className}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b-2 border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className={`flex-1 overflow-y-auto p-4 ${getScrollbarClasses()}`}>
            {children || defaultContent}
          </div>

          {showFooter && (
            <div className="p-4 border-t-2 border-gray-200">
              {footer || (
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-white bg-[indigo-600] rounded hover:bg-[indigo-700] transition-colors"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

interface DrawerTriggerProps {
  onClick: () => void;
  children?: ReactNode;
  className?: string;
}

export function DrawerTrigger({ onClick, children, className = '' }: DrawerTriggerProps) {
  return (
    <button
      onClick={onClick}
      className={`p-2 text-gray-700 hover:bg-gray-100 rounded transition-colors ${className}`}
    >
      {children || <Menu className="w-6 h-6" />}
    </button>
  );
}

interface DrawerHeaderProps {
  title: string;
  onClose: () => void;
  className?: string;
}

export function DrawerHeader({ title, onClose, className = '' }: DrawerHeaderProps) {
  return (
    <div className={`flex items-center justify-between p-4 border-b-2 border-gray-200 ${className}`}>
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <button
        onClick={onClose}
        className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

interface DrawerContentProps {
  children: ReactNode;
  position?: 'left' | 'right' | 'top' | 'bottom';
  className?: string;
}

export function DrawerContent({ children, position = 'left', className = '' }: DrawerContentProps) {
  const getScrollbarClasses = () => {
    if (position === 'left') {
      return 'border-r-4 border-gray-300';
    }
    if (position === 'right') {
      return 'border-l-4 border-gray-300';
    }
    if (position === 'top') {
      return 'border-b-4 border-gray-300';
    }
    if (position === 'bottom') {
      return 'border-t-4 border-gray-300';
    }
    return '';
  };

  return (
    <div className={`flex-1 overflow-y-auto p-4 ${getScrollbarClasses()} ${className}`}>
      {children}
    </div>
  );
}

interface DrawerFooterProps {
  children?: ReactNode;
  onCancel?: () => void;
  onSave?: () => void;
  className?: string;
}

export function DrawerFooter({ children, onCancel, onSave, className = '' }: DrawerFooterProps) {
  return (
    <div className={`p-4 border-t-2 border-gray-200 ${className}`}>
      {children || (
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 text-sm font-medium text-white bg-[indigo-600] rounded hover:bg-[indigo-700] transition-colors"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}
