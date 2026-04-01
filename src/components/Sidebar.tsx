import { Package, Settings, ChevronRight, Circle, BarChart3, Bell, Menu, Palette, Sparkles, Type, Square, ToggleLeft, Navigation, FileText, ChevronsUpDown, Calendar, PanelLeft, ChevronDown, CheckSquare, ShieldAlert, MessageSquare, ToggleRight, Tag as TagIcon, Folder, FolderKanban, Layers, Loader2, SlidersHorizontal, GitBranch, Wrench, Wand2, MessageCircle, Search as SearchIcon, RectangleHorizontal, Table2, Heart } from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  currentPage: string;
  currentView: 'design-system' | 'projects' | 'health-vault' | 'marketing';
  onNavigate: (page: string) => void;
  onViewChange: (view: 'design-system' | 'projects' | 'health-vault' | 'marketing') => void;
}

export function Sidebar({ currentPage, currentView, onNavigate, onViewChange }: SidebarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

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
    <div className="w-72 bg-white border-r border-stone-200 h-screen flex flex-col">
      <div className="p-6 border-b border-stone-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg overflow-hidden">
            <img
              src="/hv_logo-light.png"
              alt="Health Vault"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-base font-bold text-stone-900">Health Vault</h1>
            <p className="text-xs text-stone-500">Design System</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onViewChange('projects')}
            className="flex items-center justify-center w-9 h-9 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
            title="Projects"
          >
            <FolderKanban className="w-4 h-4 text-stone-600" />
          </button>
          <button
            onClick={() => onViewChange('health-vault')}
            className="flex items-center justify-center w-9 h-9 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
            title="Health Vault"
          >
            <Heart className="w-4 h-4 text-stone-600" />
          </button>
          <button
            onClick={() => onViewChange('design-system')}
            className="flex items-center justify-center w-9 h-9 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            title="Design System"
          >
            <Settings className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        {currentView === 'design-system' && (
        <div className="space-y-1">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide px-3 mb-2">
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
                  ${isActive ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-50'}
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
            <div className="text-sm text-gray-400">
              View your projects in the main area
            </div>
          </div>
        )}
      </nav>

      <div className="sticky bottom-0 bg-white">
        <div className="border-t border-stone-200 p-4">
          <button
            onClick={() => onNavigate('admin')}
            className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${currentPage === 'admin' ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-50'}
            `}
          >
            <Settings className="w-4 h-4" />
            <span>Admin Panel</span>
          </button>
        </div>

        <div className="p-4 border-t border-stone-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-stone-100 rounded-full flex-shrink-0">
              <span className="text-sm font-bold text-stone-700">TM</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-stone-900 truncate">Timothy McGuire</p>
              <p className="text-xs text-stone-500 truncate">Version 1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
