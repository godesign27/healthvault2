import { SegmentedControl } from '../components/ui/SegmentedControl';

export function SegmentedControlPage() {
  return (
    <div className="w-full min-h-0">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-content-primary mb-2">Segmented Control</h1>
          <p className="text-content-secondary">
            Master components for segmented control with various states and configurations
          </p>
        </div>

        <div className="space-y-8">
          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Left - Solid - Normal</h2>

            <div className="space-y-6">
              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Default</div>
                <SegmentedControl
                  options={['Label', 'Label', 'Label']}
                  position="left"
                  variant="solid"
                  size="normal"
                />
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Hover</div>
                <SegmentedControl
                  options={['Label', 'Label', 'Label']}
                  position="left"
                  variant="solid"
                  size="normal"
                />
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Pressed</div>
                <SegmentedControl
                  options={['Label', 'Label', 'Label']}
                  position="left"
                  variant="solid"
                  size="normal"
                  value="Label"
                />
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Disabled</div>
                <SegmentedControl
                  options={['Label', 'Label', 'Label']}
                  position="left"
                  variant="solid"
                  size="normal"
                  disabled
                />
              </div>
            </div>
          </section>

          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Middle - Solid - Normal</h2>

            <div className="space-y-6">
              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Default</div>
                <SegmentedControl
                  options={['Label', 'Label', 'Label', 'Label']}
                  position="middle"
                  variant="solid"
                  size="normal"
                />
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Hover</div>
                <SegmentedControl
                  options={['Label', 'Label', 'Label', 'Label']}
                  position="middle"
                  variant="solid"
                  size="normal"
                />
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Pressed</div>
                <SegmentedControl
                  options={['Label', 'Label', 'Label', 'Label']}
                  position="middle"
                  variant="solid"
                  size="normal"
                  value="Label"
                />
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Disabled</div>
                <SegmentedControl
                  options={['Label', 'Label', 'Label', 'Label']}
                  position="middle"
                  variant="solid"
                  size="normal"
                  disabled
                />
              </div>
            </div>
          </section>

          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Right - Solid - Normal</h2>

            <div className="space-y-6">
              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Default</div>
                <SegmentedControl
                  options={['Label', 'Label', 'Label', 'Label']}
                  position="right"
                  variant="solid"
                  size="normal"
                />
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Hover</div>
                <SegmentedControl
                  options={['Label', 'Label', 'Label', 'Label']}
                  position="right"
                  variant="solid"
                  size="normal"
                />
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Pressed</div>
                <SegmentedControl
                  options={['Label', 'Label', 'Label', 'Label']}
                  position="right"
                  variant="solid"
                  size="normal"
                  value="Label"
                />
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Disabled</div>
                <SegmentedControl
                  options={['Label', 'Label', 'Label', 'Label']}
                  position="right"
                  variant="solid"
                  size="normal"
                  disabled
                />
              </div>
            </div>
          </section>

          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Outline - Normal</h2>

            <div className="space-y-6">
              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Default</div>
                <SegmentedControl
                  options={['Label', 'Label', 'Label']}
                  variant="outline"
                  size="normal"
                />
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Hover</div>
                <SegmentedControl
                  options={['Label', 'Label', 'Label']}
                  variant="outline"
                  size="normal"
                />
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Pressed</div>
                <SegmentedControl
                  options={['Label', 'Label', 'Label']}
                  variant="outline"
                  size="normal"
                  value="Label"
                />
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Disabled</div>
                <SegmentedControl
                  options={['Label', 'Label', 'Label']}
                  variant="outline"
                  size="normal"
                  disabled
                />
              </div>
            </div>
          </section>

          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Solid - Small</h2>

            <div className="space-y-6">
              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Default</div>
                <SegmentedControl
                  options={['Label', 'Label', 'Label', 'Label']}
                  variant="solid"
                  size="small"
                />
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Hover</div>
                <SegmentedControl
                  options={['Label', 'Label', 'Label', 'Label']}
                  variant="solid"
                  size="small"
                />
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Pressed</div>
                <SegmentedControl
                  options={['Label', 'Label', 'Label', 'Label']}
                  variant="solid"
                  size="small"
                  value="Label"
                />
              </div>
            </div>
          </section>

          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Outline - Small</h2>

            <div className="space-y-6">
              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Default</div>
                <SegmentedControl
                  options={['Label', 'Label', 'Label']}
                  variant="outline"
                  size="small"
                />
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Hover</div>
                <SegmentedControl
                  options={['Label', 'Label', 'Label']}
                  variant="outline"
                  size="small"
                />
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Pressed</div>
                <SegmentedControl
                  options={['Label', 'Label', 'Label']}
                  variant="outline"
                  size="small"
                  value="Label"
                />
              </div>
            </div>
          </section>

          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Solid - X-Small</h2>

            <div className="space-y-6">
              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Default</div>
                <SegmentedControl
                  options={['Label', 'Label', 'Label', 'Label']}
                  variant="solid"
                  size="x-small"
                />
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Hover</div>
                <SegmentedControl
                  options={['Label', 'Label', 'Label', 'Label']}
                  variant="solid"
                  size="x-small"
                />
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Pressed</div>
                <SegmentedControl
                  options={['Label', 'Label', 'Label', 'Label']}
                  variant="solid"
                  size="x-small"
                  value="Label"
                />
              </div>
            </div>
          </section>

          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Outline - X-Small</h2>

            <div className="space-y-6">
              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Default</div>
                <SegmentedControl
                  options={['Label', 'Label', 'Label']}
                  variant="outline"
                  size="x-small"
                />
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Hover</div>
                <SegmentedControl
                  options={['Label', 'Label', 'Label']}
                  variant="outline"
                  size="x-small"
                />
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Pressed</div>
                <SegmentedControl
                  options={['Label', 'Label', 'Label']}
                  variant="outline"
                  size="x-small"
                  value="Label"
                />
              </div>
            </div>
          </section>

          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Usage Guidelines</h2>

            <div className="space-y-6 text-content-secondary">
              <div>
                <h3 className="font-semibold mb-2 text-lg">When to Use</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>To switch between different views or filter content</li>
                  <li>When you have 2-5 mutually exclusive options</li>
                  <li>For settings that users toggle between frequently</li>
                  <li>In dashboard controls and data visualization filters</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Variants</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Solid:</strong> Default style with filled background for selected state</li>
                  <li><strong className="text-[indigo-600]">Outline:</strong> Border-only style for a lighter visual weight</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Sizes</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Normal:</strong> Default size for most use cases</li>
                  <li><strong className="text-[indigo-600]">Small:</strong> For compact interfaces or secondary controls</li>
                  <li><strong className="text-[indigo-600]">X-Small:</strong> For dense layouts or inline controls</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Positions</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Left:</strong> Rounded corners on the left side only</li>
                  <li><strong className="text-[indigo-600]">Middle:</strong> Rounded corners on both sides (default)</li>
                  <li><strong className="text-[indigo-600]">Right:</strong> Rounded corners on the right side only</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Best Practices</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Keep labels concise and clear</li>
                  <li>Use 2-5 options for optimal usability</li>
                  <li>Ensure all options are mutually exclusive</li>
                  <li>Default to the most common or recommended option</li>
                  <li>Use solid variant for primary controls, outline for secondary</li>
                  <li>Maintain consistent sizing within the same context</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Accessibility</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Ensure sufficient color contrast in all states</li>
                  <li>Use keyboard navigation (Tab to move between groups, Arrow keys within)</li>
                  <li>Provide clear visual feedback for selected state</li>
                  <li>Include aria-label for context when needed</li>
                  <li>Disable state should be visually distinct and non-interactive</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
