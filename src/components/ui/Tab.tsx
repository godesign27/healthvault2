import { X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';

export type TabSize = 'normal' | 'small';
export type TabStyle = 'solid' | 'outline';
export type TabOrientation = 'horizontal' | 'vertical';

interface Tab {
  id: string;
  label: string;
  content?: React.ReactNode;
  disabled?: boolean;
  closeable?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
  size?: TabSize;
  style?: TabStyle;
  orientation?: TabOrientation;
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onTabChange,
  onTabClose,
  size = 'normal',
  style = 'solid',
  orientation = 'horizontal',
  className = '',
}: TabsProps) {
  const [internalActive, setInternalActive] = useState(tabs[0]?.id ?? '');
  const controlled = activeTab !== undefined;
  const current = controlled ? activeTab : internalActive;

  const handleChange = (id: string) => {
    if (!controlled) setInternalActive(id);
    onTabChange?.(id);
  };

  const tabPadding = size === 'small' ? 'px-4 py-2 text-sm' : 'px-6 py-3 text-base';
  const iconSize   = size === 'small' ? 'w-3 h-3' : 'w-4 h-4';

  const triggerClass = (tab: Tab) => {
    const isActive = current === tab.id;
    return cn(
      tabPadding,
      'font-medium transition-colors inline-flex items-center gap-2 whitespace-nowrap border-b-2 -mb-px',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus focus-visible:ring-inset',
      tab.disabled
        ? 'text-content-disabled cursor-not-allowed border-transparent bg-surface-sunken'
        : style === 'solid'
          ? cn(
              'border-transparent',
              isActive
                ? 'bg-surface-raised text-action-primary border-action-primary'
                : 'bg-surface-sunken text-content-secondary hover:bg-action-secondary',
            )
          : cn(
              'bg-transparent',
              isActive
                ? 'text-action-primary border-action-primary'
                : 'text-content-secondary border-transparent hover:text-content-primary',
            )
    );
  };

  if (orientation === 'vertical') {
    return (
      <div className={cn('flex gap-0', className)}>
        <div className="flex flex-col border-r border-stroke-subtle">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && handleChange(tab.id)}
              disabled={tab.disabled}
              className={cn(
                triggerClass(tab),
                'border-b-0 border-r-2 -mr-px justify-start',
                current === tab.id ? 'border-r-action-primary' : 'border-r-transparent',
              )}
            >
              <span>{tab.label}</span>
              {tab.closeable && !tab.disabled && (
                <button
                  onClick={(e) => { e.stopPropagation(); onTabClose?.(tab.id); }}
                  className="ml-auto hover:bg-action-secondary rounded p-1"
                >
                  <X className={iconSize} />
                </button>
              )}
            </button>
          ))}
        </div>
        {tabs.map((tab) => (
          current === tab.id && (
            <div key={tab.id} className="flex-1 p-6">
              {tab.content}
            </div>
          )
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex border-b border-stroke-subtle overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && handleChange(tab.id)}
            disabled={tab.disabled}
            className={triggerClass(tab)}
          >
            <span>{tab.label}</span>
            {tab.closeable && !tab.disabled && (
              <button
                onClick={(e) => { e.stopPropagation(); onTabClose?.(tab.id); }}
                className="hover:bg-action-secondary rounded p-1"
              >
                <X className={iconSize} />
              </button>
            )}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        current === tab.id && (
          <div key={tab.id} className="p-6">
            {tab.content}
          </div>
        )
      ))}
    </div>
  );
}

interface SimpleTabProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  closeable?: boolean;
  onClick?: () => void;
  onClose?: () => void;
  size?: TabSize;
  style?: TabStyle;
  state?: 'default' | 'active' | 'hover' | 'pressed' | 'focused' | 'disabled';
  className?: string;
}

export function SimpleTab({
  label,
  active = false,
  disabled = false,
  closeable = false,
  onClick,
  onClose,
  size = 'normal',
  style = 'solid',
  className = '',
}: SimpleTabProps) {
  const padding  = size === 'small' ? 'px-4 py-2 text-sm' : 'px-6 py-3 text-base';
  const iconSize = size === 'small' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        padding,
        'font-medium transition-colors inline-flex items-center gap-2 whitespace-nowrap border-b-2',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus focus-visible:ring-offset-2',
        disabled
          ? 'text-content-disabled cursor-not-allowed border-transparent' + (style === 'solid' ? ' bg-surface-sunken' : '')
          : active
            ? cn(
                'text-action-primary border-action-primary cursor-pointer',
                style === 'solid' && 'bg-surface-raised',
              )
            : cn(
                'text-content-secondary border-transparent cursor-pointer',
                style === 'solid'
                  ? 'bg-surface-sunken hover:bg-action-secondary'
                  : 'hover:text-content-primary',
              ),
        className
      )}
    >
      <span>{label}</span>
      {closeable && !disabled && (
        <button
          onClick={(e) => { e.stopPropagation(); onClose?.(); }}
          className="hover:bg-action-secondary rounded p-1"
        >
          <X className={iconSize} />
        </button>
      )}
    </button>
  );
}
