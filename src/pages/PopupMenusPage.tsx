import { PopupMenu } from '../components/ui/PopupMenu';

export function PopupMenusPage() {
  const sampleMenuItems = [
    { label: 'Menu item 1', onClick: () => console.log('Item 1 clicked') },
    { label: 'Menu item 2', onClick: () => console.log('Item 2 clicked') },
    { label: 'Menu item 3', onClick: () => console.log('Item 3 clicked') },
    { label: 'Menu item 4', onClick: () => console.log('Item 4 clicked') },
    { label: 'Submenu', submenu: [] },
    { label: 'Menu item 5', onClick: () => console.log('Item 5 clicked') }
  ];

  const longMenuItems = [
    { label: 'Menu item 1', onClick: () => {} },
    { label: 'Menu item 2', onClick: () => {} },
    { label: 'Menu item 3', onClick: () => {} },
    { label: 'Menu item 4', onClick: () => {} },
    { label: 'Menu item 5', onClick: () => {} },
    { label: 'Menu item 6', onClick: () => {} },
    { label: 'Menu item 7', onClick: () => {} },
    { label: 'Menu item 8', onClick: () => {} },
    { label: 'Submenu', submenu: [] },
    { label: 'Menu item 9', onClick: () => {} },
    { label: 'Menu item 10', onClick: () => {} }
  ];

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Pop-up Menus</h1>
          <p className="text-gray-600">Context menus and dropdown menus for navigation and actions</p>
        </div>

        <div className="space-y-12">
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Size Variants</h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-4">Normal</h3>
                <PopupMenu size="normal" items={sampleMenuItems} />
                <p className="text-xs text-gray-500 mt-3">Default size, best for most use cases</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-4">Small</h3>
                <PopupMenu size="small" items={sampleMenuItems} />
                <p className="text-xs text-gray-500 mt-3">Compact interfaces, tight spaces</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-4">X-Small</h3>
                <PopupMenu size="xsmall" items={sampleMenuItems} />
                <p className="text-xs text-gray-500 mt-3">Dense layouts, minimal footprint</p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">With Scrollbar</h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-4">Normal</h3>
                <PopupMenu size="normal" items={longMenuItems} showScrollbar maxHeight="250px" />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-4">Small</h3>
                <PopupMenu size="small" items={longMenuItems} showScrollbar maxHeight="250px" />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-4">X-Small</h3>
                <PopupMenu size="xsmall" items={longMenuItems} showScrollbar maxHeight="250px" />
              </div>
            </div>

            <p className="text-sm text-gray-600 mt-6">
              When menu content exceeds the maximum height, a scrollbar appears automatically.
            </p>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Interactive States</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Hover State</h3>
                <div className="flex gap-4 items-start">
                  <PopupMenu
                    size="normal"
                    items={[
                      { label: 'Menu item 1', onClick: () => {} },
                      { label: 'Hovered item', onClick: () => {} },
                      { label: 'Menu item 3', onClick: () => {} }
                    ]}
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">
                      Hover over menu items to see the teal background highlight. The hover state provides
                      clear visual feedback for interactive elements.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">With Submenu Indicator</h3>
                <div className="flex gap-4 items-start">
                  <PopupMenu
                    size="normal"
                    items={[
                      { label: 'Menu item 1', onClick: () => {} },
                      { label: 'Open submenu', submenu: [] },
                      { label: 'Another submenu', submenu: [] },
                      { label: 'Menu item 4', onClick: () => {} }
                    ]}
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">
                      Items with submenus display a chevron icon on the right, indicating additional options
                      are available.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Usage Guidelines</h2>

            <div className="space-y-6 text-gray-700">
              <div>
                <h3 className="font-semibold mb-2">When to Use</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Context menus triggered by right-click or button press</li>
                  <li>Dropdown menus for navigation or actions</li>
                  <li>Lists of related actions for a specific item</li>
                  <li>Secondary navigation options</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Size Selection</h3>
                <div className="space-y-2 ml-2">
                  <div>
                    <strong>Normal:</strong> Default choice for most applications, good balance of readability
                    and space efficiency
                  </div>
                  <div>
                    <strong>Small:</strong> Use in compact interfaces, toolbars, or when space is limited
                  </div>
                  <div>
                    <strong>X-Small:</strong> Reserved for dense data displays or nested navigation where
                    minimal space is critical
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Best Practices</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Keep menu items concise and action-oriented</li>
                  <li>Group related items logically</li>
                  <li>Use submenus sparingly to avoid deep nesting</li>
                  <li>Limit menu height and use scrolling for long lists</li>
                  <li>Provide clear hover states for all interactive items</li>
                  <li>Consider keyboard navigation support</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Design Tokens</h3>
                <div className="grid md:grid-cols-2 gap-4 mt-3">
                  <div className="border border-gray-200 rounded p-4">
                    <div className="h-8 bg-[indigo-600] rounded mb-2 flex items-center px-3">
                      <span className="text-white text-sm">Hover State</span>
                    </div>
                    <p className="text-xs font-medium">Primary Teal</p>
                    <p className="text-xs text-gray-500 font-mono">indigo-600</p>
                  </div>
                  <div className="border border-gray-200 rounded p-4">
                    <div className="h-8 bg-white border border-gray-200 rounded mb-2 flex items-center px-3">
                      <span className="text-gray-700 text-sm">Default State</span>
                    </div>
                    <p className="text-xs font-medium">White Background</p>
                    <p className="text-xs text-gray-500 font-mono">#FFFFFF</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Accessibility</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Menus should be keyboard navigable</li>
                  <li>Use arrow keys to navigate menu items</li>
                  <li>Enter/Space to activate menu items</li>
                  <li>Escape to close menus</li>
                  <li>Focus states should be clearly visible</li>
                  <li>Submenu indicators must be perceivable</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
