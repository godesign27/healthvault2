import { ChevronRight } from 'lucide-react';
import { type ReactNode, useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface MenuItem {
  label: string;
  onClick?: () => void;
  submenu?: MenuItem[];
  disabled?: boolean;
  icon?: ReactNode;
  separator?: boolean;
}

interface PopupMenuProps {
  items: MenuItem[];
  size?: 'normal' | 'small' | 'xsmall';
  showScrollbar?: boolean;
  maxHeight?: string;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const sizeClasses  = { normal: 'text-sm py-2 px-3', small: 'text-xs py-1.5 px-2.5', xsmall: 'text-xs py-1 px-2' } as const;
const widthClasses = { normal: 'min-w-[200px]', small: 'min-w-[160px]', xsmall: 'min-w-[140px]' } as const;

function SubMenuItem({ item, itemClass }: { item: MenuItem; itemClass: string }) {
  const [subOpen, setSubOpen] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setSubOpen(true)} onMouseLeave={() => setSubOpen(false)}>
      <button disabled={item.disabled} className={cn(itemClass, 'flex items-center justify-between w-full cursor-pointer outline-none transition-colors rounded-sm', item.disabled ? 'text-content-disabled cursor-not-allowed' : 'text-content-primary hover:bg-action-primary hover:text-content-on-action')}>
        <span className="flex items-center gap-2">{item.icon}{item.label}</span>
        <ChevronRight className="w-4 h-4" />
      </button>
      {subOpen && item.submenu?.length && (
        <div className="absolute left-full top-0 z-50 bg-surface-overlay border border-stroke-default rounded shadow-lg py-1 min-w-[160px]">
          {item.submenu.map((sub, si) => (
            <button key={si} disabled={sub.disabled} onClick={sub.onClick} className={cn(itemClass, 'flex items-center gap-2 w-full cursor-pointer outline-none transition-colors rounded-sm', sub.disabled ? 'text-content-disabled cursor-not-allowed' : 'text-content-primary hover:bg-action-primary hover:text-content-on-action')}>
              {sub.icon}{sub.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function PopupMenu({ items, size = 'normal', showScrollbar = false, maxHeight = '300px', trigger, open, onOpenChange }: PopupMenuProps) {
  const itemClass = sizeClasses[size];
  const [internalOpen, setInternalOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open! : internalOpen;

  const setOpen = (val: boolean) => { if (!isControlled) setInternalOpen(val); onOpenChange?.(val); };

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const renderItem = (item: MenuItem, index: number) => {
    if (item.separator) return <div key={index} className="my-1 border-t border-stroke-subtle" />;
    if (item.submenu?.length) return <SubMenuItem key={index} item={item} itemClass={itemClass} />;
    return (
      <button key={index} disabled={item.disabled} onClick={() => { item.onClick?.(); setOpen(false); }} className={cn(itemClass, 'flex items-center gap-2 w-full cursor-pointer outline-none transition-colors rounded-sm', item.disabled ? 'text-content-disabled cursor-not-allowed' : 'text-content-primary hover:bg-action-primary hover:text-content-on-action')}>
        {item.icon}{item.label}
      </button>
    );
  };

  if (trigger) {
    return (
      <div ref={ref} className="relative inline-block">
        <div onClick={() => setOpen(!isOpen)}>{trigger}</div>
        {isOpen && (
          <div className={cn('absolute z-50 top-full left-0 mt-1 bg-surface-overlay border border-stroke-default rounded shadow-lg py-1', widthClasses[size], showScrollbar && 'overflow-y-auto')} style={{ maxHeight: showScrollbar ? maxHeight : undefined }}>
            {items.map(renderItem)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('bg-surface-overlay border border-stroke-default rounded shadow-lg py-1', widthClasses[size], showScrollbar && 'overflow-y-auto')} style={{ maxHeight: showScrollbar ? maxHeight : undefined }}>
      {items.map((item, index) => {
        if (item.separator) return <div key={index} className="my-1 border-t border-stroke-subtle" />;
        return (
          <button key={index} onClick={item.onClick} disabled={item.disabled} className={cn(itemClass, 'flex items-center gap-2 w-full text-left transition-colors', item.disabled ? 'text-content-disabled cursor-not-allowed' : 'text-content-primary hover:bg-action-primary hover:text-content-on-action')}>
            {item.icon}<span className="flex-1">{item.label}</span>
            {item.submenu && <ChevronRight className="w-4 h-4 text-content-secondary" />}
          </button>
        );
      })}
    </div>
  );
}
