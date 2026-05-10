import * as RadixToolbar from '@radix-ui/react-toolbar';
import { Home, Calendar, Search, Palette, Maximize2, ChevronDown } from 'lucide-react';
import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface ToolbarAction {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'dropdown';
}

interface ToolbarProps {
  actions: ToolbarAction[];
  orientation?: 'horizontal' | 'vertical';
  variant?: 'light' | 'dark';
  size?: 'default' | 'compact';
  showLabels?: boolean;
  className?: string;
}

export function Toolbar({
  actions,
  orientation = 'horizontal',
  variant = 'light',
  size = 'default',
  showLabels = true,
  className = '',
}: ToolbarProps) {
  const isDark    = variant === 'dark';
  const isCompact = size === 'compact';

  const containerClass = cn(
    'rounded-lg p-1',
    orientation === 'vertical' ? 'flex flex-col gap-1 p-2' : 'flex items-center gap-1',
    isDark ? 'bg-hv-neutral-900' : 'bg-surface-raised border border-stroke-subtle',
    className,
  );

  const buttonClass = cn(
    'flex items-center gap-2 rounded transition-colors',
    isCompact ? 'p-2' : 'px-3 py-2',
    isDark
      ? 'text-hv-neutral-100 hover:bg-hv-neutral-700 disabled:text-hv-neutral-500'
      : 'text-content-secondary hover:bg-action-secondary hover:text-content-primary disabled:text-content-disabled',
    'disabled:cursor-not-allowed',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus focus-visible:ring-inset',
  );

  return (
    <RadixToolbar.Root
      orientation={orientation}
      className={containerClass}
    >
      {actions.map((action) => (
        <RadixToolbar.Button
          key={action.id}
          onClick={action.onClick}
          disabled={action.disabled}
          className={cn(buttonClass, !showLabels && 'justify-center')}
        >
          {action.icon}
          {showLabels && <span className="text-sm font-medium">{action.label}</span>}
          {action.variant === 'dropdown' && (
            <ChevronDown className={cn('w-4 h-4', orientation === 'vertical' ? 'ml-auto' : '')} />
          )}
        </RadixToolbar.Button>
      ))}
    </RadixToolbar.Root>
  );
}

export const defaultToolbarActions: ToolbarAction[] = [
  { id: 'home',      label: 'Home',      icon: <Home className="w-5 h-5" />,      onClick: () => {} },
  { id: 'calendar',  label: 'Calendar',  icon: <Calendar className="w-5 h-5" />,  onClick: () => {} },
  { id: 'search',    label: 'Search',    icon: <Search className="w-5 h-5" />,    onClick: () => {} },
  { id: 'palette',   label: 'Palette',   icon: <Palette className="w-5 h-5" />,   onClick: () => {} },
  { id: 'territory', label: 'Territory', icon: <Maximize2 className="w-5 h-5" />, onClick: () => {} },
];
