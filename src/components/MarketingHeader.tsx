import { Menu, X, Eye, Globe, Moon, Sun, LogIn, LogOut, User } from 'lucide-react';
import { useState } from 'react';

interface MarketingHeaderProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onViewChange?: (view: 'health-vault' | 'design-system' | 'projects' | 'marketing') => void;
  onDirectHealthVaultAccess?: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  onGetStarted?: () => void;
  isAuthenticated?: boolean;
  currentView?: string;
}

export function MarketingHeader({
  currentPage,
  onPageChange,
  onViewChange,
  onDirectHealthVaultAccess,
  darkMode = false,
  onToggleDarkMode,
  onLoginClick,
  onLogoutClick,
  onGetStarted,
  isAuthenticated = false,
  currentView = 'marketing',
}: MarketingHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'personal-health-vault', label: 'Personal Health Vault' },
    { id: 'providers', label: 'Providers' },
    { id: 'security', label: 'Security' },
    { id: 'pricing', label: 'Pricing' },
  ];

  const viewButtons = [
    { id: 'health-vault', label: 'Dashboard', icon: Eye },
    { id: 'marketing', label: 'Marketing', icon: Globe },
  ];

  const handleNavClick = (id: string) => {
    onPageChange(id);
    setIsMobileMenuOpen(false);
  };

  const handleViewClick = (view: 'health-vault' | 'design-system' | 'projects' | 'marketing') => {
    if (view === 'health-vault' && onDirectHealthVaultAccess) {
      onDirectHealthVaultAccess();
    } else {
      onViewChange?.(view);
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className={`sticky top-0 z-50 border-b ${
        darkMode
          ? 'bg-surface-raised border-stroke-subtle'
          : 'bg-white border-stroke-subtle'
      }`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden">
                  <img
                    src={darkMode ? "/hv_logo-dark.png" : "/hv_logo-light.png"}
                    alt="Health Vault"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span className={`text-base font-bold ${
                    darkMode ? 'text-white' : 'text-content-primary'
                  }`}>Health Vault</span>
                </div>
              </div>

              <div className="hidden lg:flex items-center gap-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === item.id
                        ? darkMode
                          ? 'bg-surface-sunken text-white'
                          : 'bg-surface-sunken text-content-primary'
                        : darkMode
                        ? 'text-content-primary hover:bg-surface-sunken hover:text-white'
                        : 'text-content-secondary hover:bg-surface-sunken hover:text-content-primary'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isAuthenticated && (
                <>
                  <div className={`hidden md:flex items-center gap-1 mr-2 pr-3 border-r ${
                    darkMode ? 'border-stroke-default' : 'border-stroke-subtle'
                  }`}>
                    {viewButtons.map((view) => {
                      const Icon = view.icon;
                      const isActive = currentView === view.id;
                      return (
                        <button
                          key={view.id}
                          onClick={() => handleViewClick(view.id as any)}
                          className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
                            isActive
                              ? darkMode
                                ? 'bg-indigo-600 text-white'
                                : 'bg-indigo-600 text-white'
                              : darkMode
                              ? 'hover:bg-surface-sunken text-content-secondary'
                              : 'hover:bg-surface-sunken text-content-secondary'
                          }`}
                          title={view.label}
                        >
                          <Icon className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {onToggleDarkMode && (
                <button
                  onClick={onToggleDarkMode}
                  className={`hidden sm:flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
                    darkMode
                      ? 'hover:bg-surface-sunken text-content-secondary'
                      : 'hover:bg-surface-sunken text-content-secondary'
                  }`}
                  title={darkMode ? 'Light mode' : 'Dark mode'}
                >
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              )}

              {!isAuthenticated && (
                <>
                  {onLoginClick && (
                    <button
                      onClick={onLoginClick}
                      className={`hidden sm:block px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                        darkMode
                          ? 'text-content-primary hover:bg-surface-sunken'
                          : 'text-content-primary hover:bg-surface-sunken'
                      }`}
                    >
                      Log In
                    </button>
                  )}
                  {onGetStarted && (
                    <button
                      onClick={onGetStarted}
                      className="hidden sm:block px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                      Get Started
                    </button>
                  )}
                </>
              )}

              {isAuthenticated && (
                <div className={`hidden sm:flex items-center gap-2 pl-3 ml-3 border-l ${
                  darkMode ? 'border-stroke-default' : 'border-stroke-subtle'
                }`}>
                  <button
                    type="button"
                    onClick={() => handleViewClick('health-vault')}
                    aria-label="Open Health Dashboard"
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      darkMode
                        ? 'hover:bg-surface-sunken text-content-primary'
                        : 'hover:bg-surface-sunken text-content-primary'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      darkMode ? 'bg-surface-sunken' : 'bg-surface-overlay'
                    }`}>
                      <User className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold">Health Dashboard</span>
                  </button>
                  {onLogoutClick && (
                    <button
                      type="button"
                      onClick={onLogoutClick}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Log out
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`lg:hidden p-2 rounded-lg transition-colors ${
                  darkMode
                    ? 'hover:bg-surface-sunken text-content-secondary'
                    : 'hover:bg-surface-sunken text-content-secondary'
                }`}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {isMobileMenuOpen && (
        <div className={`lg:hidden border-b ${
          darkMode
            ? 'bg-surface-raised border-stroke-subtle'
            : 'bg-white border-stroke-subtle'
        }`}>
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === item.id
                    ? darkMode
                      ? 'bg-surface-sunken text-white'
                      : 'bg-surface-sunken text-content-primary'
                    : darkMode
                    ? 'text-content-primary hover:bg-surface-sunken'
                    : 'text-content-secondary hover:bg-surface-sunken'
                }`}
              >
                {item.label}
              </button>
            ))}

            {isAuthenticated && (
              <>
                <div className={`my-4 border-t ${
                  darkMode ? 'border-stroke-subtle' : 'border-stroke-subtle'
                }`}></div>
                <div className={`text-xs font-semibold uppercase tracking-wide px-4 mb-2 ${
                  darkMode ? 'text-content-secondary' : 'text-content-secondary'
                }`}>
                  Quick Access
                </div>
                {viewButtons.map((view) => {
                  const Icon = view.icon;
                  const isActive = currentView === view.id;
                  return (
                    <button
                      key={view.id}
                      onClick={() => handleViewClick(view.id as any)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? darkMode
                            ? 'bg-indigo-600 text-white'
                            : 'bg-indigo-600 text-white'
                          : darkMode
                          ? 'text-content-primary hover:bg-surface-sunken'
                          : 'text-content-secondary hover:bg-surface-sunken'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {view.label}
                    </button>
                  );
                })}
              </>
            )}

            {!isAuthenticated && (onLoginClick || onGetStarted) && (
              <>
                <div className={`my-4 border-t ${
                  darkMode ? 'border-stroke-subtle' : 'border-stroke-subtle'
                }`}></div>
                {onLoginClick && (
                  <button
                    onClick={onLoginClick}
                    className={`w-full px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors mb-2 ${
                      darkMode
                        ? 'text-content-primary hover:bg-surface-sunken border border-stroke-default'
                        : 'text-content-primary hover:bg-surface-sunken border border-stroke-default'
                    }`}
                  >
                    Log In
                  </button>
                )}
                {onGetStarted && (
                  <button
                    onClick={onGetStarted}
                    className="w-full px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    Get Started
                  </button>
                )}
              </>
            )}

            {isAuthenticated && (
              <>
                <div className={`my-4 border-t ${
                  darkMode ? 'border-stroke-subtle' : 'border-stroke-subtle'
                }`}></div>
                <button
                  type="button"
                  onClick={() => handleViewClick('health-vault')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    darkMode
                      ? 'text-content-primary hover:bg-surface-sunken'
                      : 'text-content-secondary hover:bg-surface-sunken'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    darkMode ? 'bg-surface-sunken' : 'bg-surface-overlay'
                  }`}>
                    <User className="w-4 h-4" />
                  </div>
                  <span>Health Dashboard</span>
                </button>
                {onLogoutClick && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onLogoutClick();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log out</span>
                  </button>
                )}
              </>
            )}

            {onToggleDarkMode && (
              <>
                <div className={`my-4 border-t sm:hidden ${
                  darkMode ? 'border-stroke-subtle' : 'border-stroke-subtle'
                }`}></div>
                <button
                  onClick={onToggleDarkMode}
                  className={`w-full sm:hidden flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    darkMode
                      ? 'text-content-primary hover:bg-surface-sunken'
                      : 'text-content-secondary hover:bg-surface-sunken'
                  }`}
                >
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {darkMode ? 'Light Mode' : 'Dark Mode'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
