import { Home, Calendar, Search, Palette, Maximize2, ChevronDown } from 'lucide-react';
import { Toolbar, defaultToolbarActions } from '../components/ui/Toolbar';

export function ToolbarsPage() {
  const iconOnlyActions = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home className="w-5 h-5" />,
      onClick: () => console.log('Home clicked')
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: <Calendar className="w-5 h-5" />,
      onClick: () => console.log('Calendar clicked')
    },
    {
      id: 'search',
      label: 'Search',
      icon: <Search className="w-5 h-5" />,
      onClick: () => console.log('Search clicked')
    },
    {
      id: 'palette',
      label: 'Palette',
      icon: <Palette className="w-5 h-5" />,
      onClick: () => console.log('Palette clicked')
    },
    {
      id: 'territory',
      label: 'Territory',
      icon: <Maximize2 className="w-5 h-5" />,
      onClick: () => console.log('Territory clicked')
    }
  ];

  const dropdownActions = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home className="w-5 h-5" />,
      variant: 'dropdown' as const,
      onClick: () => console.log('Home clicked')
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: <Calendar className="w-5 h-5" />,
      variant: 'dropdown' as const,
      onClick: () => console.log('Calendar clicked')
    },
    {
      id: 'territory',
      label: 'Territory',
      icon: <Maximize2 className="w-5 h-5" />,
      onClick: () => console.log('Territory clicked')
    },
    {
      id: 'search',
      label: 'Search',
      icon: <Search className="w-5 h-5" />,
      onClick: () => console.log('Search clicked')
    },
    {
      id: 'palette',
      label: 'Palette',
      icon: <Palette className="w-5 h-5" />,
      variant: 'dropdown' as const,
      onClick: () => console.log('Palette clicked')
    }
  ];

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Toolbars</h1>
          <p className="text-gray-600">
            Action bars and icon groups for quick access to common functions
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Interactive Examples</h2>

          <div className="space-y-12">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Horizontal Toolbars - Light</h3>
              <div className="space-y-8">
                <div>
                  <p className="text-sm text-gray-600 mb-4">Default with Right Label</p>
                  <Toolbar actions={defaultToolbarActions} variant="light" showLabels={true} />
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-4">Label Below Icons</p>
                  <Toolbar actions={defaultToolbarActions} variant="light" showLabels={true} />
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-4">Icons Only</p>
                  <Toolbar actions={iconOnlyActions} variant="light" showLabels={false} />
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-4">Default with Chart</p>
                  <Toolbar actions={dropdownActions} variant="light" showLabels={true} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Horizontal Toolbars - Dark</h3>
              <div className="space-y-8">
                <div>
                  <p className="text-sm text-gray-600 mb-4">Default with Right Label</p>
                  <Toolbar actions={defaultToolbarActions} variant="dark" showLabels={true} />
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-4">Label Below Icons</p>
                  <Toolbar actions={defaultToolbarActions} variant="dark" showLabels={true} />
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-4">Icons Only</p>
                  <Toolbar actions={iconOnlyActions} variant="dark" showLabels={false} />
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-4">Default with Chart</p>
                  <Toolbar actions={dropdownActions} variant="dark" showLabels={true} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vertical Toolbars</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                  <p className="text-sm text-gray-600 mb-4">Light - Icons Only</p>
                  <Toolbar
                    actions={iconOnlyActions}
                    orientation="vertical"
                    variant="light"
                    showLabels={false}
                  />
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-4">Dark - Icons Only</p>
                  <Toolbar
                    actions={iconOnlyActions}
                    orientation="vertical"
                    variant="dark"
                    showLabels={false}
                  />
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-4">Light - With Labels</p>
                  <Toolbar
                    actions={defaultToolbarActions}
                    orientation="vertical"
                    variant="light"
                    showLabels={true}
                  />
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-4">Dark - With Labels</p>
                  <Toolbar
                    actions={defaultToolbarActions}
                    orientation="vertical"
                    variant="dark"
                    showLabels={true}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Icon Link States</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-6 gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-xs text-gray-500 uppercase">Default</p>
                    <button className="w-12 h-12 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50">
                      <Home className="w-5 h-5 text-gray-700" />
                    </button>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <p className="text-xs text-gray-500 uppercase">Hover</p>
                    <button className="w-12 h-12 flex items-center justify-center bg-[indigo-600] rounded">
                      <Home className="w-5 h-5 text-white" />
                    </button>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <p className="text-xs text-gray-500 uppercase">Selected</p>
                    <button className="w-12 h-12 flex items-center justify-center bg-[indigo-600] rounded">
                      <Home className="w-5 h-5 text-white" />
                    </button>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <p className="text-xs text-gray-500 uppercase">Pressed</p>
                    <button className="w-12 h-12 flex items-center justify-center bg-[#0D3D47] rounded">
                      <Home className="w-5 h-5 text-white" />
                    </button>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <p className="text-xs text-gray-500 uppercase">Disabled</p>
                    <button className="w-12 h-12 flex items-center justify-center border border-gray-200 rounded cursor-not-allowed" disabled>
                      <Home className="w-5 h-5 text-gray-300" />
                    </button>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <p className="text-xs text-gray-500 uppercase">Focused</p>
                    <button className="w-12 h-12 flex items-center justify-center border-2 border-[indigo-600] rounded">
                      <Home className="w-5 h-5 text-[indigo-600]" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <button className="px-4 py-2 flex items-center gap-2 border border-gray-300 rounded hover:bg-gray-50">
                      <Home className="w-5 h-5" />
                      <span className="text-sm">Name</span>
                    </button>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <button className="px-4 py-2 flex items-center gap-2 bg-[indigo-600] text-white rounded">
                      <Home className="w-5 h-5" />
                      <span className="text-sm">Name</span>
                    </button>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <button className="px-4 py-2 flex items-center gap-2 bg-[indigo-600] text-white rounded">
                      <Home className="w-5 h-5" />
                      <span className="text-sm">Name</span>
                    </button>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <button className="px-4 py-2 flex items-center gap-2 bg-[#0D3D47] text-white rounded">
                      <Home className="w-5 h-5" />
                      <span className="text-sm">Name</span>
                    </button>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <button className="px-4 py-2 flex items-center gap-2 border border-gray-200 text-gray-300 rounded cursor-not-allowed" disabled>
                      <Home className="w-5 h-5" />
                      <span className="text-sm">Name</span>
                    </button>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <button className="px-4 py-2 flex items-center gap-2 border-2 border-[indigo-600] text-[indigo-600] rounded">
                      <Home className="w-5 h-5" />
                      <span className="text-sm">Name</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Usage Guidelines</h2>
          <div className="prose max-w-none">
            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">When to Use</h3>
            <ul className="text-gray-600 space-y-2">
              <li>For frequently accessed actions and tools</li>
              <li>When you need to group related actions together</li>
              <li>To provide quick access to common functionality</li>
              <li>In applications with multiple tools or modes</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Best Practices</h3>
            <ul className="text-gray-600 space-y-2">
              <li>Use clear, recognizable icons that match user expectations</li>
              <li>Group related actions together logically</li>
              <li>Provide tooltips for icon-only toolbars</li>
              <li>Use consistent icon sizes and spacing</li>
              <li>Consider using labels for better clarity, especially for less common actions</li>
              <li>Keep toolbars focused with 5-7 primary actions</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Accessibility</h3>
            <ul className="text-gray-600 space-y-2">
              <li>Ensure all toolbar buttons are keyboard accessible</li>
              <li>Provide clear focus indicators</li>
              <li>Use aria-labels for icon-only buttons</li>
              <li>Group related actions with proper ARIA attributes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
