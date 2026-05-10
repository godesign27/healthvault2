import { useState } from 'react';
import { Home, Package, Grid3x3, Phone, Settings, Database, Bell, X, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface NavItem {
  id: string;
  icon: typeof Home;
  label: string;
  hasSubmenu: boolean;
}

interface SubmenuItem {
  id: string;
  label: string;
  hasChildren: boolean;
}

interface SegmentationNavProps {
  activeProduct?: string;
  onSegmentationClick?: () => void;
}

export function SegmentationNav({ activeProduct = 'Segmentation', onSegmentationClick }: SegmentationNavProps) {
  const [activeNav, setActiveNav]         = useState('segmentation');
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  const navigationItems: NavItem[] = [
    { id: 'home',           icon: Home,     label: 'Home',          hasSubmenu: false },
    { id: 'deployment',     icon: Package,  label: 'Deployment',    hasSubmenu: true  },
    { id: 'segmentation',   icon: Grid3x3,  label: 'Segmentation',  hasSubmenu: false },
    { id: 'call-planning',  icon: Phone,    label: 'Call Planning', hasSubmenu: false },
    { id: 'admin',          icon: Settings, label: 'Admin',         hasSubmenu: true  },
    { id: 'data-utilities', icon: Database, label: 'Data Utilities',hasSubmenu: false },
    { id: 'alerts',         icon: Bell,     label: 'Alerts',        hasSubmenu: false },
  ];

  const submenuItems: Record<string, SubmenuItem[]> = {
    deployment: [
      { id: 'overview',    label: 'Overview',    hasChildren: false },
      { id: 'packages',    label: 'Packages',    hasChildren: true  },
      { id: 'deployments', label: 'Deployments', hasChildren: true  },
      { id: 'settings',    label: 'Settings',    hasChildren: false },
    ],
    admin: [
      { id: 'users',    label: 'Users',             hasChildren: false },
      { id: 'roles',    label: 'Roles & Permissions', hasChildren: true },
      { id: 'settings', label: 'System Settings',   hasChildren: false },
      { id: 'logs',     label: 'Audit Logs',         hasChildren: false },
    ],
  };

  const handleNavClick = (navId: string) => {
    if (navId === 'segmentation' && onSegmentationClick) {
      onSegmentationClick();
      setActiveNav(navId);
      setIsSubmenuOpen(false);
      return;
    }
    setActiveNav(navId);
    const item = navigationItems.find((i) => i.id === navId);
    setIsSubmenuOpen(item?.hasSubmenu ?? false);
    setActiveSubmenu(null);
  };

  const NavButton = ({ item }: { item: NavItem }) => {
    const Icon     = item.icon;
    const isActive = activeNav === item.id;

    return (
      <button
        onClick={() => handleNavClick(item.id)}
        className={cn(
          'w-full flex items-center justify-center p-4 relative transition-colors text-hv-neutral-100',
          isActive ? 'bg-hv-teal-700' : 'hover:bg-hv-neutral-700',
        )}
      >
        <div className="flex flex-col items-center gap-1">
          <Icon size={24} />
          <span className="text-[10px] leading-[14px] font-semibold">{item.label}</span>
        </div>
      </button>
    );
  };

  return (
    <div className="flex h-full relative">
      {/* Rail nav */}
      <div className="w-20 flex flex-col border-r border-hv-neutral-700 z-20 relative bg-hv-neutral-900">
        <div className="h-16 flex items-center justify-center border-b border-hv-neutral-700">
          <div className="w-10 h-10 rounded flex items-center justify-center bg-hv-teal-700 text-hv-neutral-0">
            <span className="font-bold text-sm">H</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {navigationItems.map((item) => (
            <NavButton key={item.id} item={item} />
          ))}
        </div>

        <div className="border-t border-hv-neutral-700">
          <button className="w-full flex items-center justify-center p-4 text-hv-neutral-100 hover:bg-hv-neutral-700 transition-colors">
            <Settings size={24} />
          </button>
        </div>
      </div>

      {/* Submenu panel */}
      {isSubmenuOpen && submenuItems[activeNav] && (
        <div className="w-64 flex flex-col border-r border-stroke-subtle absolute left-20 top-0 bottom-0 z-10 shadow-lg bg-surface-raised">
          <div className="h-16 flex items-center justify-between px-4 border-b border-hv-neutral-700 bg-hv-neutral-900">
            <h2 className="text-base font-semibold text-hv-neutral-0">
              {navigationItems.find((i) => i.id === activeNav)?.label}
            </h2>
            <button
              onClick={() => setIsSubmenuOpen(false)}
              className="text-hv-neutral-100 hover:opacity-75 transition-opacity"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="py-2">
              <div className="px-4 py-2">
                <span className="text-[10px] font-semibold uppercase text-content-tertiary tracking-wider">
                  Navigation Links
                </span>
              </div>
              {submenuItems[activeNav].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSubmenu(item.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 text-left text-sm transition-colors',
                    activeSubmenu === item.id
                      ? 'text-action-primary bg-action-primary-subtle'
                      : 'text-content-secondary hover:bg-action-secondary',
                  )}
                >
                  <span>{item.label}</span>
                  {item.hasChildren && <ChevronRight size={16} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
