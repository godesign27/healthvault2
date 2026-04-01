import { X } from 'lucide-react';
import { useState } from 'react';

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
  activeTab: controlledActiveTab,
  onTabChange,
  onTabClose,
  size = 'normal',
  style = 'solid',
  orientation = 'horizontal',
  className = ''
}: TabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(tabs[0]?.id || '');
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;

  const handleTabClick = (tabId: string, disabled?: boolean) => {
    if (disabled) return;
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(tabId);
    }
    onTabChange?.(tabId);
  };

  const handleClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    onTabClose?.(tabId);
  };

  const getSizeClasses = () => {
    if (size === 'small') {
      return {
        tab: 'px-4 py-2 text-sm',
        icon: 'w-3 h-3'
      };
    }
    return {
      tab: 'px-6 py-3 text-base',
      icon: 'w-4 h-4'
    };
  };

  const getTabClasses = (tab: Tab) => {
    const sizes = getSizeClasses();
    const isActive = activeTab === tab.id;
    const isDisabled = tab.disabled;

    const baseClasses = `${sizes.tab} font-medium transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap`;

    if (isDisabled) {
      if (style === 'solid') {
        return `${baseClasses} bg-gray-100 text-gray-400 cursor-not-allowed`;
      }
      return `${baseClasses} text-gray-400 cursor-not-allowed border-b-2 border-transparent`;
    }

    if (style === 'solid') {
      if (isActive) {
        return `${baseClasses} bg-white text-[indigo-600] border-b-2 border-[indigo-600]`;
      }
      return `${baseClasses} bg-gray-100 text-gray-600 hover:bg-gray-200`;
    }

    if (isActive) {
      return `${baseClasses} text-[indigo-600] border-b-2 border-[indigo-600]`;
    }
    return `${baseClasses} text-gray-600 hover:text-gray-900 border-b-2 border-transparent`;
  };

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

  if (orientation === 'vertical') {
    return (
      <div className={`flex gap-0 ${className}`}>
        <div className="flex flex-col border-r border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id, tab.disabled)}
              disabled={tab.disabled}
              className={`${getTabClasses(tab)} border-b-0 border-r-2 justify-start ${
                activeTab === tab.id
                  ? 'border-r-[indigo-600]'
                  : 'border-r-transparent'
              }`}
            >
              <span>{tab.label}</span>
              {tab.closeable && !tab.disabled && (
                <button
                  onClick={(e) => handleClose(e, tab.id)}
                  className="ml-auto hover:bg-gray-200 rounded p-1"
                >
                  <X className={getSizeClasses().icon} />
                </button>
              )}
            </button>
          ))}
        </div>
        {activeTabContent && (
          <div className="flex-1 p-6">
            {activeTabContent}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id, tab.disabled)}
            disabled={tab.disabled}
            className={getTabClasses(tab)}
          >
            <span>{tab.label}</span>
            {tab.closeable && !tab.disabled && (
              <button
                onClick={(e) => handleClose(e, tab.id)}
                className="hover:bg-gray-200 rounded p-1"
              >
                <X className={getSizeClasses().icon} />
              </button>
            )}
          </button>
        ))}
      </div>
      {activeTabContent && (
        <div className="p-6">
          {activeTabContent}
        </div>
      )}
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
  state = 'default',
  className = ''
}: SimpleTabProps) {
  const getSizeClasses = () => {
    if (size === 'small') {
      return {
        tab: 'px-4 py-2 text-sm',
        icon: 'w-3 h-3'
      };
    }
    return {
      tab: 'px-6 py-3 text-base',
      icon: 'w-4 h-4'
    };
  };

  const sizes = getSizeClasses();
  const baseClasses = `${sizes.tab} font-medium transition-colors inline-flex items-center gap-2 whitespace-nowrap border-b-2`;

  const getStateClasses = () => {
    if (disabled || state === 'disabled') {
      if (style === 'solid') {
        return 'bg-gray-100 text-gray-400 cursor-not-allowed border-transparent';
      }
      return 'text-gray-400 cursor-not-allowed border-transparent';
    }

    if (style === 'solid') {
      if (active || state === 'active') {
        if (state === 'focused') {
          return 'bg-white text-[indigo-600] border-[indigo-600] ring-2 ring-[indigo-600] ring-offset-2';
        }
        if (state === 'pressed') {
          return 'bg-white text-[indigo-700] border-[indigo-700]';
        }
        return 'bg-white text-[indigo-600] border-[indigo-600] cursor-pointer';
      }
      if (state === 'hover') {
        return 'bg-gray-200 text-gray-600 border-transparent cursor-pointer';
      }
      if (state === 'pressed') {
        return 'bg-gray-300 text-gray-700 border-transparent cursor-pointer';
      }
      if (state === 'focused') {
        return 'bg-gray-100 text-gray-600 border-transparent ring-2 ring-[indigo-600] ring-offset-2 cursor-pointer';
      }
      return 'bg-gray-100 text-gray-600 border-transparent cursor-pointer';
    }

    if (active || state === 'active') {
      if (state === 'focused') {
        return 'text-[indigo-600] border-[indigo-600] ring-2 ring-[indigo-600] ring-offset-2 cursor-pointer';
      }
      if (state === 'pressed') {
        return 'text-[indigo-700] border-[indigo-700] cursor-pointer';
      }
      return 'text-[indigo-600] border-[indigo-600] cursor-pointer';
    }
    if (state === 'hover') {
      return 'text-gray-900 border-transparent cursor-pointer';
    }
    if (state === 'pressed') {
      return 'text-gray-700 border-gray-300 cursor-pointer';
    }
    if (state === 'focused') {
      return 'text-gray-600 border-transparent ring-2 ring-[indigo-600] ring-offset-2 cursor-pointer';
    }
    return 'text-gray-600 border-transparent cursor-pointer';
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose?.();
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${getStateClasses()} ${className}`}
    >
      <span>{label}</span>
      {closeable && !disabled && (
        <button
          onClick={handleClose}
          className="hover:bg-gray-200 rounded p-1"
        >
          <X className={sizes.icon} />
        </button>
      )}
    </button>
  );
}
