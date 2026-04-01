import { Home, Calendar, Search, Palette, Maximize2, ChevronDown } from 'lucide-react';
import { ReactNode } from 'react';

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
  className = ''
}: ToolbarProps) {
  const isLight = variant === 'light';
  const isCompact = size === 'compact';

  const baseButtonClass = `
    flex items-center gap-2 rounded transition-colors
    ${isCompact ? 'p-2' : 'px-4 py-2'}
    ${isLight
      ? 'text-gray-700 hover:bg-gray-100 disabled:text-gray-400'
      : 'text-white bg-[#1C2938] hover:bg-[#253847] disabled:text-gray-500'
    }
    disabled:cursor-not-allowed
  `;

  if (orientation === 'vertical') {
    return (
      <div className={`flex flex-col gap-1 ${isLight ? 'bg-white' : 'bg-[#1C2938]'} rounded-lg p-2 ${className}`}>
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            disabled={action.disabled}
            className={`${baseButtonClass} ${!showLabels ? 'justify-center' : ''}`}
          >
            {action.icon}
            {showLabels && <span className="text-sm font-medium">{action.label}</span>}
            {action.variant === 'dropdown' && <ChevronDown className="w-4 h-4 ml-auto" />}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${isLight ? 'bg-white' : 'bg-[#1C2938]'} rounded-lg p-1 ${className}`}>
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={action.onClick}
          disabled={action.disabled}
          className={baseButtonClass}
        >
          {action.icon}
          {showLabels && <span className="text-sm font-medium">{action.label}</span>}
          {action.variant === 'dropdown' && <ChevronDown className="w-4 h-4" />}
        </button>
      ))}
    </div>
  );
}

export const defaultToolbarActions: ToolbarAction[] = [
  {
    id: 'home',
    label: 'Home',
    icon: <Home className="w-5 h-5" />,
    onClick: () => console.log('Home clicked')
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: <Calendar className="w-5 h-5" />,
    onClick: () => console.log('Calendar clicked')
  },
  {
    id: 'search',
    label: 'Search',
    icon: <Search className="w-5 h-5" />,
    onClick: () => console.log('Search clicked')
  },
  {
    id: 'palette',
    label: 'Palette',
    icon: <Palette className="w-5 h-5" />,
    onClick: () => console.log('Palette clicked')
  },
  {
    id: 'territory',
    label: 'Territory',
    icon: <Maximize2 className="w-5 h-5" />,
    onClick: () => console.log('Territory clicked')
  }
];
