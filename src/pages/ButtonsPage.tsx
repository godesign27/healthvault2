import { Button } from '../components/ui/Button';
import { Plus, Edit, Trash2 } from 'lucide-react';

export function ButtonsPage() {
  return (
    <div className="w-full min-h-0">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-content-primary mb-2">Buttons</h1>
          <p className="text-content-secondary">
            Master components for buttons with various sizes, variants, and states
          </p>
        </div>

        <div className="space-y-8">
          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Solid Button - Normal (55px)</h2>

            <div className="space-y-6">
              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Default</div>
                <div className="flex gap-4 flex-wrap">
                  <Button variant="solid" size="normal">+ Button</Button>
                  <Button variant="solid" size="normal" leftIcon={<Plus />}>Button</Button>
                  <Button variant="solid" size="normal" shape="circle" leftIcon={<Plus />}>+</Button>
                  <Button variant="solid" size="normal" shape="square" leftIcon={<Edit />}></Button>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Hover</div>
                <div className="flex gap-4 flex-wrap">
                  <Button variant="solid" size="normal">+ Button</Button>
                  <Button variant="solid" size="normal" leftIcon={<Plus />}>Button</Button>
                  <Button variant="solid" size="normal" shape="circle" leftIcon={<Plus />}>+</Button>
                  <Button variant="solid" size="normal" shape="square" leftIcon={<Edit />}></Button>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Pressed</div>
                <div className="flex gap-4 flex-wrap">
                  <Button variant="solid" size="normal">+ Button</Button>
                  <Button variant="solid" size="normal" leftIcon={<Plus />}>Button</Button>
                  <Button variant="solid" size="normal" shape="circle" leftIcon={<Plus />}>+</Button>
                  <Button variant="solid" size="normal" shape="square" leftIcon={<Edit />}></Button>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Disabled</div>
                <div className="flex gap-4 flex-wrap">
                  <Button variant="solid" size="normal" disabled>+ Button</Button>
                  <Button variant="solid" size="normal" disabled leftIcon={<Plus />}>Button</Button>
                  <Button variant="solid" size="normal" disabled shape="circle" leftIcon={<Plus />}>+</Button>
                  <Button variant="solid" size="normal" disabled shape="square" leftIcon={<Edit />}></Button>
                </div>
              </div>
            </div>
          </section>

          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Solid Button - Small (44px)</h2>

            <div className="space-y-6">
              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Default</div>
                <div className="flex gap-4 flex-wrap">
                  <Button variant="solid" size="small">+ Button</Button>
                  <Button variant="solid" size="small" leftIcon={<Plus />}>Button</Button>
                  <Button variant="solid" size="small" shape="circle" leftIcon={<Plus />}>+</Button>
                  <Button variant="solid" size="small" shape="square" leftIcon={<Edit />}></Button>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Hover</div>
                <div className="flex gap-4 flex-wrap">
                  <Button variant="solid" size="small">+ Button</Button>
                  <Button variant="solid" size="small" leftIcon={<Plus />}>Button</Button>
                  <Button variant="solid" size="small" shape="circle" leftIcon={<Plus />}>+</Button>
                  <Button variant="solid" size="small" shape="square" leftIcon={<Edit />}></Button>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Pressed</div>
                <div className="flex gap-4 flex-wrap">
                  <Button variant="solid" size="small">+ Button</Button>
                  <Button variant="solid" size="small" leftIcon={<Plus />}>Button</Button>
                  <Button variant="solid" size="small" shape="circle" leftIcon={<Plus />}>+</Button>
                  <Button variant="solid" size="small" shape="square" leftIcon={<Edit />}></Button>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Disabled</div>
                <div className="flex gap-4 flex-wrap">
                  <Button variant="solid" size="small" disabled>+ Button</Button>
                  <Button variant="solid" size="small" disabled leftIcon={<Plus />}>Button</Button>
                  <Button variant="solid" size="small" disabled shape="circle" leftIcon={<Plus />}>+</Button>
                  <Button variant="solid" size="small" disabled shape="square" leftIcon={<Edit />}></Button>
                </div>
              </div>
            </div>
          </section>

          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Solid Button - X-Small (38px)</h2>

            <div className="space-y-6">
              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Default</div>
                <div className="flex gap-4 flex-wrap">
                  <Button variant="solid" size="x-small">+ Button</Button>
                  <Button variant="solid" size="x-small" leftIcon={<Plus />}>Button</Button>
                  <Button variant="solid" size="x-small" shape="circle" leftIcon={<Plus />}>+</Button>
                  <Button variant="solid" size="x-small" shape="square" leftIcon={<Edit />}></Button>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Hover</div>
                <div className="flex gap-4 flex-wrap">
                  <Button variant="solid" size="x-small">+ Button</Button>
                  <Button variant="solid" size="x-small" leftIcon={<Plus />}>Button</Button>
                  <Button variant="solid" size="x-small" shape="circle" leftIcon={<Plus />}>+</Button>
                  <Button variant="solid" size="x-small" shape="square" leftIcon={<Edit />}></Button>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Pressed</div>
                <div className="flex gap-4 flex-wrap">
                  <Button variant="solid" size="x-small">+ Button</Button>
                  <Button variant="solid" size="x-small" leftIcon={<Plus />}>Button</Button>
                  <Button variant="solid" size="x-small" shape="circle" leftIcon={<Plus />}>+</Button>
                  <Button variant="solid" size="x-small" shape="square" leftIcon={<Edit />}></Button>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Disabled</div>
                <div className="flex gap-4 flex-wrap">
                  <Button variant="solid" size="x-small" disabled>+ Button</Button>
                  <Button variant="solid" size="x-small" disabled leftIcon={<Plus />}>Button</Button>
                  <Button variant="solid" size="x-small" disabled shape="circle" leftIcon={<Plus />}>+</Button>
                  <Button variant="solid" size="x-small" disabled shape="square" leftIcon={<Edit />}></Button>
                </div>
              </div>
            </div>
          </section>

          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Outline Button - Normal (55px)</h2>

            <div className="space-y-6">
              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Default</div>
                <div className="flex gap-4 flex-wrap">
                  <Button variant="outline" size="normal">+ Button</Button>
                  <Button variant="outline" size="normal" leftIcon={<Plus />}>Button</Button>
                  <Button variant="outline" size="normal" shape="circle" leftIcon={<Plus />}>+</Button>
                  <Button variant="outline" size="normal" shape="square" leftIcon={<Edit />}></Button>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Hover</div>
                <div className="flex gap-4 flex-wrap">
                  <Button variant="outline" size="normal">+ Button</Button>
                  <Button variant="outline" size="normal" leftIcon={<Plus />}>Button</Button>
                  <Button variant="outline" size="normal" shape="circle" leftIcon={<Plus />}>+</Button>
                  <Button variant="outline" size="normal" shape="square" leftIcon={<Edit />}></Button>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Pressed</div>
                <div className="flex gap-4 flex-wrap">
                  <Button variant="outline" size="normal">+ Button</Button>
                  <Button variant="outline" size="normal" leftIcon={<Plus />}>Button</Button>
                  <Button variant="outline" size="normal" shape="circle" leftIcon={<Plus />}>+</Button>
                  <Button variant="outline" size="normal" shape="square" leftIcon={<Edit />}></Button>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Disabled</div>
                <div className="flex gap-4 flex-wrap">
                  <Button variant="outline" size="normal" disabled>+ Button</Button>
                  <Button variant="outline" size="normal" disabled leftIcon={<Plus />}>Button</Button>
                  <Button variant="outline" size="normal" disabled shape="circle" leftIcon={<Plus />}>+</Button>
                  <Button variant="outline" size="normal" disabled shape="square" leftIcon={<Edit />}></Button>
                </div>
              </div>
            </div>
          </section>

          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Outline Button - Small (44px)</h2>

            <div className="space-y-6">
              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Default</div>
                <div className="flex gap-4 flex-wrap">
                  <Button variant="outline" size="small">+ Button</Button>
                  <Button variant="outline" size="small" leftIcon={<Plus />}>Button</Button>
                  <Button variant="outline" size="small" shape="circle" leftIcon={<Plus />}>+</Button>
                  <Button variant="outline" size="small" shape="square" leftIcon={<Edit />}></Button>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Hover</div>
                <div className="flex gap-4 flex-wrap">
                  <Button variant="outline" size="small">+ Button</Button>
                  <Button variant="outline" size="small" leftIcon={<Plus />}>Button</Button>
                  <Button variant="outline" size="small" shape="circle" leftIcon={<Plus />}>+</Button>
                  <Button variant="outline" size="small" shape="square" leftIcon={<Edit />}></Button>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Pressed</div>
                <div className="flex gap-4 flex-wrap">
                  <Button variant="outline" size="small">+ Button</Button>
                  <Button variant="outline" size="small" leftIcon={<Plus />}>Button</Button>
                  <Button variant="outline" size="small" shape="circle" leftIcon={<Plus />}>+</Button>
                  <Button variant="outline" size="small" shape="square" leftIcon={<Edit />}></Button>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Disabled</div>
                <div className="flex gap-4 flex-wrap">
                  <Button variant="outline" size="small" disabled>+ Button</Button>
                  <Button variant="outline" size="small" disabled leftIcon={<Plus />}>Button</Button>
                  <Button variant="outline" size="small" disabled shape="circle" leftIcon={<Plus />}>+</Button>
                  <Button variant="outline" size="small" disabled shape="square" leftIcon={<Edit />}></Button>
                </div>
              </div>
            </div>
          </section>

          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Outline Button - X-Small (38px)</h2>

            <div className="space-y-6">
              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Default</div>
                <div className="flex gap-4 flex-wrap">
                  <Button variant="outline" size="x-small">+ Button</Button>
                  <Button variant="outline" size="x-small" leftIcon={<Plus />}>Button</Button>
                  <Button variant="outline" size="x-small" shape="circle" leftIcon={<Plus />}>+</Button>
                  <Button variant="outline" size="x-small" shape="square" leftIcon={<Edit />}></Button>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Hover</div>
                <div className="flex gap-4 flex-wrap">
                  <Button variant="outline" size="x-small">+ Button</Button>
                  <Button variant="outline" size="x-small" leftIcon={<Plus />}>Button</Button>
                  <Button variant="outline" size="x-small" shape="circle" leftIcon={<Plus />}>+</Button>
                  <Button variant="outline" size="x-small" shape="square" leftIcon={<Edit />}></Button>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Pressed</div>
                <div className="flex gap-4 flex-wrap">
                  <Button variant="outline" size="x-small">+ Button</Button>
                  <Button variant="outline" size="x-small" leftIcon={<Plus />}>Button</Button>
                  <Button variant="outline" size="x-small" shape="circle" leftIcon={<Plus />}>+</Button>
                  <Button variant="outline" size="x-small" shape="square" leftIcon={<Edit />}></Button>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Disabled</div>
                <div className="flex gap-4 flex-wrap">
                  <Button variant="outline" size="x-small" disabled>+ Button</Button>
                  <Button variant="outline" size="x-small" disabled leftIcon={<Plus />}>Button</Button>
                  <Button variant="outline" size="x-small" disabled shape="circle" leftIcon={<Plus />}>+</Button>
                  <Button variant="outline" size="x-small" disabled shape="square" leftIcon={<Edit />}></Button>
                </div>
              </div>
            </div>
          </section>

          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Link Button - Normal (55px)</h2>

            <div className="space-y-6">
              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Default</div>
                <div className="flex gap-4 flex-wrap items-center">
                  <Button variant="link" size="normal">+ Button</Button>
                  <Button variant="link" size="normal" leftIcon={<Plus />}>Button</Button>
                  <Button variant="link" size="normal" shape="square" leftIcon={<Edit />}></Button>
                  <span className="text-sm text-content-secondary">+</span>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Hover</div>
                <div className="flex gap-4 flex-wrap items-center">
                  <Button variant="link" size="normal">+ Button</Button>
                  <Button variant="link" size="normal" leftIcon={<Plus />}>Button</Button>
                  <Button variant="link" size="normal" shape="square" leftIcon={<Edit />}></Button>
                  <span className="text-sm text-content-secondary">+</span>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Pressed</div>
                <div className="flex gap-4 flex-wrap items-center">
                  <Button variant="link" size="normal">+ Button</Button>
                  <Button variant="link" size="normal" leftIcon={<Plus />}>Button</Button>
                  <Button variant="link" size="normal" shape="square" leftIcon={<Edit />}></Button>
                  <span className="text-sm text-content-secondary">+</span>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Disabled</div>
                <div className="flex gap-4 flex-wrap items-center">
                  <Button variant="link" size="normal" disabled>+ Button</Button>
                  <Button variant="link" size="normal" disabled leftIcon={<Plus />}>Button</Button>
                  <Button variant="link" size="normal" disabled shape="square" leftIcon={<Edit />}></Button>
                  <span className="text-sm text-content-tertiary">+</span>
                </div>
              </div>
            </div>
          </section>

          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Link Button - Small (44px)</h2>

            <div className="space-y-6">
              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Default</div>
                <div className="flex gap-4 flex-wrap items-center">
                  <Button variant="link" size="small">+ Button</Button>
                  <Button variant="link" size="small" leftIcon={<Plus />}>Button</Button>
                  <Button variant="link" size="small" shape="square" leftIcon={<Edit />}></Button>
                  <span className="text-xs text-content-secondary">+</span>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Hover</div>
                <div className="flex gap-4 flex-wrap items-center">
                  <Button variant="link" size="small">+ Button</Button>
                  <Button variant="link" size="small" leftIcon={<Plus />}>Button</Button>
                  <Button variant="link" size="small" shape="square" leftIcon={<Edit />}></Button>
                  <span className="text-xs text-content-secondary">+</span>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Pressed</div>
                <div className="flex gap-4 flex-wrap items-center">
                  <Button variant="link" size="small">+ Button</Button>
                  <Button variant="link" size="small" leftIcon={<Plus />}>Button</Button>
                  <Button variant="link" size="small" shape="square" leftIcon={<Edit />}></Button>
                  <span className="text-xs text-content-secondary">+</span>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Disabled</div>
                <div className="flex gap-4 flex-wrap items-center">
                  <Button variant="link" size="small" disabled>+ Button</Button>
                  <Button variant="link" size="small" disabled leftIcon={<Plus />}>Button</Button>
                  <Button variant="link" size="small" disabled shape="square" leftIcon={<Edit />}></Button>
                  <span className="text-xs text-content-tertiary">+</span>
                </div>
              </div>
            </div>
          </section>

          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Link Button - X-Small (38px)</h2>

            <div className="space-y-6">
              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Default</div>
                <div className="flex gap-4 flex-wrap items-center">
                  <Button variant="link" size="x-small">+ Button</Button>
                  <Button variant="link" size="x-small" leftIcon={<Plus />}>Button</Button>
                  <Button variant="link" size="x-small" shape="square" leftIcon={<Edit />}></Button>
                  <span className="text-[10px] text-content-secondary">+</span>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Hover</div>
                <div className="flex gap-4 flex-wrap items-center">
                  <Button variant="link" size="x-small">+ Button</Button>
                  <Button variant="link" size="x-small" leftIcon={<Plus />}>Button</Button>
                  <Button variant="link" size="x-small" shape="square" leftIcon={<Edit />}></Button>
                  <span className="text-[10px] text-content-secondary">+</span>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Pressed</div>
                <div className="flex gap-4 flex-wrap items-center">
                  <Button variant="link" size="x-small">+ Button</Button>
                  <Button variant="link" size="x-small" leftIcon={<Plus />}>Button</Button>
                  <Button variant="link" size="x-small" shape="square" leftIcon={<Edit />}></Button>
                  <span className="text-[10px] text-content-secondary">+</span>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-content-secondary mb-3">Disabled</div>
                <div className="flex gap-4 flex-wrap items-center">
                  <Button variant="link" size="x-small" disabled>+ Button</Button>
                  <Button variant="link" size="x-small" disabled leftIcon={<Plus />}>Button</Button>
                  <Button variant="link" size="x-small" disabled shape="square" leftIcon={<Edit />}></Button>
                  <span className="text-[10px] text-content-tertiary">+</span>
                </div>
              </div>
            </div>
          </section>

          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Usage Guidelines</h2>

            <div className="space-y-6 text-content-secondary">
              <div>
                <h3 className="font-semibold mb-2 text-lg">When to Use</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>For primary actions that users need to take</li>
                  <li>To submit forms or confirm actions</li>
                  <li>For navigation between pages or sections</li>
                  <li>To trigger modals, menus, or other interactions</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Variants</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Solid:</strong> Primary actions with highest emphasis</li>
                  <li><strong className="text-[indigo-600]">Outline:</strong> Secondary actions with medium emphasis</li>
                  <li><strong className="text-[indigo-600]">Link:</strong> Tertiary actions with lowest emphasis, appears as text</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Sizes</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Normal (55px):</strong> Default size for most use cases</li>
                  <li><strong className="text-[indigo-600]">Small (44px):</strong> For compact interfaces or secondary actions</li>
                  <li><strong className="text-[indigo-600]">X-Small (38px):</strong> For dense layouts or inline actions</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Shapes</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Rectangle:</strong> Standard button with text and optional icons</li>
                  <li><strong className="text-[indigo-600]">Circle:</strong> Icon-only button with circular shape</li>
                  <li><strong className="text-[indigo-600]">Square:</strong> Icon-only button with square shape</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Best Practices</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Use solid buttons for primary actions, outline for secondary, link for tertiary</li>
                  <li>Limit to one primary button per screen section</li>
                  <li>Use clear, action-oriented labels (Save, Cancel, Submit)</li>
                  <li>Include icons to improve recognition and scannability</li>
                  <li>Ensure buttons are large enough for touch targets (minimum 44px)</li>
                  <li>Maintain consistent sizing within the same context</li>
                  <li>Use disabled state to indicate unavailable actions</li>
                  <li>Provide visual feedback on hover and click</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Accessibility</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Ensure sufficient color contrast (minimum 4.5:1)</li>
                  <li>Use keyboard navigation (Tab to focus, Enter/Space to activate)</li>
                  <li>Provide clear focus states for keyboard users</li>
                  <li>Use aria-label for icon-only buttons</li>
                  <li>Indicate disabled state both visually and programmatically</li>
                  <li>Don't rely solely on color to convey state</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
