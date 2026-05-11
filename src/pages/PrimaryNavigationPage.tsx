import { PrimaryNavigation } from '../components/ui/PrimaryNavigation';
import { Home, FileText, Settings, Users, BarChart, HelpCircle, Package } from 'lucide-react';

export function PrimaryNavigationPage() {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'docs', label: 'Documentation', icon: FileText },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'help', label: 'Help', icon: HelpCircle }
  ];

  const navItemsWithSubmenu = [
    { id: 'home', label: 'Home', icon: Home },
    {
      id: 'docs',
      label: 'Documentation',
      icon: FileText,
      submenu: [
        { id: 'docs-1', label: 'Getting Started', icon: FileText },
        { id: 'docs-2', label: 'API Reference', icon: FileText },
        { id: 'docs-3', label: 'Examples', icon: FileText }
      ]
    },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      submenu: [
        { id: 'settings-1', label: 'Profile', icon: Settings },
        { id: 'settings-2', label: 'Security', icon: Settings },
        { id: 'settings-3', label: 'Notifications', icon: Settings }
      ]
    },
    { id: 'help', label: 'Help', icon: HelpCircle }
  ];

  return (
    <div className="w-full min-h-0">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-content-primary mb-2">Primary Navigation</h1>
          <p className="text-content-secondary">Sidebar navigation patterns for application layouts</p>
        </div>

        <div className="space-y-12">
          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Navigation Variants</h2>

            <div className="grid grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-content-secondary mb-4">Collapsed</h3>
                <div className="border border-stroke-subtle rounded-lg overflow-hidden" style={{ height: '600px' }}>
                  <PrimaryNavigation variant="collapsed" items={navItems} />
                </div>
                <p className="text-sm text-content-secondary mt-3">
                  Icon-only navigation for space-constrained layouts. Shows tooltips on hover.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-content-secondary mb-4">Expanded</h3>
                <div className="border border-stroke-subtle rounded-lg overflow-hidden" style={{ height: '600px' }}>
                  <PrimaryNavigation variant="expanded" items={navItemsWithSubmenu} />
                </div>
                <p className="text-sm text-content-secondary mt-3">
                  Full navigation with labels and expandable submenus for nested navigation.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-content-secondary mb-4">Sidebar</h3>
                <div className="border border-stroke-subtle rounded-lg overflow-hidden" style={{ height: '600px' }}>
                  <PrimaryNavigation variant="sidebar" items={navItems} />
                </div>
                <p className="text-sm text-content-secondary mt-3">
                  Standard sidebar navigation without expandable submenus.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Interactive States</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-content-secondary mb-4">Navigation Link States</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 px-4 py-3 rounded bg-surface-sunken">
                      <Package className="w-5 h-5 text-content-tertiary" />
                      <span className="text-sm text-content-tertiary">Default</span>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3 rounded bg-[#253847] text-white">
                      <Package className="w-5 h-5" />
                      <span className="text-sm">Hover</span>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#3D9199] text-white">
                      <Package className="w-5 h-5" />
                      <span className="text-sm font-medium">Active</span>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3 rounded bg-surface-sunken opacity-50">
                      <Package className="w-5 h-5 text-content-tertiary" />
                      <span className="text-sm text-content-tertiary">Disabled</span>
                    </div>
                  </div>
                  <div className="bg-[#1C2938] rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 px-4 py-3 rounded text-content-tertiary">
                        <Package className="w-5 h-5" />
                        <span className="text-sm">Default</span>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-3 rounded bg-[#253847] text-white">
                        <Package className="w-5 h-5" />
                        <span className="text-sm">Hover</span>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#3D9199] text-white">
                        <Package className="w-5 h-5" />
                        <span className="text-sm font-medium">Active</span>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-3 rounded text-content-secondary">
                        <Package className="w-5 h-5" />
                        <span className="text-sm">Disabled</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Usage Guidelines</h2>

            <div className="space-y-6 text-content-secondary">
              <div>
                <h3 className="font-semibold mb-2 text-lg">When to Use</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Primary navigation for multi-page applications</li>
                  <li>Persistent navigation that remains visible across pages</li>
                  <li>Hierarchical content structure with multiple levels</li>
                  <li>Applications with 5-10 main navigation items</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Variant Selection</h3>
                <div className="space-y-3 ml-2">
                  <div>
                    <strong className="text-[#3D9199]">Collapsed:</strong>
                    <p className="text-sm mt-1">
                      Use when screen space is limited or for power users who know the navigation well.
                      Best for desktop applications with frequent navigation.
                    </p>
                  </div>
                  <div>
                    <strong className="text-[#3D9199]">Expanded:</strong>
                    <p className="text-sm mt-1">
                      Default choice for most applications. Provides clear labels and supports nested navigation.
                      Best for applications with complex information architecture.
                    </p>
                  </div>
                  <div>
                    <strong className="text-[#3D9199]">Sidebar:</strong>
                    <p className="text-sm mt-1">
                      Simpler alternative without expandable sections. Use for flat navigation structures
                      or when all navigation items should be visible at once.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Best Practices</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Keep navigation items concise and action-oriented</li>
                  <li>Use meaningful icons that clearly represent their function</li>
                  <li>Limit top-level items to 7-10 for optimal usability</li>
                  <li>Group related items logically</li>
                  <li>Provide clear visual feedback for all interactive states</li>
                  <li>Maintain consistent navigation across the application</li>
                  <li>Consider mobile responsiveness (collapsed view for mobile)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Design Tokens</h3>
                <div className="grid md:grid-cols-3 gap-4 mt-3">
                  <div className="border border-stroke-subtle rounded p-4">
                    <div className="h-12 bg-[#1C2938] rounded mb-2"></div>
                    <p className="text-xs font-medium">Background</p>
                    <p className="text-xs text-content-secondary font-mono">#1C2938</p>
                  </div>
                  <div className="border border-stroke-subtle rounded p-4">
                    <div className="h-12 bg-[#3D9199] rounded mb-2"></div>
                    <p className="text-xs font-medium">Active State</p>
                    <p className="text-xs text-content-secondary font-mono">#3D9199</p>
                  </div>
                  <div className="border border-stroke-subtle rounded p-4">
                    <div className="h-12 bg-[#253847] rounded mb-2"></div>
                    <p className="text-xs font-medium">Hover State</p>
                    <p className="text-xs text-content-secondary font-mono">#253847</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Accessibility</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Navigation should be keyboard accessible (Tab, Enter, Arrow keys)</li>
                  <li>Active item should be clearly indicated for screen readers</li>
                  <li>Icons should have descriptive labels or tooltips</li>
                  <li>Maintain focus visibility for keyboard navigation</li>
                  <li>Use semantic HTML (nav, ul, li elements)</li>
                  <li>Provide skip navigation link for keyboard users</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
