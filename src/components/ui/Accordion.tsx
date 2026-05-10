import { ChevronDown, Plus, CreditCard as Edit2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface AccordionItemProps {
  title: string;
  content?: ReactNode;
  isExpanded?: boolean;
  onToggle?: () => void;
  variant?: 'border' | 'borderless';
  state?: 'default' | 'focus' | 'disabled';
  showButton?: boolean;
  buttonLabel?: string;
  showIcons?: boolean;
  className?: string;
}

export function AccordionItem({
  title,
  content,
  isExpanded = false,
  onToggle,
  variant = 'border',
  state = 'default',
  showButton = false,
  buttonLabel = 'Button',
  showIcons = true,
  className = '',
}: AccordionItemProps) {
  const isDisabled = state === 'disabled';
  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        aria-expanded={isExpanded}
        onClick={() => !isDisabled && onToggle?.()}
        onKeyDown={(e) => e.key === 'Enter' && !isDisabled && onToggle?.()}
        className={cn(
          'flex items-center justify-between px-6 py-4 transition-colors',
          variant === 'border' && 'border-t border-b border-stroke-subtle',
          isDisabled ? 'opacity-50 cursor-not-allowed bg-surface-sunken' : 'bg-surface-raised hover:bg-action-secondary cursor-pointer',
        )}
      >
        <div className="flex items-center gap-3 flex-1">
          {showIcons && (
            <ChevronDown className={cn('w-4 h-4 text-action-primary transition-transform duration-200', isExpanded && 'rotate-180')} />
          )}
          <span className="text-sm font-medium text-content-primary">{title}</span>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {showButton && (
            <button disabled={isDisabled} className="px-3 py-1 text-xs font-medium text-action-primary border border-action-primary rounded hover:bg-action-primary hover:text-content-on-action transition-colors disabled:opacity-50">
              {buttonLabel}
            </button>
          )}
          {showIcons && (
            <>
              <button disabled={isDisabled} className="p-1 text-content-secondary hover:text-action-primary transition-colors disabled:opacity-50"><Plus className="w-4 h-4" /></button>
              <button disabled={isDisabled} className="p-1 text-content-secondary hover:text-action-primary transition-colors disabled:opacity-50"><Edit2 className="w-4 h-4" /></button>
            </>
          )}
        </div>
      </div>
      {isExpanded && content && (
        <div className={cn('px-6 py-4', variant === 'border' && 'border-b border-stroke-subtle bg-surface-sunken')}>{content}</div>
      )}
    </div>
  );
}

interface AccordionProps {
  items: Array<{ title: string; content?: ReactNode }>;
  variant?: 'border' | 'borderless';
  defaultExpanded?: number[];
  allowMultiple?: boolean;
  showButtons?: boolean;
  buttonLabel?: string;
  showIcons?: boolean;
  className?: string;
}

export function Accordion({
  items,
  variant = 'border',
  defaultExpanded = [],
  allowMultiple = false,
  showButtons = false,
  buttonLabel = 'Button',
  showIcons = true,
  className = '',
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set(defaultExpanded));

  const toggle = (index: number) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) { next.delete(index); } else { if (!allowMultiple) next.clear(); next.add(index); }
      return next;
    });
  };

  return (
    <div className={className}>
      {items.map((item, index) => {
        const isOpen = openItems.has(index);
        return (
          <div key={index}>
            <button
              type="button"
              onClick={() => toggle(index)}
              className={cn(
                'flex items-center justify-between w-full px-6 py-4 transition-colors',
                variant === 'border' && 'border-t border-b border-stroke-subtle',
                'bg-surface-raised hover:bg-action-secondary',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus focus-visible:ring-inset',
              )}
            >
              <div className="flex items-center gap-3 flex-1">
                {showIcons && <ChevronDown className={cn('w-4 h-4 text-action-primary transition-transform duration-200', isOpen && 'rotate-180')} />}
                <span className="text-sm font-medium text-content-primary">{item.title}</span>
              </div>
              {(showButtons || showIcons) && (
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {showButtons && <button className="px-3 py-1 text-xs font-medium text-action-primary border border-action-primary rounded hover:bg-action-primary hover:text-content-on-action transition-colors">{buttonLabel}</button>}
                  {showIcons && (
                    <>
                      <button className="p-1 text-content-secondary hover:text-action-primary transition-colors"><Plus className="w-4 h-4" /></button>
                      <button className="p-1 text-content-secondary hover:text-action-primary transition-colors"><Edit2 className="w-4 h-4" /></button>
                    </>
                  )}
                </div>
              )}
            </button>
            {isOpen && (
              <div className={cn('px-6 py-4', variant === 'border' && 'border-b border-stroke-subtle bg-surface-sunken')}>{item.content}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface NestedAccordionProps {
  title: string;
  nestedItems: Array<{ title: string; content?: ReactNode }>;
  isExpanded?: boolean;
  onToggle?: () => void;
  variant?: 'border' | 'borderless';
  state?: 'default' | 'focus';
  showIcons?: boolean;
  className?: string;
}

export function NestedAccordion({
  title,
  nestedItems,
  isExpanded = false,
  onToggle,
  variant = 'border',
  state = 'default',
  showIcons = true,
  className = '',
}: NestedAccordionProps) {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());
  const toggle = (i: number) => setOpenItems((p) => { const n = new Set(p); n.has(i) ? n.delete(i) : n.add(i); return n; });

  return (
    <div className={className}>
      <div
        role="button" tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => e.key === 'Enter' && onToggle?.()}
        className={cn(
          'flex items-center justify-between p-4 cursor-pointer transition-colors',
          variant === 'border'
            ? cn('border-2 bg-surface-raised', state === 'focus' ? 'border-action-primary' : 'border-stroke-default hover:border-stroke-strong')
            : (state === 'focus' ? 'bg-action-secondary' : 'bg-surface-raised hover:bg-action-secondary'),
        )}
      >
        <div className="flex items-center gap-3">
          {showIcons && <ChevronDown className={cn('w-4 h-4 text-content-secondary transition-transform duration-200', isExpanded && 'rotate-180')} />}
          <span className="text-sm font-medium text-content-primary">{title}</span>
        </div>
        {showIcons && (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button className="p-1 text-content-secondary hover:text-action-primary transition-colors"><Plus className="w-4 h-4" /></button>
            <button className="p-1 text-content-secondary hover:text-action-primary transition-colors"><Edit2 className="w-4 h-4" /></button>
          </div>
        )}
      </div>
      {isExpanded && (
        <div className={variant === 'border' ? 'border-2 border-t-0 border-stroke-default' : ''}>
          {nestedItems.map((item, index) => {
            const isOpen = openItems.has(index);
            return (
              <div key={index} className={cn(variant === 'border' ? 'border-t-2 border-stroke-default' : 'border-t-2 border-stroke-subtle')}>
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className={cn(
                    'flex items-center justify-between w-full p-4 pl-12 bg-surface-raised hover:bg-action-secondary transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus focus-visible:ring-inset',
                  )}
                >
                  <div className="flex items-center gap-3">
                    {showIcons && <ChevronDown className={cn('w-4 h-4 text-content-secondary transition-transform duration-200', isOpen && 'rotate-180')} />}
                    <span className="text-sm text-content-primary">{item.title}</span>
                  </div>
                  {showIcons && (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button className="p-1 text-content-secondary hover:text-action-primary transition-colors"><Plus className="w-4 h-4" /></button>
                      <button className="p-1 text-content-secondary hover:text-action-primary transition-colors"><Edit2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </button>
                {isOpen && <div className="bg-surface-sunken p-4 pl-12">{item.content}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
