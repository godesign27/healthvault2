import { Settings, ChevronRight, Circle, BarChart3, Bell, Menu, Palette, Sparkles, Type, Square, ToggleLeft, Navigation, FileText, ChevronsUpDown, Calendar, PanelLeft, ChevronDown, CheckSquare, ShieldAlert, MessageSquare, ToggleRight, Tag as TagIcon, Folder, FolderKanban, Loader2, SlidersHorizontal, GitBranch, Wrench, Wand2, MessageCircle, Search as SearchIcon, RectangleHorizontal, Table2, Heart } from 'lucide-react';
import { useMemo } from 'react';
import { useTheme } from '../providers/ThemeProvider';

export type DesignSystemGallerySurface = 'default' | 'bold' | 'steel';

interface SidebarProps {
  currentPage: string;
  currentView: 'design-system' | 'projects' | 'health-vault' | 'marketing';
  onNavigate: (page: string) => void;
  onViewChange: (view: 'design-system' | 'projects' | 'health-vault' | 'marketing') => void;
  designSystemSurface?: DesignSystemGallerySurface;
  onDesignSystemSurfaceChange?: (surface: DesignSystemGallerySurface) => void;
}

export function Sidebar({
  currentPage,
  currentView,
  onNavigate,
  onViewChange,
  designSystemSurface = 'default',
  onDesignSystemSurfaceChange,
}: SidebarProps) {
  const { theme, setTheme } = useTheme();

  const resolvedHtmlTheme = useMemo((): 'light' | 'dark' => {
    if (theme === 'system') {
      return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return theme;
  }, [theme]);

  const headerLogoSrc =
    (currentView === 'design-system' && designSystemSurface === 'bold') || resolvedHtmlTheme === 'dark'
      ? '/hv_logo-dark.png'
      : '/hv_logo-light.png';

  const componentItems = [
    { id: 'accordions', label: 'Accordions', icon: ChevronsUpDown },
    { id: 'action-fields', label: 'Action Fields', icon: FileText },
    { id: 'breadcrumbs', label: 'Breadcrumbs', icon: Navigation },
    { id: 'buttons', label: 'Buttons', icon: Square },
    { id: 'cards', label: 'Cards', icon: RectangleHorizontal },
    { id: 'checkboxes', label: 'Checkboxes', icon: CheckSquare },
    { id: 'colors', label: 'Colors', icon: Palette },
    { id: 'date-picker', label: 'Date Picker', icon: Calendar },
    { id: 'dialogs', label: 'Dialogs', icon: MessageCircle },
    { id: 'drawers', label: 'Drawers', icon: PanelLeft },
    { id: 'dropdowns', label: 'Dropdowns', icon: ChevronDown },
    { id: 'headers', label: 'Headers', icon: ChevronRight },
    { id: 'icons', label: 'Icons', icon: Sparkles },
    { id: 'legacy-navigation', label: 'Navigation - Legacy', icon: Navigation },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'popup-menus', label: 'Pop-up Menus', icon: Menu },
    { id: 'primary-navigation', label: 'Primary Navigation', icon: Menu },
    { id: 'progress-bars', label: 'Progress Bars', icon: BarChart3 },
    { id: 'radio-buttons', label: 'Radio Buttons', icon: Circle },
    { id: 'search', label: 'Search', icon: SearchIcon },
    { id: 'segmented-control', label: 'Segmented Control', icon: ToggleLeft },
    { id: 'sliders', label: 'Sliders', icon: SlidersHorizontal },
    { id: 'spinners', label: 'Spinners', icon: Loader2 },
    { id: 'stepper', label: 'Stepper', icon: GitBranch },
    { id: 'tabs', label: 'Tabs', icon: Folder },
    { id: 'tables', label: 'Tables', icon: Table2 },
    { id: 'tags', label: 'Tags', icon: TagIcon },
    { id: 'toggles', label: 'Toggles', icon: ToggleRight },
    { id: 'toolbars', label: 'Toolbars', icon: Wrench },
    { id: 'tooltips', label: 'Tooltips', icon: MessageSquare },
    { id: 'typography', label: 'Typography', icon: Type },
    { id: 'validation', label: 'Validation', icon: ShieldAlert },
    { id: 'wizards', label: 'Wizards', icon: Wand2 }
  ];

  return (
    <div
      data-steel-chrome="sidebar"
      className="w-72 bg-surface-raised border-r border-stroke-subtle h-screen flex flex-col"
    >
      <div className="p-6 border-b border-stroke-subtle">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg overflow-hidden">
            <img
              src={headerLogoSrc}
              alt="Health Vault"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-base font-bold text-content-primary">Health Vault</h1>
            <p className="text-xs text-content-secondary">Design System</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onViewChange('projects')}
            className="flex items-center justify-center w-9 h-9 border border-stroke-subtle rounded-lg hover:bg-surface-sunken transition-colors"
            title="Projects"
          >
            <FolderKanban className="w-4 h-4 text-content-secondary" />
          </button>
          <button
            onClick={() => onViewChange('health-vault')}
            className="flex items-center justify-center w-9 h-9 border border-stroke-subtle rounded-lg hover:bg-surface-sunken transition-colors"
            title="Health Vault"
          >
            <Heart className="w-4 h-4 text-content-secondary" />
          </button>
          <button
            onClick={() => onViewChange('design-system')}
            className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
              currentView === 'design-system'
                ? 'bg-action-primary text-content-on-action shadow-sm'
                : 'border border-stroke-subtle hover:bg-surface-sunken'
            }`}
            title="Design System"
          >
            <Settings
              className={`w-4 h-4 ${currentView === 'design-system' ? 'text-content-on-action' : 'text-content-secondary'}`}
            />
          </button>
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        {(currentView === 'design-system' || currentView === 'projects') && (
          <div className="mb-5 px-1">
            <div className="text-xs font-semibold text-content-secondary uppercase tracking-wide px-2 mb-2">
              Color mode
            </div>
            <div className="flex rounded-lg border border-stroke-subtle p-0.5 bg-surface-sunken gap-0.5">
              {(['light', 'dark', 'system'] as const).map((mode) => {
                const selected = theme === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    title={
                      mode === 'light' ? 'Light' : mode === 'dark' ? 'Dark' : 'Match system'
                    }
                    onClick={() => setTheme(mode)}
                    className={`flex-1 rounded-md px-1.5 py-1.5 text-xs font-medium transition-colors capitalize ${
                      selected
                        ? 'bg-surface-raised text-content-primary shadow-sm ring-1 ring-stroke-subtle'
                        : 'text-content-secondary hover:text-content-primary'
                    }`}
                  >
                    {mode === 'system' ? 'Auto' : mode}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {currentView === 'design-system' && onDesignSystemSurfaceChange && (
          <div className="mb-5 px-1">
            <div className="text-xs font-semibold text-content-secondary uppercase tracking-wide px-2 mb-2">
              Surface theme
            </div>
            <div className="flex flex-wrap gap-0.5 rounded-lg border border-stroke-subtle p-0.5 bg-surface-sunken">
              {(
                [
                  { id: 'default' as const, label: 'Default', hint: 'Standard UI' },
                  { id: 'bold' as const, label: 'Bold', hint: 'Dark brand' },
                  { id: 'steel' as const, label: 'Steel', hint: 'Frosted glass' },
                ] as const
              ).map((opt) => {
                const selected = designSystemSurface === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    title={opt.hint}
                    onClick={() => onDesignSystemSurfaceChange(opt.id)}
                    className={`min-w-[4.25rem] flex-1 rounded-md px-1.5 py-1.5 text-xs font-medium transition-colors ${
                      selected
                        ? 'bg-surface-raised text-content-primary shadow-sm ring-1 ring-stroke-subtle'
                        : 'text-content-secondary hover:text-content-primary'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {currentView === 'design-system' && (
        <div className="space-y-1">
          <div className="text-xs font-semibold text-content-secondary uppercase tracking-wide px-3 mb-2">
            Components
          </div>
          {componentItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  if (currentView !== 'design-system') {
                    onViewChange('design-system');
                  }
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive ? 'bg-action-primary-subtle text-content-primary ring-1 ring-inset ring-stroke-default' : 'text-content-primary hover:bg-surface-sunken'}
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
        )}

        {currentView === 'projects' && (
          <div className="px-4 py-2">
            <div className="text-sm text-content-secondary">
              View your projects in the main area
            </div>
          </div>
        )}
      </nav>

      <div className="sticky bottom-0 bg-surface-raised">
        <div className="border-t border-stroke-subtle p-4">
          <button
            onClick={() => onNavigate('admin')}
            className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${currentPage === 'admin' ? 'bg-action-primary-subtle text-content-primary ring-1 ring-inset ring-stroke-default' : 'text-content-primary hover:bg-surface-sunken'}
            `}
          >
            <Settings className="w-4 h-4" />
            <span>Admin Panel</span>
          </button>
        </div>

        <div className="p-4 border-t border-stroke-subtle">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-surface-sunken rounded-full flex-shrink-0">
              <span className="text-sm font-bold text-content-primary">TM</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-content-primary truncate">Timothy McGuire</p>
              <p className="text-xs text-content-secondary truncate">Version 1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
