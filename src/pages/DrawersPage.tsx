import { Drawer, DrawerTrigger } from '../components/ui/Drawer';
import { useState } from 'react';
import { Menu, Image } from 'lucide-react';

export function DrawersPage() {
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [topDrawerOpen, setTopDrawerOpen] = useState(false);
  const [bottomDrawerOpen, setBottomDrawerOpen] = useState(false);
  const [leftDrawerWithFooter, setLeftDrawerWithFooter] = useState(false);
  const [rightDrawerWithFooter, setRightDrawerWithFooter] = useState(false);

  const sampleContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-center py-12 text-content-tertiary bg-[#FEF6E8] rounded">
        <div className="text-center">
          <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Replace Me</p>
        </div>
      </div>
      <p className="text-sm text-content-secondary">
        This is sample drawer content. You can add any content here including forms, lists, or other components.
      </p>
    </div>
  );

  return (
    <div className="w-full min-h-0">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-content-primary mb-2">Drawers</h1>
          <p className="text-content-secondary">
            Slide-in panels for displaying contextual information or forms
          </p>
        </div>

        <div className="space-y-8">
          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Master Components</h2>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-content-secondary mb-4">Trigger Button</h3>
                <div className="flex gap-4">
                  <DrawerTrigger onClick={() => {}}>
                    <Menu className="w-6 h-6" />
                  </DrawerTrigger>
                  <DrawerTrigger onClick={() => {}}>
                    <span className="text-sm font-medium">Open Drawer</span>
                  </DrawerTrigger>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-content-secondary mb-4">Sample Content Area</h3>
                <div className="flex items-center justify-center py-8 bg-[#FEF6E8] rounded border-2 border-dashed border-stroke-default">
                  <div className="text-center">
                    <Image className="w-10 h-10 mx-auto mb-2 opacity-50 text-content-tertiary" />
                    <p className="text-xs text-content-tertiary">Replace Me</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Drawer Positions</h2>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-content-secondary mb-4">Drawer Left (Left Shadow)</h3>
                <p className="text-sm text-content-secondary mb-4">Drawers from Left or Right</p>
                <button
                  onClick={() => setLeftDrawerOpen(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-[indigo-600] rounded hover:bg-[indigo-700] transition-colors"
                >
                  Open Left Drawer
                </button>
                <Drawer
                  isOpen={leftDrawerOpen}
                  onClose={() => setLeftDrawerOpen(false)}
                  position="left"
                  title="Drawer Title"
                >
                  {sampleContent}
                </Drawer>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-content-secondary mb-4">Drawer Right (Right Shadow)</h3>
                <p className="text-sm text-content-secondary mb-4">Drawers from Left or Right</p>
                <button
                  onClick={() => setRightDrawerOpen(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-[indigo-600] rounded hover:bg-[indigo-700] transition-colors"
                >
                  Open Right Drawer
                </button>
                <Drawer
                  isOpen={rightDrawerOpen}
                  onClose={() => setRightDrawerOpen(false)}
                  position="right"
                  title="Drawer Title"
                >
                  {sampleContent}
                </Drawer>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-content-secondary mb-4">Drawer Top (Top Shadow)</h3>
                <p className="text-sm text-content-secondary mb-4">Drawers from Top or Bottom</p>
                <button
                  onClick={() => setTopDrawerOpen(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-[indigo-600] rounded hover:bg-[indigo-700] transition-colors"
                >
                  Open Top Drawer
                </button>
                <Drawer
                  isOpen={topDrawerOpen}
                  onClose={() => setTopDrawerOpen(false)}
                  position="top"
                  title="Drawer Title"
                >
                  {sampleContent}
                </Drawer>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-content-secondary mb-4">Drawer Bottom (Bottom Shadow)</h3>
                <p className="text-sm text-content-secondary mb-4">Drawers from Top or Bottom</p>
                <button
                  onClick={() => setBottomDrawerOpen(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-[indigo-600] rounded hover:bg-[indigo-700] transition-colors"
                >
                  Open Bottom Drawer
                </button>
                <Drawer
                  isOpen={bottomDrawerOpen}
                  onClose={() => setBottomDrawerOpen(false)}
                  position="bottom"
                  title="Drawer Title"
                >
                  {sampleContent}
                </Drawer>
              </div>
            </div>
          </section>

          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Drawers with Footer</h2>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-content-secondary mb-4">Left Drawer with Footer</h3>
                <p className="text-sm text-content-secondary mb-4">Action buttons at the bottom</p>
                <button
                  onClick={() => setLeftDrawerWithFooter(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-[indigo-600] rounded hover:bg-[indigo-700] transition-colors"
                >
                  Open Left Drawer with Footer
                </button>
                <Drawer
                  isOpen={leftDrawerWithFooter}
                  onClose={() => setLeftDrawerWithFooter(false)}
                  position="left"
                  title="Drawer Title"
                  showFooter={true}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-center py-12 text-content-tertiary bg-[#FEF6E8] rounded">
                      <div className="text-center">
                        <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Replace Me</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-content-secondary mb-2">
                        Input Field
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border-2 border-stroke-default rounded focus:border-[indigo-600] focus:outline-none"
                        placeholder="Enter text..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-content-secondary mb-2">
                        Textarea
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border-2 border-stroke-default rounded focus:border-[indigo-600] focus:outline-none"
                        rows={4}
                        placeholder="Enter description..."
                      />
                    </div>
                  </div>
                </Drawer>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-content-secondary mb-4">Right Drawer with Footer</h3>
                <p className="text-sm text-content-secondary mb-4">Action buttons at the bottom</p>
                <button
                  onClick={() => setRightDrawerWithFooter(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-[indigo-600] rounded hover:bg-[indigo-700] transition-colors"
                >
                  Open Right Drawer with Footer
                </button>
                <Drawer
                  isOpen={rightDrawerWithFooter}
                  onClose={() => setRightDrawerWithFooter(false)}
                  position="right"
                  title="Drawer Title"
                  showFooter={true}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-center py-12 text-content-tertiary bg-[#FEF6E8] rounded">
                      <div className="text-center">
                        <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Replace Me</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-content-secondary mb-2">
                        Input Field
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border-2 border-stroke-default rounded focus:border-[indigo-600] focus:outline-none"
                        placeholder="Enter text..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-content-secondary mb-2">
                        Textarea
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border-2 border-stroke-default rounded focus:border-[indigo-600] focus:outline-none"
                        rows={4}
                        placeholder="Enter description..."
                      />
                    </div>
                  </div>
                </Drawer>
              </div>
            </div>
          </section>

          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Component Structure</h2>

            <div className="space-y-6 text-content-secondary">
              <div>
                <h3 className="font-semibold mb-2 text-lg">Header</h3>
                <p className="text-sm mb-2">Contains the drawer title and close button</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Title text (left-aligned)</li>
                  <li>Close X button (right-aligned)</li>
                  <li>Bottom border separator</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Content Area</h3>
                <p className="text-sm mb-2">Scrollable area for main content</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Vertically scrollable when content overflows</li>
                  <li>Scrollbar positioned based on drawer direction (left/right/top/bottom)</li>
                  <li>4px border-width scrollbar indicator</li>
                  <li>Padding for content spacing</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Footer (Optional)</h3>
                <p className="text-sm mb-2">Action buttons or additional controls</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Cancel button (secondary style)</li>
                  <li>Save/Submit button (primary style)</li>
                  <li>Right-aligned button group</li>
                  <li>Top border separator</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Usage Guidelines</h2>

            <div className="space-y-6 text-content-secondary">
              <div>
                <h3 className="font-semibold mb-2 text-lg">When to Use</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>For displaying additional information without leaving the current page</li>
                  <li>To show forms or settings panels</li>
                  <li>For navigation menus on mobile devices</li>
                  <li>When content needs to be accessed frequently but not always visible</li>
                  <li>To provide contextual actions or details about selected items</li>
                  <li>For multi-step workflows that require focus</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Positions</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Left:</strong> Navigation menus, filters, or primary actions (most common for LTR languages)</li>
                  <li><strong className="text-[indigo-600]">Right:</strong> Details panels, forms, or secondary content</li>
                  <li><strong className="text-[indigo-600]">Top:</strong> Notifications, banners, or temporary messages</li>
                  <li><strong className="text-[indigo-600]">Bottom:</strong> Mobile sheets, action menus, or quick actions</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Sizes</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Default (320px):</strong> Standard width for most content</li>
                  <li><strong className="text-[indigo-600]">Large (384px):</strong> For forms with more fields or detailed content</li>
                  <li><strong className="text-[indigo-600]">Custom:</strong> Adjust based on content requirements</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Best Practices</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Always provide a clear title that describes the drawer content</li>
                  <li>Include a visible close button (X) in the header</li>
                  <li>Allow closing by clicking the overlay background</li>
                  <li>Support ESC key to close the drawer</li>
                  <li>Use smooth slide-in/out animations (300ms duration)</li>
                  <li>Display a semi-transparent overlay behind the drawer</li>
                  <li>Prevent body scrolling when drawer is open</li>
                  <li>Position scrollbar indicator based on drawer direction</li>
                  <li>Use footer for forms requiring submit/cancel actions</li>
                  <li>Keep content focused and relevant to the task</li>
                  <li>Don't nest drawers within drawers</li>
                  <li>Ensure drawer content is responsive on mobile</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Behavior</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Opening:</strong> Slides in from the specified position with smooth animation</li>
                  <li><strong className="text-[indigo-600]">Closing:</strong> Can be closed via X button, overlay click, or ESC key</li>
                  <li><strong className="text-[indigo-600]">Overlay:</strong> Semi-transparent background that blocks interaction with main content</li>
                  <li><strong className="text-[indigo-600]">Scrolling:</strong> Content area scrolls independently when content overflows</li>
                  <li><strong className="text-[indigo-600]">Focus:</strong> Focus should move into the drawer when opened</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Accessibility</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Use proper ARIA attributes (role="dialog", aria-modal="true")</li>
                  <li>Manage focus trap within the drawer</li>
                  <li>Announce drawer opening to screen readers</li>
                  <li>Support keyboard navigation (Tab, Shift+Tab, ESC)</li>
                  <li>Ensure sufficient color contrast for all text</li>
                  <li>Make close button large enough for easy interaction</li>
                  <li>Provide clear labels for all interactive elements</li>
                  <li>Restore focus to trigger element when drawer closes</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Content Guidelines</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Use clear, concise titles that describe the drawer purpose</li>
                  <li>Organize content with proper hierarchy and spacing</li>
                  <li>Group related information together</li>
                  <li>Use form validation for input fields</li>
                  <li>Provide clear feedback for actions taken within the drawer</li>
                  <li>Consider loading states for dynamic content</li>
                  <li>Use appropriate empty states when no content is available</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
