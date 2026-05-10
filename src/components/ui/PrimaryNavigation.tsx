import { useState } from 'react';
import { ChevronRight, Home, FileText, Settings, Users, BarChart, HelpCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  submenu?: NavItem[];
}

interface PrimaryNavigationProps {
  variant?: 'collapsed' | 'expanded' | 'sidebar';
  items?: NavItem[];
  logo?: string;
  onNavigate?: (itemId: string) => void;
}

const defaultNavItems: NavItem[] = [
  { id: 'home',      label: 'Home',          icon: Home },
  { id: 'docs',      label: 'Documentation', icon: FileText },
  { id: 'users',     label: 'Users',         icon: Users },
  { id: 'analytics', label: 'Analytics',     icon: BarChart },
  { id: 'settings',  label: 'Settings',      icon: Settings },
  { id: 'help',      label: 'Help',          icon: HelpCircle },
];

const navBg  = 'bg-hv-neutral-900 text-hv-neutral-100';
const active = 'bg-hv-teal-600 text-hv-neutral-0';
const hover  = 'hover:bg-hv-neutral-700';

export function PrimaryNavigation({
  variant = 'expanded',
  items = defaultNavItems,
  logo = 'HEALTHVAULT',
  onNavigate,
}: PrimaryNavigationProps) {
  const [activeItem, setActiveItem]         = useState<string>('home');
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>(null);

  const handleItemClick = (itemId: string) => {
    setActiveItem(itemId);
    onNavigate?.(itemId);
  };

  if (variant === 'collapsed') {
    return (
      <div className={cn('w-16 h-screen flex flex-col items-center py-6', navBg)}>
        <div className="mb-8">
          <div className="w-10 h-10 bg-action-primary rounded flex items-center justify-center font-bold text-sm text-content-on-action">
            H
          </div>
        </div>
        <nav className="flex-1 w-full flex flex-col items-center gap-2">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={cn(
                  'w-12 h-12 flex items-center justify-center rounded-lg transition-colors',
                  isActive ? active : cn('text-hv-neutral-300', hover),
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus',
                )}
                title={item.label}
              >
                <Icon className="w-6 h-6" />
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  return (
    <div className={cn('w-64 h-screen flex flex-col', navBg)}>
      <div className="p-6 border-b border-hv-neutral-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-action-primary rounded flex items-center justify-center font-bold text-content-on-action">
            H
          </div>
          <span className="text-xl font-bold text-hv-neutral-0">{logo}</span>
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive   = activeItem === item.id;
            const hasSubmenu = !!(item.submenu?.length);
            const isExpanded = expandedSubmenu === item.id;

            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    handleItemClick(item.id);
                    if (hasSubmenu) setExpandedSubmenu(isExpanded ? null : item.id);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors',
                    isActive ? active : cn('text-hv-neutral-300', hover),
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus focus-visible:ring-inset',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  {hasSubmenu && (
                    <ChevronRight className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-90')} />
                  )}
                </button>

                {hasSubmenu && isExpanded && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.submenu!.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => handleItemClick(sub.id)}
                        className={cn(
                          'w-full text-left px-4 py-2 rounded text-sm transition-colors',
                          activeItem === sub.id ? active : cn('text-hv-neutral-300', hover),
                        )}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
