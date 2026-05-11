import { Home, Heart, FileText, ClipboardList, Activity, LogOut, Sun, Moon, Settings, Menu, Globe, User, ShieldCheck, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { ProfileSettingsDrawer } from './ProfileSettingsDrawer';
import { ToastContainer, ToastProps } from './Toast';
import { Tooltip } from './ui/Tooltip';
import { supabase } from '../lib/supabase';

interface DashboardSidebarProps {
  onViewChange?: (view: 'health-vault' | 'design-system' | 'projects' | 'marketing') => void;
  onPageChange?: (page: string) => void;
  currentPage?: string;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileMenuOpen?: boolean;
  onMobileMenuToggle?: () => void;
}

export function DashboardSidebar({
  onViewChange,
  onPageChange,
  currentPage = 'dashboard',
  darkMode = false,
  onToggleDarkMode,
  isCollapsed = false,
  onToggleCollapse,
  isMobileMenuOpen = false,
  onMobileMenuToggle
}: DashboardSidebarProps) {
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const [showViewsDropdown, setShowViewsDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleProfileSave = (data: { profilePhoto: string | null; firstName: string; lastName: string }) => {
    setProfilePhoto(data.profilePhoto);
    setFirstName(data.firstName);
    setLastName(data.lastName);

    const toast: ToastProps = {
      id: Date.now().toString(),
      type: 'success',
      message: 'Profile updated successfully',
      onClose: removeToast
    };
    setToasts(prev => [...prev, toast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onViewChange?.('marketing');
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        setUserEmail(session.user.email || '');

        const { data, error } = await supabase
          .from('user_profiles')
          .select('first_name, last_name, profile_photo_url')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setFirstName(data.first_name || '');
          setLastName(data.last_name || '');
          setProfilePhoto(data.profile_photo_url);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        onToggleCollapse?.();
      }
    };

    if (onToggleCollapse) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [onToggleCollapse]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowViewsDropdown(false);
      }
    };

    if (showViewsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showViewsDropdown]);

  const productItems = [
    { name: 'Dashboard', icon: Home, id: 'dashboard' },
    { name: 'Medical Profile', icon: User, id: 'medical-profile' },
    { name: 'Care', icon: Heart, id: 'care' },
    { name: 'Network', icon: Users, id: 'network' },
    { name: 'Insurance', icon: ShieldCheck, id: 'insurance' },
    { name: 'Health Records', icon: FileText, id: 'health-records' },
    { name: 'Medical Forms', icon: ClipboardList, id: 'medical-forms' },
    { name: 'Vitals', icon: Activity, id: 'vitals' }
  ];

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onMobileMenuToggle}
          aria-hidden="true"
        />
      )}

      <aside
        data-steel-chrome="sidebar"
        className={`
          border-r border-stroke-subtle flex flex-col transition-all duration-300 ease-in-out
          bg-surface-raised
          fixed lg:relative inset-y-0 left-0 z-50
          w-72 ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}
          transform lg:transform-none
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
        aria-label="Main navigation"
      >
      <div className={`border-b border-stroke-subtle ${isCollapsed ? 'p-4' : 'p-6'} transition-all duration-300`}>
        <div className={`flex items-center mb-6 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="flex items-center justify-center w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={darkMode ? "/hv_logo-dark.png" : "/hv_logo-light.png"}
              alt="Health Vault"
              className="w-full h-full object-contain"
            />
          </div>
          <div className={`
            transition-all duration-300 overflow-hidden
            ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}
          `}>
            <h1 className="text-base font-bold whitespace-nowrap text-content-primary">Health Vault</h1>
            <p className="text-xs whitespace-nowrap text-content-tertiary">AI Medical Assistant</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className={`transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-4'}`}>
          <div className="mb-4">
            {!isCollapsed && (
              <h3 className="text-xs font-semibold uppercase tracking-wide px-3 mb-2 transition-opacity duration-300 text-content-tertiary">
                Product
              </h3>
            )}
            <nav className="space-y-1" role="navigation" aria-label="Product pages">
              {productItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                const button = (
                  <button
                    key={item.name}
                    onClick={() => onPageChange?.(item.id)}
                    className={`
                      w-full flex items-center rounded-lg text-sm font-medium transition-all duration-300
                      ${isCollapsed ? 'justify-center px-3 py-2' : 'gap-3 px-3 py-2'}
                      ${isActive
                        ? 'bg-action-primary text-content-on-action'
                        : 'text-content-secondary hover:bg-action-secondary'
                      }
                    `}
                    aria-label={item.name}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className={`
                      transition-all duration-300 whitespace-nowrap overflow-hidden
                      ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}
                    `}>
                      {item.name}
                    </span>
                  </button>
                );

                return isCollapsed ? (
                  <Tooltip key={item.name} content={item.name} position="right" variant={darkMode ? 'default' : 'default'} className="w-full">
                    {button}
                  </Tooltip>
                ) : (
                  button
                );
              })}
            </nav>
          </div>

          <div>
            {!isCollapsed && (
              <h3 className="text-xs font-semibold uppercase tracking-wide px-3 mb-2 transition-opacity duration-300 text-content-tertiary">
                Account
              </h3>
            )}
            <nav className="space-y-1" role="navigation" aria-label="Account settings">
              {isCollapsed ? (
                <>
                  <div className="relative" ref={dropdownRef}>
                    <Tooltip content="Views" position="right" className="w-full">
                      <button
                        onClick={() => setShowViewsDropdown(!showViewsDropdown)}
                        className="
                          w-full flex items-center rounded-lg text-sm font-medium transition-all duration-300
                          justify-center px-3 py-2
                          text-content-secondary hover:bg-action-secondary
                        "
                        aria-label="Toggle views menu"
                        aria-expanded={showViewsDropdown}
                      >
                        <Menu className="w-4 h-4 flex-shrink-0" />
                      </button>
                    </Tooltip>
                    {showViewsDropdown && (
                      <div
                        className="absolute left-full ml-2 bottom-0 rounded-lg shadow-hv-card border border-stroke-default bg-surface-overlay w-48 overflow-hidden"
                        style={{ zIndex: 50 }}
                      >
                        <button
                          onClick={() => {
                            onViewChange?.('design-system');
                            setShowViewsDropdown(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-content-secondary hover:bg-action-secondary"
                        >
                          <Settings className="w-4 h-4 flex-shrink-0" />
                          <span>Design System</span>
                        </button>
                        <button
                          onClick={() => {
                            onViewChange?.('marketing');
                            setShowViewsDropdown(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-content-secondary hover:bg-action-secondary"
                        >
                          <Globe className="w-4 h-4 flex-shrink-0" />
                          <span>Marketing Site</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <Tooltip content="Log Out" position="right" className="w-full">
                    <button
                      onClick={handleSignOut}
                      className="
                        w-full flex items-center rounded-lg text-sm font-medium transition-all duration-300
                        justify-center px-3 py-2
                        text-content-secondary hover:bg-action-secondary
                      "
                      aria-label="Log Out"
                    >
                      <LogOut className="w-4 h-4 flex-shrink-0" />
                    </button>
                  </Tooltip>
                  <Tooltip content={darkMode ? 'Light Mode' : 'Dark Mode'} position="right" className="w-full">
                    <button
                      onClick={onToggleDarkMode}
                      className="
                        w-full flex items-center rounded-lg text-sm font-medium transition-all duration-300
                        justify-center px-3 py-2
                        text-content-secondary hover:bg-action-secondary
                      "
                      aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                      {darkMode ? <Sun className="w-4 h-4 flex-shrink-0" /> : <Moon className="w-4 h-4 flex-shrink-0" />}
                    </button>
                  </Tooltip>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onViewChange?.('design-system')}
                    className="
                      w-full flex items-center rounded-lg text-sm font-medium transition-all duration-300
                      gap-3 px-3 py-2
                      text-content-secondary hover:bg-action-secondary
                    "
                    aria-label="Design System"
                  >
                    <Settings className="w-4 h-4 flex-shrink-0" />
                    <span className="transition-all duration-300 whitespace-nowrap overflow-hidden w-auto opacity-100">
                      Design System
                    </span>
                  </button>
                  <button
                    onClick={() => onViewChange?.('marketing')}
                    className="
                      w-full flex items-center rounded-lg text-sm font-medium transition-all duration-300
                      gap-3 px-3 py-2
                      text-content-secondary hover:bg-action-secondary
                    "
                    aria-label="Marketing Site"
                  >
                    <Globe className="w-4 h-4 flex-shrink-0" />
                    <span className="transition-all duration-300 whitespace-nowrap overflow-hidden w-auto opacity-100">
                      Marketing Site
                    </span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="
                      w-full flex items-center rounded-lg text-sm font-medium transition-all duration-300
                      gap-3 px-3 py-2
                      text-content-secondary hover:bg-action-secondary
                    "
                    aria-label="Log Out"
                  >
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    <span className="transition-all duration-300 whitespace-nowrap overflow-hidden w-auto opacity-100">
                      Log Out
                    </span>
                  </button>
                  <button
                    onClick={onToggleDarkMode}
                    className="
                      w-full flex items-center rounded-lg text-sm font-medium transition-all duration-300
                      gap-3 px-3 py-2
                      text-content-secondary hover:bg-action-secondary
                    "
                    aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  >
                    {darkMode ? <Sun className="w-4 h-4 flex-shrink-0" /> : <Moon className="w-4 h-4 flex-shrink-0" />}
                    <span className="transition-all duration-300 whitespace-nowrap overflow-hidden w-auto opacity-100">
                      {darkMode ? 'Light Mode' : 'Dark Mode'}
                    </span>
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      </div>

      <div className="border-t border-stroke-subtle">
        {onToggleCollapse && (
          <div className="p-4 border-b border-stroke-subtle">
            {isCollapsed ? (
              <Tooltip content="Expand sidebar" position="right" className="w-full">
                <button
                  onClick={onToggleCollapse}
                  className="
                    w-full flex items-center rounded-lg text-sm font-medium transition-all duration-300
                    justify-center px-3 py-2
                    text-content-secondary hover:bg-action-secondary
                  "
                  aria-label="Expand sidebar"
                  aria-expanded={false}
                >
                  <ChevronRight className="w-4 h-4 flex-shrink-0" />
                </button>
              </Tooltip>
            ) : (
              <button
                onClick={onToggleCollapse}
                className="
                  w-full flex items-center rounded-lg text-sm font-medium transition-all duration-300
                  gap-3 px-3 py-2
                  text-content-secondary hover:bg-action-secondary
                "
                aria-label="Collapse sidebar"
                aria-expanded={true}
              >
                <ChevronLeft className="w-4 h-4 flex-shrink-0" />
                <span className="transition-all duration-300 whitespace-nowrap overflow-hidden">
                  Collapse
                </span>
              </button>
            )}
          </div>
        )}

        <div className={`transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-4'}`}>
          {isCollapsed ? (
            <Tooltip content={`${firstName} ${lastName}`} position="right" className="w-full">
              <button
                onClick={() => setShowProfileSettings(true)}
                className="
                  w-full flex items-center rounded-lg transition-all duration-300
                  justify-center p-0
                  hover:bg-action-secondary
                "
                aria-label="Open profile settings"
              >
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt={`${firstName} ${lastName}`}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 bg-surface-sunken">
                    <span className="text-sm font-bold text-content-secondary">{firstName[0]}{lastName[0]}</span>
                  </div>
                )}
              </button>
            </Tooltip>
          ) : (
            <button
              onClick={() => setShowProfileSettings(true)}
              className="
                w-full flex items-center rounded-lg transition-all duration-300
                gap-3 p-0
                hover:bg-action-secondary
              "
              aria-label="Open profile settings"
            >
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={`${firstName} ${lastName}`}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 bg-surface-sunken">
                  <span className="text-sm font-bold text-content-secondary">{firstName[0]}{lastName[0]}</span>
                </div>
              )}
              <div className="flex-1 min-w-0 transition-all duration-300 overflow-hidden w-auto opacity-100">
                <p className="text-sm font-semibold truncate whitespace-nowrap text-content-primary">{firstName} {lastName}</p>
                <p className="text-xs truncate whitespace-nowrap text-content-tertiary">{userEmail}</p>
              </div>
            </button>
          )}
        </div>
      </div>

      <ProfileSettingsDrawer
        isOpen={showProfileSettings}
        onClose={() => setShowProfileSettings(false)}
        darkMode={darkMode}
        onSave={handleProfileSave}
        onSignOut={handleSignOut}
      />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </aside>
    </>
  );
}
