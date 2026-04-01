import { useState } from 'react';
import { ChevronRight, Home, FileText, Settings, Users, BarChart, HelpCircle } from 'lucide-react';

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
  { id: 'home', label: 'Home', icon: Home },
  { id: 'docs', label: 'Documentation', icon: FileText },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'help', label: 'Help', icon: HelpCircle }
];

export function PrimaryNavigation({
  variant = 'expanded',
  items = defaultNavItems,
  logo = 'ZAIDYN',
  onNavigate
}: PrimaryNavigationProps) {
  const [activeItem, setActiveItem] = useState<string>('home');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>(null);

  const handleItemClick = (itemId: string) => {
    setActiveItem(itemId);
    if (onNavigate) {
      onNavigate(itemId);
    }
  };

  if (variant === 'collapsed') {
    return (
      <div className="w-16 bg-[#1C2938] text-white h-screen flex flex-col items-center py-6">
        <div className="mb-8">
          <div className="w-10 h-10 bg-[indigo-600] rounded flex items-center justify-center font-bold text-sm">
            Z
          </div>
        </div>

        <nav className="flex-1 w-full flex flex-col items-center gap-2">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            const isHovered = hoveredItem === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`
                  w-12 h-12 flex items-center justify-center rounded-lg transition-colors
                  ${isActive ? 'bg-[#3D9199]' : ''}
                  ${isHovered && !isActive ? 'bg-[#253847]' : ''}
                `}
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

  if (variant === 'expanded') {
    return (
      <div className="w-64 bg-[#1C2938] text-white h-screen flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[indigo-600] rounded flex items-center justify-center font-bold">
              Z
            </div>
            <span className="text-xl font-bold">{logo}</span>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              const isHovered = hoveredItem === item.id;
              const hasSubmenu = item.submenu && item.submenu.length > 0;
              const isExpanded = expandedSubmenu === item.id;

              return (
                <div key={item.id}>
                  <button
                    onClick={() => {
                      handleItemClick(item.id);
                      if (hasSubmenu) {
                        setExpandedSubmenu(isExpanded ? null : item.id);
                      }
                    }}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors
                      ${isActive ? 'bg-[#3D9199]' : ''}
                      ${isHovered && !isActive ? 'bg-[#253847]' : ''}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    {hasSubmenu && (
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      />
                    )}
                  </button>

                  {hasSubmenu && isExpanded && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.submenu!.map((subItem) => (
                        <button
                          key={subItem.id}
                          onClick={() => handleItemClick(subItem.id)}
                          className="w-full text-left px-4 py-2 rounded text-sm hover:bg-[#253847] transition-colors"
                        >
                          {subItem.label}
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

  return (
    <div className="w-64 bg-[#1C2938] text-white h-screen flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[indigo-600] rounded flex items-center justify-center font-bold">
            Z
          </div>
          <span className="text-xl font-bold">{logo}</span>
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${isActive ? 'bg-[#3D9199]' : 'hover:bg-[#253847]'}
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
