import React, { useState } from 'react';
import { Home, Settings, Users, FileText, ChevronRight, Menu, X } from 'lucide-react';

// Inline CSS Variables
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
`;
if (!document.head.querySelector('#nav-colors')) {
  style.id = 'nav-colors';
  document.head.appendChild(style);
}

// Navigation Item Component
const NavItem = ({ icon: Icon, label, isActive, onClick, hasSubmenu, theme = 'dark' }) => {
  const getStyles = () => {
    if (theme === 'light') {
      return {
        backgroundColor: isActive ? 'var(--zsteal-20)' : 'transparent',
        color: isActive ? 'var(--zsteal-80)' : 'var(--zsgray-70)'
      };
    }
    return {
      backgroundColor: isActive ? 'var(--zsteal-80)' : 'transparent',
      color: 'white'
    };
  };

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center p-4 transition-colors relative group"
      style={getStyles()}
    >
      <div className="flex flex-col items-center gap-1">
        <Icon size={24} />
        <span className="text-[10px] leading-[14px] font-semibold">{label}</span>
      </div>
    </button>
  );
};

// Submenu Item Component
const SubmenuItem = ({ label, isActive, onClick, hasChildren, theme = 'dark' }) => {
  const getStyles = () => {
    if (theme === 'light') {
      return {
        backgroundColor: isActive ? 'var(--zsgray-10)' : 'transparent',
        color: isActive ? 'var(--zsteal-80)' : 'var(--zsgray-70)'
      };
    }
    return {
      backgroundColor: isActive ? 'var(--zsgray-80)' : 'transparent',
      color: 'white'
    };
  };

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3 transition-colors text-left"
      style={getStyles()}
    >
      <span className="text-[14px] leading-[20px]">{label}</span>
      {hasChildren && <ChevronRight size={16} />}
    </button>
  );
};

// Primary Navigation Component
export const PrimaryNavigation = ({ theme = 'dark', drawerVariant = 'default' }) => {
  const [activeNav, setActiveNav] = useState('nav1');
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);

  const getThemeStyles = () => {
    if (theme === 'light') {
      return {
        nav: { backgroundColor: 'white', borderColor: 'var(--zsgray-20)' },
        submenu: { backgroundColor: 'white', borderColor: 'var(--zsgray-20)' },
        submenuHeader: { backgroundColor: 'white', borderColor: 'var(--zsgray-20)' },
        submenuBody: { backgroundColor: 'white' },
        icon: { backgroundColor: 'var(--zsteal-80)', color: 'white' },
        bottomIcon: { color: 'var(--zsgray-70)' },
        headerText: { color: 'var(--zsgray-90)' },
        sectionLabel: { color: 'var(--zsgray-50)' },
        submenuItemColor: 'var(--zsgray-70)'
      };
    }
    
    if (drawerVariant === 'mixed') {
      return {
        nav: { backgroundColor: 'var(--zsgray-90)', borderColor: 'var(--zsgray-80)' },
        submenu: { backgroundColor: 'white', borderColor: 'var(--zsgray-20)' },
        submenuHeader: { backgroundColor: 'var(--zsgray-90)', borderColor: 'var(--zsgray-80)' },
        submenuBody: { backgroundColor: 'white' },
        icon: { backgroundColor: 'var(--zsteal-80)', color: 'white' },
        bottomIcon: { color: 'white' },
        headerText: { color: 'white' },
        sectionLabel: { color: 'var(--zsgray-50)' },
        submenuItemColor: 'var(--zsgray-70)'
      };
    }
    
    return {
      nav: { backgroundColor: 'var(--zsgray-90)', borderColor: 'var(--zsgray-80)' },
      submenu: { backgroundColor: 'var(--zsgray-90)', borderColor: 'var(--zsgray-80)' },
      submenuHeader: { backgroundColor: 'var(--zsgray-90)', borderColor: 'var(--zsgray-80)' },
      submenuBody: { backgroundColor: 'var(--zsgray-90)' },
      icon: { backgroundColor: 'var(--zsteal-80)', color: 'white' },
      bottomIcon: { color: 'white' },
      headerText: { color: 'white' },
      sectionLabel: { color: 'var(--zsgray-50)' },
      submenuItemColor: 'white'
    };
  };

  const styles = getThemeStyles();

  const navigationItems = [
    { id: 'nav1', icon: Home, label: 'NAV 1', hasSubmenu: true },
    { id: 'nav2', icon: FileText, label: 'NAV 2', hasSubmenu: true },
    { id: 'nav3', icon: Users, label: 'NAV 3', hasSubmenu: false },
    { id: 'nav4', icon: Settings, label: 'NAV 4', hasSubmenu: true },
  ];

  const submenuItems = {
    nav1: [
      { id: 'item1', label: 'SUBMENU ITEM 1', hasChildren: true },
      { id: 'item2', label: 'SUBMENU ITEM 2', hasChildren: true },
      { id: 'item3', label: 'SUBMENU ITEM 3', hasChildren: false },
      { id: 'item4', label: 'SUBMENU ITEM 4', hasChildren: false },
    ],
    nav2: [
      { id: 'item1', label: 'SUBMENU ITEM 1', hasChildren: true },
      { id: 'item2', label: 'SUBMENU ITEM 2', hasChildren: false },
    ],
    nav4: [
      { id: 'item1', label: 'SUBMENU ITEM 1', hasChildren: true },
      { id: 'item2', label: 'SUBMENU ITEM 2', hasChildren: true },
      { id: 'item3', label: 'SUBMENU ITEM 3', hasChildren: true },
    ],
  };

  const handleNavClick = (navId) => {
    setActiveNav(navId);
    const hasSubmenu = navigationItems.find(item => item.id === navId)?.hasSubmenu;
    setIsSubmenuOpen(hasSubmenu);
    setActiveSubmenu(null);
  };

  return (
    <div className="flex h-full relative" style={{ backgroundColor: 'var(--zsgray-00)' }}>
      {/* Primary Navigation Bar */}
      <div
        className="w-20 flex flex-col border-r z-20 relative"
        style={styles.nav}
      >
        {/* Logo/Brand Area */}
        <div className="h-16 flex items-center justify-center border-b" style={{ borderColor: styles.nav.borderColor }}>
          <div className="w-10 h-10 rounded flex items-center justify-center" style={styles.icon}>
            <span className="font-bold text-sm">Z</span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto">
          {navigationItems.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={activeNav === item.id}
              onClick={() => handleNavClick(item.id)}
              hasSubmenu={item.hasSubmenu}
              theme={theme}
            />
          ))}
        </div>

        {/* Bottom Navigation Items */}
        <div className="border-t" style={{ borderColor: styles.nav.borderColor }}>
          <button
            className="w-full flex items-center justify-center p-4 transition-colors"
            style={{ color: styles.bottomIcon.color }}
          >
            <Settings size={24} />
          </button>
        </div>
      </div>

      {/* Submenu Flyout - Overlay */}
      {isSubmenuOpen && submenuItems[activeNav] && (
        <div
          className="w-64 flex flex-col border-r absolute left-20 top-0 bottom-0 z-10 shadow-lg"
          style={{
            backgroundColor: styles.submenu.backgroundColor,
            borderColor: styles.submenu.borderColor
          }}
        >
          {/* Submenu Header */}
          <div
            className="h-16 flex items-center justify-between px-4 border-b"
            style={{
              backgroundColor: styles.submenuHeader.backgroundColor,
              borderColor: styles.submenuHeader.borderColor
            }}
          >
            <h2 className="text-[16px] font-semibold" style={{ color: styles.headerText.color }}>
              {navigationItems.find(item => item.id === activeNav)?.label}
            </h2>
            <button
              onClick={() => setIsSubmenuOpen(false)}
              className="hover:opacity-75"
              style={{ color: styles.headerText.color }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Submenu Items */}
          <div className="flex-1 overflow-y-auto" style={{ backgroundColor: styles.submenuBody.backgroundColor }}>
            <div className="py-2">
              <div className="px-4 py-2">
                <span className="text-[10px] font-semibold uppercase" style={{ color: styles.sectionLabel.color }}>
                  NAVIGATION LINKS
                </span>
              </div>
              {submenuItems[activeNav].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSubmenu(item.id)}
                  className="w-full flex items-center justify-between px-4 py-3 transition-colors text-left"
                  style={{
                    backgroundColor: activeSubmenu === item.id ? 'var(--zsgray-10)' : 'transparent',
                    color: activeSubmenu === item.id ? 'var(--zsteal-80)' : styles.submenuItemColor
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

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-8">
        <h1 className="text-[28px] font-semibold leading-[40px] mb-4" style={{ color: 'var(--zsgray-90)' }}>
          Primary Navigation Demo - {theme === 'dark' ? 'Dark' : 'Light'} Theme
          {drawerVariant === 'mixed' && ' (Mixed Drawer)'}
        </h1>
        <p className="text-[14px] leading-[20px]" style={{ color: 'var(--zsgray-60)' }}>
          Click on the navigation items on the left to see the submenu flyout.
        </p>
      </div>
    </div>
  );
};

// Interactive States Demo
const NavigationStatesDemo = () => {
  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--zsgray-00)' }}>
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-white p-6" style={{ backgroundColor: 'var(--zsgray-90)' }}>
          <h1 className="text-[28px] font-semibold leading-[40px]">Primary Navigation</h1>
        </div>

        {/* Navigation Link States */}
        <div className="bg-white p-8 rounded">
          <h2 className="text-[20px] font-semibold leading-[28px] mb-6">Navigation Links: Interactive States</h2>
          
          <div className="mb-8">
            <h3 className="text-[16px] font-semibold mb-4" style={{ color: 'var(--zsgray-80)' }}>Dark Theme</h3>
            <div className="grid grid-cols-4 gap-6">
              <div>
                <h4 className="text-[12px] font-semibold mb-3 uppercase" style={{ color: 'var(--zsgray-60)' }}>DEFAULT</h4>
                <div className="w-20 h-20 flex items-center justify-center" style={{ backgroundColor: 'var(--zsgray-90)' }}>
                  <div className="flex flex-col items-center gap-1 text-white">
                    <Home size={24} />
                    <span className="text-[10px] font-semibold">NAV 1</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[12px] font-semibold mb-3 uppercase" style={{ color: 'var(--zsgray-60)' }}>HOVER</h4>
                <div className="w-20 h-20 flex items-center justify-center" style={{ backgroundColor: 'var(--zsgray-80)' }}>
                  <div className="flex flex-col items-center gap-1 text-white">
                    <Home size={24} />
                    <span className="text-[10px] font-semibold">NAV 1</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[12px] font-semibold mb-3 uppercase" style={{ color: 'var(--zsgray-60)' }}>ACTIVE</h4>
                <div className="w-20 h-20 flex items-center justify-center" style={{ backgroundColor: 'var(--zsteal-80)' }}>
                  <div className="flex flex-col items-center gap-1 text-white">
                    <Home size={24} />
                    <span className="text-[10px] font-semibold">NAV 1</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[12px] font-semibold mb-3 uppercase" style={{ color: 'var(--zsgray-60)' }}>FOCUSED</h4>
                <div className="w-20 h-20 flex items-center justify-center ring-2 ring-offset-2" style={{ backgroundColor: 'var(--zsgray-90)', ringColor: 'var(--zsteal-80)' }}>
                  <div className="flex flex-col items-center gap-1 text-white">
                    <Home size={24} />
                    <span className="text-[10px] font-semibold">NAV 1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-[16px] font-semibold mb-4" style={{ color: 'var(--zsgray-80)' }}>Light Theme</h3>
            <div className="grid grid-cols-4 gap-6">
              <div>
                <h4 className="text-[12px] font-semibold mb-3 uppercase" style={{ color: 'var(--zsgray-60)' }}>DEFAULT</h4>
                <div className="w-20 h-20 flex items-center justify-center border" style={{ backgroundColor: 'white', borderColor: 'var(--zsgray-20)' }}>
                  <div className="flex flex-col items-center gap-1" style={{ color: 'var(--zsgray-70)' }}>
                    <Home size={24} />
                    <span className="text-[10px] font-semibold">NAV 1</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[12px] font-semibold mb-3 uppercase" style={{ color: 'var(--zsgray-60)' }}>HOVER</h4>
                <div className="w-20 h-20 flex items-center justify-center border" style={{ backgroundColor: 'var(--zsgray-10)', borderColor: 'var(--zsgray-20)' }}>
                  <div className="flex flex-col items-center gap-1" style={{ color: 'var(--zsgray-70)' }}>
                    <Home size={24} />
                    <span className="text-[10px] font-semibold">NAV 1</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[12px] font-semibold mb-3 uppercase" style={{ color: 'var(--zsgray-60)' }}>ACTIVE</h4>
                <div className="w-20 h-20 flex items-center justify-center border" style={{ backgroundColor: 'var(--zsteal-20)', borderColor: 'var(--zsgray-20)' }}>
                  <div className="flex flex-col items-center gap-1" style={{ color: 'var(--zsteal-80)' }}>
                    <Home size={24} />
                    <span className="text-[10px] font-semibold">NAV 1</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[12px] font-semibold mb-3 uppercase" style={{ color: 'var(--zsgray-60)' }}>FOCUSED</h4>
                <div className="w-20 h-20 flex items-center justify-center ring-2 ring-offset-2 border" style={{ backgroundColor: 'white', borderColor: 'var(--zsgray-20)', ringColor: 'var(--zsteal-80)' }}>
                  <div className="flex flex-col items-center gap-1" style={{ color: 'var(--zsgray-70)' }}>
                    <Home size={24} />
                    <span className="text-[10px] font-semibold">NAV 1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submenu Link States */}
        <div className="bg-white p-8 rounded">
          <h2 className="text-[20px] font-semibold leading-[28px] mb-6">Menu & Submenu Links: Interactive States</h2>
          
          <div className="mb-8">
            <h3 className="text-[16px] font-semibold mb-4" style={{ color: 'var(--zsgray-80)' }}>Dark Theme</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-[12px] font-semibold mb-3 uppercase" style={{ color: 'var(--zsgray-60)' }}>DEFAULT</h4>
                <div className="w-64" style={{ backgroundColor: 'var(--zsgray-90)' }}>
                  <button className="w-full flex items-center justify-between px-4 py-3 text-white">
                    <span className="text-[14px] leading-[20px]">SUBMENU ITEM 1</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-[12px] font-semibold mb-3 uppercase" style={{ color: 'var(--zsgray-60)' }}>HOVER</h4>
                <div className="w-64" style={{ backgroundColor: 'var(--zsgray-90)' }}>
                  <button className="w-full flex items-center justify-between px-4 py-3 text-white" style={{ backgroundColor: 'var(--zsgray-70)' }}>
                    <span className="text-[14px] leading-[20px]">SUBMENU ITEM 1</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-[12px] font-semibold mb-3 uppercase" style={{ color: 'var(--zsgray-60)' }}>ACTIVE</h4>
                <div className="w-64" style={{ backgroundColor: 'var(--zsgray-90)' }}>
                  <button className="w-full flex items-center justify-between px-4 py-3 text-white" style={{ backgroundColor: 'var(--zsgray-80)' }}>
                    <span className="text-[14px] leading-[20px]">SUBMENU ITEM 1</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-[12px] font-semibold mb-3 uppercase" style={{ color: 'var(--zsgray-60)' }}>FOCUSED</h4>
                <div className="w-64" style={{ backgroundColor: 'var(--zsgray-90)' }}>
                  <button className="w-full flex items-center justify-between px-4 py-3 text-white ring-2 ring-inset" style={{ ringColor: 'var(--zsteal-80)' }}>
                    <span className="text-[14px] leading-[20px]">SUBMENU ITEM 1</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-[16px] font-semibold mb-4" style={{ color: 'var(--zsgray-80)' }}>Light Theme</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-[12px] font-semibold mb-3 uppercase" style={{ color: 'var(--zsgray-60)' }}>DEFAULT</h4>
                <div className="w-64 border" style={{ backgroundColor: 'white', borderColor: 'var(--zsgray-20)' }}>
                  <button className="w-full flex items-center justify-between px-4 py-3" style={{ color: 'var(--zsgray-70)' }}>
                    <span className="text-[14px] leading-[20px]">SUBMENU ITEM 1</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-[12px] font-semibold mb-3 uppercase" style={{ color: 'var(--zsgray-60)' }}>HOVER</h4>
                <div className="w-64 border" style={{ backgroundColor: 'white', borderColor: 'var(--zsgray-20)' }}>
                  <button className="w-full flex items-center justify-between px-4 py-3" style={{ backgroundColor: 'var(--zsgray-10)', color: 'var(--zsgray-70)' }}>
                    <span className="text-[14px] leading-[20px]">SUBMENU ITEM 1</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-[12px] font-semibold mb-3 uppercase" style={{ color: 'var(--zsgray-60)' }}>ACTIVE</h4>
                <div className="w-64 border" style={{ backgroundColor: 'white', borderColor: 'var(--zsgray-20)' }}>
                  <button className="w-full flex items-center justify-between px-4 py-3" style={{ backgroundColor: 'var(--zsgray-10)', color: 'var(--zsteal-80)' }}>
                    <span className="text-[14px] leading-[20px]">SUBMENU ITEM 1</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-[12px] font-semibold mb-3 uppercase" style={{ color: 'var(--zsgray-60)' }}>FOCUSED</h4>
                <div className="w-64 border" style={{ backgroundColor: 'white', borderColor: 'var(--zsgray-20)' }}>
                  <button className="w-full flex items-center justify-between px-4 py-3 ring-2 ring-inset" style={{ color: 'var(--zsgray-70)', ringColor: 'var(--zsteal-80)' }}>
                    <span className="text-[14px] leading-[20px]">SUBMENU ITEM 1</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full Navigation Examples */}
        <div className="bg-white p-8 rounded">
          <h2 className="text-[20px] font-semibold leading-[28px] mb-6">Full Navigation Examples</h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-[16px] font-semibold mb-4" style={{ color: 'var(--zsgray-80)' }}>Dark Theme</h3>
              <div className="border rounded overflow-hidden" style={{ borderColor: 'var(--zsgray-20)', height: '600px' }}>
                <PrimaryNavigation theme="dark" />
              </div>
            </div>

            <div>
              <h3 className="text-[16px] font-semibold mb-4" style={{ color: 'var(--zsgray-80)' }}>Light Theme</h3>
              <div className="border rounded overflow-hidden" style={{ borderColor: 'var(--zsgray-20)', height: '600px' }}>
                <PrimaryNavigation theme="light" />
              </div>
            </div>

            <div>
              <h3 className="text-[16px] font-semibold mb-4" style={{ color: 'var(--zsgray-80)' }}>Dark Nav with Mixed Drawer (Dark Header + White Body)</h3>
              <div className="border rounded overflow-hidden" style={{ borderColor: 'var(--zsgray-20)', height: '600px' }}>
                <PrimaryNavigation theme="dark" drawerVariant="mixed" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default NavigationStatesDemo;