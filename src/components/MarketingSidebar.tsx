import { Home, FileText, Shield, DollarSign, Newspaper, Mail, X, FolderOpen, Eye, Settings, Globe, Moon, Sun, LogIn, Lock } from 'lucide-react';

interface MarketingSidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onViewChange?: (view: 'health-vault' | 'design-system' | 'projects' | 'marketing') => void;
  onClose?: () => void;
  isMobile?: boolean;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  onLoginClick?: () => void;
  isAuthenticated?: boolean;
}

export function MarketingSidebar({ currentPage, onPageChange, onViewChange, onClose, isMobile = false, darkMode = false, onToggleDarkMode, onLoginClick, isAuthenticated = false }: MarketingSidebarProps) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'personal-health-vault', label: 'Personal Health Vault', icon: Lock },
    { id: 'whitepaper', label: 'Whitepaper', icon: FileText },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'how-to-buy', label: 'How to Buy', icon: DollarSign },
    { id: 'press', label: 'Press', icon: Newspaper },
    { id: 'contact', label: 'Contact', icon: Mail },
  ];

  const handleNavClick = (id: string) => {
    onPageChange(id);
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <aside className={`w-64 border-r flex flex-col h-full ${
      darkMode
        ? 'bg-surface-raised border-stroke-subtle'
        : 'bg-white border-stroke-subtle'
    }`}>
      <div className={`p-6 border-b ${
        darkMode ? 'border-stroke-subtle' : 'border-stroke-subtle'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg overflow-hidden">
              <img
                src={darkMode ? "/hv_logo-dark.png" : "/hv_logo-light.png"}
                alt="Health Vault"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className={`text-base font-bold ${
                darkMode ? 'text-white' : 'text-content-primary'
              }`}>Health Vault</h1>
              <p className={`text-xs ${
                darkMode ? 'text-content-secondary' : 'text-content-secondary'
              }`}>AI Medical Assistant</p>
            </div>
          </div>
          {isMobile && onClose && (
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-surface-sunken' : 'hover:bg-surface-sunken'
              }`}
            >
              <X className={`w-5 h-5 ${
                darkMode ? 'text-content-secondary' : 'text-content-secondary'
              }`} />
            </button>
          )}
        </div>

        {isAuthenticated && (
          <div className="flex gap-2">
            <button
              onClick={() => onViewChange?.('projects')}
              className={`flex items-center justify-center w-9 h-9 border rounded-lg transition-colors ${
                darkMode
                  ? 'border-stroke-default hover:bg-surface-sunken'
                  : 'border-stroke-subtle hover:bg-surface-sunken'
              }`}
              title="Projects"
            >
              <FolderOpen className={`w-4 h-4 ${
                darkMode ? 'text-content-secondary' : 'text-content-secondary'
              }`} />
            </button>
            <button
              onClick={() => onViewChange?.('health-vault')}
              className={`flex items-center justify-center w-9 h-9 border rounded-lg transition-colors ${
                darkMode
                  ? 'border-stroke-default hover:bg-surface-sunken'
                  : 'border-stroke-subtle hover:bg-surface-sunken'
              }`}
              title="Health Vault"
            >
              <Eye className={`w-4 h-4 ${
                darkMode ? 'text-content-secondary' : 'text-content-secondary'
              }`} />
            </button>
            <button
              onClick={() => onViewChange?.('design-system')}
              className={`flex items-center justify-center w-9 h-9 border rounded-lg transition-colors ${
                darkMode
                  ? 'border-stroke-default hover:bg-surface-sunken'
                  : 'border-stroke-subtle hover:bg-surface-sunken'
              }`}
              title="Design System"
            >
              <Settings className={`w-4 h-4 ${
                darkMode ? 'text-content-secondary' : 'text-content-secondary'
              }`} />
            </button>
            <button
              onClick={() => onViewChange?.('marketing')}
              className="flex items-center justify-center w-9 h-9 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              title="Marketing Site"
            >
              <Globe className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? darkMode
                        ? 'bg-indigo-900/50 text-indigo-300'
                        : 'bg-indigo-50 text-indigo-700'
                      : darkMode
                        ? 'text-content-primary hover:bg-surface-sunken'
                        : 'text-content-primary hover:bg-surface-sunken'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={`p-4 border-t ${
        darkMode ? 'border-stroke-subtle' : 'border-stroke-subtle'
      }`}>
        <button
          onClick={onToggleDarkMode}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors mb-3 ${
            darkMode
              ? 'text-content-primary hover:bg-surface-sunken'
              : 'text-content-primary hover:bg-surface-sunken'
          }`}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button
          onClick={onLoginClick}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            darkMode
              ? 'bg-indigo-900/50 text-indigo-300 hover:bg-indigo-900/70'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          <LogIn className="w-4 h-4" />
          Admin Login
        </button>
      </div>
    </aside>
  );
}
