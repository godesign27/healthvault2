import { useState, useRef, useEffect } from 'react';

export type TooltipPosition = 'top' | 'right' | 'bottom' | 'left';
export type TooltipVariant = 'default' | 'inverse';
export type TooltipSize = 'normal' | 'small';

interface TooltipProps {
  content: string;
  position?: TooltipPosition;
  variant?: TooltipVariant;
  size?: TooltipSize;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({
  content,
  position = 'top',
  variant = 'default',
  size = 'normal',
  children,
  className = ''
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = triggerRect.top - tooltipRect.height - 8;
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'bottom':
          top = triggerRect.bottom + 8;
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'left':
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.left - tooltipRect.width - 8;
          break;
        case 'right':
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.right + 8;
          break;
      }

      setTooltipStyle({ top: `${top}px`, left: `${left}px` });
    }
  }, [isVisible, position]);

  const getVariantClasses = () => {
    if (variant === 'inverse') {
      return 'bg-white text-gray-900 border border-gray-300';
    }
    return 'bg-gray-900 text-white';
  };

  const getSizeClasses = () => {
    if (size === 'small') {
      return 'text-xs px-2 py-1';
    }
    return 'text-sm px-3 py-2';
  };

  const getArrowClasses = () => {
    const baseArrow = 'absolute w-2 h-2 rotate-45';
    const variantColor = variant === 'inverse'
      ? 'bg-white border-gray-300'
      : 'bg-gray-900';

    switch (position) {
      case 'top':
        return `${baseArrow} ${variantColor} ${variant === 'inverse' ? 'border-r border-b' : ''} bottom-[-4px] left-1/2 -translate-x-1/2`;
      case 'bottom':
        return `${baseArrow} ${variantColor} ${variant === 'inverse' ? 'border-l border-t' : ''} top-[-4px] left-1/2 -translate-x-1/2`;
      case 'left':
        return `${baseArrow} ${variantColor} ${variant === 'inverse' ? 'border-r border-t' : ''} right-[-4px] top-1/2 -translate-y-1/2`;
      case 'right':
        return `${baseArrow} ${variantColor} ${variant === 'inverse' ? 'border-l border-b' : ''} left-[-4px] top-1/2 -translate-y-1/2`;
      default:
        return '';
    }
  };

  return (
    <div
      ref={triggerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          style={tooltipStyle}
          className={`fixed z-[9999] rounded shadow-lg whitespace-nowrap pointer-events-none ${getVariantClasses()} ${getSizeClasses()}`}
        >
          {content}
          <div className={getArrowClasses()} />
        </div>
      )}
    </div>
  );
}

interface TooltipPopoverProps {
  title: string;
  description: string;
  position?: TooltipPosition;
  variant?: TooltipVariant;
  children: React.ReactNode;
  className?: string;
}

export function TooltipPopover({
  title,
  description,
  position = 'top',
  variant = 'default',
  children,
  className = ''
}: TooltipPopoverProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = triggerRect.top - tooltipRect.height - 8;
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'bottom':
          top = triggerRect.bottom + 8;
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'left':
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.left - tooltipRect.width - 8;
          break;
        case 'right':
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.right + 8;
          break;
      }

      setTooltipStyle({ top: `${top}px`, left: `${left}px` });
    }
  }, [isVisible, position]);

  const getVariantClasses = () => {
    if (variant === 'inverse') {
      return 'bg-white text-gray-900 border border-gray-300';
    }
    return 'bg-gray-900 text-white';
  };

  const getArrowClasses = () => {
    const baseArrow = 'absolute w-2 h-2 rotate-45';
    const variantColor = variant === 'inverse'
      ? 'bg-white border-gray-300'
      : 'bg-gray-900';

    switch (position) {
      case 'top':
        return `${baseArrow} ${variantColor} ${variant === 'inverse' ? 'border-r border-b' : ''} bottom-[-4px] left-1/2 -translate-x-1/2`;
      case 'bottom':
        return `${baseArrow} ${variantColor} ${variant === 'inverse' ? 'border-l border-t' : ''} top-[-4px] left-1/2 -translate-x-1/2`;
      case 'left':
        return `${baseArrow} ${variantColor} ${variant === 'inverse' ? 'border-r border-t' : ''} right-[-4px] top-1/2 -translate-y-1/2`;
      case 'right':
        return `${baseArrow} ${variantColor} ${variant === 'inverse' ? 'border-l border-b' : ''} left-[-4px] top-1/2 -translate-y-1/2`;
      default:
        return '';
    }
  };

  return (
    <div
      ref={triggerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          style={tooltipStyle}
          className={`fixed z-[9999] rounded shadow-lg pointer-events-none p-4 max-w-xs ${getVariantClasses()}`}
        >
          <h4 className="font-bold text-sm mb-1">{title}</h4>
          <p className="text-xs opacity-90">{description}</p>
          <div className={getArrowClasses()} />
        </div>
      )}
    </div>
  );
}

