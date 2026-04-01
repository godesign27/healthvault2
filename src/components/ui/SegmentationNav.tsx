import { useState } from 'react';
import { Home, Package, Grid3x3, Phone, Settings, Database, Bell, X, ChevronRight } from 'lucide-react';

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

const style = document.createElement('style');
style.textContent = `
  :root {
    --zsteal-90: #27504A;
    --zsteal-80: indigo-700;
    --zsteal-70: #407D88;
    --zsteal-60: #599CA4;
    --zsteal-50: #73BAC0;
    --zsteal-20: #DFF1F2;

    --zsorange-80: #FF7D00;

    --zsgray-90: #1A1628;
    --zsgray-80: #2F2C3C;
    --zsgray-70: #454250;
    --zsgray-60: #5B5864;
    --zsgray-50: #726E78;
    --zsgray-30: #B2B0B6;
    --zsgray-20: #D0CFD2;
    --zsgray-10: #E7E6E8;
    --zsgray-00: #F4F3F3;
  }

  .seg-nav-item {
    transition: background-color 0.2s ease;
  }

  .seg-nav-item:not(.active):hover {
    background-color: var(--zsgray-80) !important;
  }

  .seg-nav-item.active {
    background-color: var(--zsteal-80) !important;
  }

  .seg-nav-item.active:active {
    background-color: var(--zsteal-90) !important;
  }

  .seg-submenu-item {
    transition: background-color 0.2s ease;
  }

  .seg-submenu-item:not(.active):hover {
    background-color: var(--zsgray-00) !important;
  }

  .seg-submenu-item.active {
    background-color: var(--zsgray-10) !important;
  }

  .seg-settings-button {
    transition: background-color 0.2s ease;
    color: white;
  }

  .seg-settings-button:hover {
    background-color: var(--zsgray-80);
  }
`;
if (!document.head.querySelector('#seg-nav-colors')) {
  style.id = 'seg-nav-colors';
  document.head.appendChild(style);
}

export function SegmentationNav({ activeProduct = 'Segmentation', onSegmentationClick }: SegmentationNavProps) {
  const [activeNav, setActiveNav] = useState('segmentation');
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  const navigationItems: NavItem[] = [
    { id: 'home', icon: Home, label: 'Home', hasSubmenu: false },
    { id: 'deployment', icon: Package, label: 'Deployment', hasSubmenu: true },
    { id: 'segmentation', icon: Grid3x3, label: 'Segmentation', hasSubmenu: false },
    { id: 'call-planning', icon: Phone, label: 'Call Planning', hasSubmenu: false },
    { id: 'admin', icon: Settings, label: 'Admin', hasSubmenu: true },
    { id: 'data-utilities', icon: Database, label: 'Data Utilities', hasSubmenu: false },
    { id: 'alerts', icon: Bell, label: 'Alerts', hasSubmenu: false },
  ];

  const submenuItems: Record<string, SubmenuItem[]> = {
    deployment: [
      { id: 'overview', label: 'Overview', hasChildren: false },
      { id: 'packages', label: 'Packages', hasChildren: true },
      { id: 'deployments', label: 'Deployments', hasChildren: true },
      { id: 'settings', label: 'Settings', hasChildren: false },
    ],
    admin: [
      { id: 'users', label: 'Users', hasChildren: false },
      { id: 'roles', label: 'Roles & Permissions', hasChildren: true },
      { id: 'settings', label: 'System Settings', hasChildren: false },
      { id: 'logs', label: 'Audit Logs', hasChildren: false },
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
    const hasSubmenu = navigationItems.find(item => item.id === navId)?.hasSubmenu;
    setIsSubmenuOpen(hasSubmenu || false);
    setActiveSubmenu(null);
  };

  const NavItem = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const isActive = activeNav === item.id;

    return (
      <button
        onClick={() => handleNavClick(item.id)}
        className={`seg-nav-item w-full flex items-center justify-center p-4 relative group ${isActive ? 'active' : ''}`}
        style={{ color: 'white' }}
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
      <div
        className="w-20 flex flex-col border-r z-20 relative"
        style={{
          backgroundColor: 'var(--zsgray-90)',
          borderColor: 'var(--zsgray-80)'
        }}
      >
        <div className="h-16 flex items-center justify-center border-b" style={{ borderColor: 'var(--zsgray-80)' }}>
          <div className="w-10 h-10 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--zsteal-80)', color: 'white' }}>
            <span className="font-bold text-sm">Z</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {navigationItems.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}
        </div>

        <div className="border-t" style={{ borderColor: 'var(--zsgray-80)' }}>
          <button className="seg-settings-button w-full flex items-center justify-center p-4">
            <Settings size={24} />
          </button>
        </div>
      </div>

      {isSubmenuOpen && submenuItems[activeNav] && (
        <div
          className="w-64 flex flex-col border-r absolute left-20 top-0 bottom-0 z-10 shadow-lg"
          style={{
            backgroundColor: 'white',
            borderColor: 'var(--zsgray-20)'
          }}
        >
          <div
            className="h-16 flex items-center justify-between px-4 border-b"
            style={{
              backgroundColor: 'var(--zsgray-90)',
              borderColor: 'var(--zsgray-80)'
            }}
          >
            <h2 className="text-[16px] font-semibold" style={{ color: 'white' }}>
              {navigationItems.find(item => item.id === activeNav)?.label}
            </h2>
            <button
              onClick={() => setIsSubmenuOpen(false)}
              className="hover:opacity-75"
              style={{ color: 'white' }}
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto" style={{ backgroundColor: 'white' }}>
            <div className="py-2">
              <div className="px-4 py-2">
                <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--zsgray-50)' }}>
                  NAVIGATION LINKS
                </span>
              </div>
              {submenuItems[activeNav].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSubmenu(item.id)}
                  className={`seg-submenu-item w-full flex items-center justify-between px-4 py-3 text-left ${activeSubmenu === item.id ? 'active' : ''}`}
                  style={{
                    color: activeSubmenu === item.id ? 'var(--zsteal-80)' : 'var(--zsgray-70)'
                  }}
                >
                  <span className="text-[14px] leading-[20px]">{item.label}</span>
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