interface TooltipConfirmationProps {
  title: string;
  message: string;
  position?: TooltipPosition;
  variant?: TooltipVariant;
  onConfirm: () => void;
  onCancel: () => void;
  children: React.ReactNode;
  className?: string;
}

export function TooltipConfirmation({
  title,
  message,
  position = 'top',
  variant = 'default',
  onConfirm,
  onCancel,
  children,
  className = ''
}: TooltipConfirmationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = triggerRect.top - tooltipRect.height - 8;
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'bottom':
          top = triggerRect.bottom + 8;
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'left':
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.left - tooltipRect.width - 8;
          break;
        case 'right':
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.right + 8;
          break;
      }

      setTooltipStyle({ top: `${top}px`, left: `${left}px` });
    }
  }, [isVisible, position]);

  const getVariantClasses = () => {
    if (variant === 'inverse') {
      return 'bg-white text-gray-900 border border-gray-300';
    }
    return 'bg-gray-900 text-white';
  };

  const getArrowClasses = () => {
    const baseArrow = 'absolute w-2 h-2 rotate-45';
    const variantColor = variant === 'inverse'
      ? 'bg-white border-gray-300'
      : 'bg-gray-900';

    switch (position) {
      case 'top':
        return `${baseArrow} ${variantColor} ${variant === 'inverse' ? 'border-r border-b' : ''} bottom-[-4px] left-1/2 -translate-x-1/2`;
      case 'bottom':
        return `${baseArrow} ${variantColor} ${variant === 'inverse' ? 'border-l border-t' : ''} top-[-4px] left-1/2 -translate-x-1/2`;
      case 'left':
        return `${baseArrow} ${variantColor} ${variant === 'inverse' ? 'border-r border-t' : ''} right-[-4px] top-1/2 -translate-y-1/2`;
      case 'right':
        return `${baseArrow} ${variantColor} ${variant === 'inverse' ? 'border-l border-b' : ''} left-[-4px] top-1/2 -translate-y-1/2`;
      default:
        return '';
    }
  };

  const handleConfirm = () => {
    onConfirm();
    setIsVisible(false);
  };

  const handleCancel = () => {
    onCancel();
    setIsVisible(false);
  };

  return (
    <div
      ref={triggerRef}
      className={`relative inline-block ${className}`}
    >
      <div onClick={() => setIsVisible(!isVisible)}>
        {children}
      </div>
      {isVisible && (
        <div
          ref={tooltipRef}
          role="dialog"
          style={tooltipStyle}
          className={`fixed z-[9999] rounded shadow-lg p-4 max-w-xs ${getVariantClasses()}`}
        >
          <div className="flex items-start gap-2 mb-3">
            <span className="text-yellow-400 mt-0.5">⚠</span>
            <div>
              <h4 className="font-bold text-sm mb-1">{title}</h4>
              <p className="text-xs opacity-90">{message}</p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancel}
              className={`px-3 py-1.5 text-xs rounded ${
                variant === 'inverse'
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              No
            </button>
            <button
              onClick={handleConfirm}
              className="px-3 py-1.5 text-xs rounded bg-[indigo-600] hover:bg-[indigo-700] text-white"
            >
              Yes
            </button>
          </div>
          <div className={getArrowClasses()} />
        </div>
      )}
    </div>
  );
}
