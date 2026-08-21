import { AccordionItem, Accordion, NestedAccordion } from '../components/ui/Accordion';
import { useState } from 'react';
import { Image } from 'lucide-react';

export function AccordionsPage() {
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({
    default1: false,
    default2: true,
    focus1: false,
    focus2: true,
    nested1: false,
    nested2: true
  });

  const toggleItem = (key: string) => {
    setExpandedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const sampleContent = (
    <div className="flex items-center justify-center py-12 text-content-tertiary">
      <div className="text-center">
        <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Replace Me</p>
      </div>
    </div>
  );

  const nestedItems = [
    { title: 'Nested accordion 1', content: sampleContent },
    { title: 'Nested accordion 2', content: sampleContent },
    { title: 'Nested accordion 3', content: sampleContent }
  ];

  return (
    <div className="w-full min-h-0">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-content-primary mb-2">Accordions</h1>
          <p className="text-content-secondary">
            Collapsible content panels for organizing and displaying information hierarchically
          </p>
        </div>

        <div className="space-y-8">
          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Master Components</h2>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <AccordionItem
                  title="Header"
                  content={sampleContent}
                  isExpanded={false}
                  showIcons={true}
                />
                <AccordionItem
                  title="Header"
                  content={sampleContent}
                  isExpanded={true}
                  showIcons={true}
                />
                <AccordionItem
                  title="Header"
                  content={sampleContent}
                  isExpanded={false}
                  showButton={true}
                  buttonLabel="Button"
                  showIcons={true}
                />
                <AccordionItem
                  title="Header"
                  content={sampleContent}
                  isExpanded={true}
                  showButton={true}
                  buttonLabel="Button"
                  showIcons={true}
                />
              </div>

              <div className="space-y-4">
                <AccordionItem
                  title="Header"
                  content={sampleContent}
                  isExpanded={false}
                  showIcons={true}
                  variant="borderless"
                />
                <AccordionItem
                  title="Header"
                  content={sampleContent}
                  isExpanded={true}
                  showIcons={true}
                  variant="borderless"
                />
                <AccordionItem
                  title="Header"
                  content={sampleContent}
                  isExpanded={false}
                  showButton={true}
                  buttonLabel="Button"
                  showIcons={true}
                  variant="borderless"
                />
                <AccordionItem
                  title="Header"
                  content={sampleContent}
                  isExpanded={true}
                  showButton={true}
                  buttonLabel="Button"
                  showIcons={true}
                  variant="borderless"
                />
              </div>
            </div>

            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h3 className="font-semibold text-yellow-900 mb-2">Note for designers</h3>
              <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                <li>Use 4-in-out Link buttons only</li>
                <li>Use 1 text only link OR 1-2 icon only</li>
                <li>Use the same icon</li>
                <li>Keep the same button variant across all accordions.</li>
              </ul>
            </div>
          </section>

          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Border</h2>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-content-secondary mb-4 uppercase">Default Collapsed</h3>
                <div className="space-y-4">
                  <AccordionItem
                    title="Header"
                    content={sampleContent}
                    isExpanded={expandedItems.default1}
                    onToggle={() => toggleItem('default1')}
                    showIcons={true}
                  />
                  <AccordionItem
                    title="Header"
                    content={sampleContent}
                    isExpanded={false}
                    showButton={true}
                    buttonLabel="Button"
                    showIcons={true}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-content-secondary mb-4 uppercase">Default Expanded</h3>
                <div className="space-y-4">
                  <AccordionItem
                    title="Header"
                    content={sampleContent}
                    isExpanded={expandedItems.default2}
                    onToggle={() => toggleItem('default2')}
                    showIcons={true}
                  />
                  <AccordionItem
                    title="Header"
                    content={sampleContent}
                    isExpanded={true}
                    showButton={true}
                    buttonLabel="Button"
                    showIcons={true}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-content-secondary mb-4 uppercase">Focus Collapsed</h3>
                <div className="space-y-4">
                  <AccordionItem
                    title="Header"
                    content={sampleContent}
                    isExpanded={expandedItems.focus1}
                    onToggle={() => toggleItem('focus1')}
                    state="focus"
                    showIcons={true}
                  />
                  <AccordionItem
                    title="Header"
                    content={sampleContent}
                    isExpanded={false}
                    state="focus"
                    showButton={true}
                    buttonLabel="Button"
                    showIcons={true}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-content-secondary mb-4 uppercase">Focus Expanded</h3>
                <div className="space-y-4">
                  <AccordionItem
                    title="Header"
                    content={sampleContent}
                    isExpanded={expandedItems.focus2}
                    onToggle={() => toggleItem('focus2')}
                    state="focus"
                    showIcons={true}
                  />
                  <AccordionItem
                    title="Header"
                    content={sampleContent}
                    isExpanded={true}
                    state="focus"
                    showButton={true}
                    buttonLabel="Button"
                    showIcons={true}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Borderless</h2>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-content-secondary mb-4 uppercase">Default Collapsed</h3>
                <div className="space-y-2">
                  <AccordionItem
                    title="Header"
                    content={sampleContent}
                    isExpanded={false}
                    variant="borderless"
                    showIcons={true}
                  />
                  <AccordionItem
                    title="Header"
                    content={sampleContent}
                    isExpanded={false}
                    variant="borderless"
                    showButton={true}
                    buttonLabel="Button"
                    showIcons={true}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-content-secondary mb-4 uppercase">Default Expanded</h3>
                <div className="space-y-2">
                  <AccordionItem
                    title="Header"
                    content={sampleContent}
                    isExpanded={true}
                    variant="borderless"
                    showIcons={true}
                  />
                  <AccordionItem
                    title="Header"
                    content={sampleContent}
                    isExpanded={true}
                    variant="borderless"
                    showButton={true}
                    buttonLabel="Button"
                    showIcons={true}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-content-secondary mb-4 uppercase">Focus Collapsed</h3>
                <div className="space-y-2">
                  <AccordionItem
                    title="Header"
                    content={sampleContent}
                    isExpanded={false}
                    variant="borderless"
                    state="focus"
                    showIcons={true}
                  />
                  <AccordionItem
                    title="Header"
                    content={sampleContent}
                    isExpanded={false}
                    variant="borderless"
                    state="focus"
                    showButton={true}
                    buttonLabel="Button"
                    showIcons={true}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-content-secondary mb-4 uppercase">Focus Expanded</h3>
                <div className="space-y-2">
                  <AccordionItem
                    title="Header"
                    content={sampleContent}
                    isExpanded={true}
                    variant="borderless"
                    state="focus"
                    showIcons={true}
                  />
                  <AccordionItem
                    title="Header"
                    content={sampleContent}
                    isExpanded={true}
                    variant="borderless"
                    state="focus"
                    showButton={true}
                    buttonLabel="Button"
                    showIcons={true}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Nested Accordions</h2>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-content-secondary mb-4 uppercase">Border</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-content-secondary mb-2">Default Collapsed</p>
                    <NestedAccordion
                      title="Header"
                      nestedItems={nestedItems}
                      isExpanded={false}
                      variant="border"
                    />
                  </div>

                  <div>
                    <p className="text-xs text-content-secondary mb-2">Default Expanded</p>
                    <NestedAccordion
                      title="Header"
                      nestedItems={nestedItems}
                      isExpanded={true}
                      variant="border"
                    />
                  </div>

                  <div>
                    <p className="text-xs text-content-secondary mb-2">Focus Collapsed</p>
                    <NestedAccordion
                      title="Header"
                      nestedItems={nestedItems}
                      isExpanded={false}
                      variant="border"
                      state="focus"
                    />
                  </div>

                  <div>
                    <p className="text-xs text-content-secondary mb-2">Focus Expanded</p>
                    <NestedAccordion
                      title="Header"
                      nestedItems={nestedItems}
                      isExpanded={true}
                      variant="border"
                      state="focus"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-content-secondary mb-4 uppercase">Borderless</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-content-secondary mb-2">Default Collapsed</p>
                    <NestedAccordion
                      title="Header"
                      nestedItems={nestedItems}
                      isExpanded={false}
                      variant="borderless"
                    />
                  </div>

                  <div>
                    <p className="text-xs text-content-secondary mb-2">Default Expanded</p>
                    <NestedAccordion
                      title="Header"
                      nestedItems={nestedItems}
                      isExpanded={true}
                      variant="borderless"
                    />
                  </div>

                  <div>
                    <p className="text-xs text-content-secondary mb-2">Focus Collapsed</p>
                    <NestedAccordion
                      title="Header"
                      nestedItems={nestedItems}
                      isExpanded={false}
                      variant="borderless"
                      state="focus"
                    />
                  </div>

                  <div>
                    <p className="text-xs text-content-secondary mb-2">Focus Expanded</p>
                    <NestedAccordion
                      title="Header"
                      nestedItems={nestedItems}
                      isExpanded={true}
                      variant="borderless"
                      state="focus"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Disabled State</h2>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-content-secondary mb-4">Border - Disabled Collapsed</h3>
                <AccordionItem
                  title="Header"
                  content={sampleContent}
                  isExpanded={false}
                  state="disabled"
                  showIcons={true}
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-content-secondary mb-4">Borderless - Disabled Collapsed</h3>
                <AccordionItem
                  title="Header"
                  content={sampleContent}
                  isExpanded={false}
                  variant="borderless"
                  state="disabled"
                  showIcons={true}
                />
              </div>
            </div>
          </section>

          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Working Examples</h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-content-secondary mb-4">Simple Accordion Group</h3>
                <Accordion
                  items={[
                    { title: 'What is a Design System?', content: <p className="text-sm text-content-secondary">A design system is a collection of reusable components, guided by clear standards, that can be assembled together to build applications.</p> },
                    { title: 'How do I use components?', content: <p className="text-sm text-content-secondary">Import the component from the library and use it in your application with the appropriate props.</p> },
                    { title: 'Can I customize the styles?', content: <p className="text-sm text-content-secondary">Yes, most components accept className props and can be customized using Tailwind CSS classes.</p> }
                  ]}
                  variant="border"
                  defaultExpanded={[0]}
                  allowMultiple={false}
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-content-secondary mb-4">Accordion with Buttons</h3>
                <Accordion
                  items={[
                    { title: 'Account Settings', content: <p className="text-sm text-content-secondary">Manage your account settings and preferences here.</p> },
                    { title: 'Privacy Settings', content: <p className="text-sm text-content-secondary">Control who can see your information and how it's used.</p> },
                    { title: 'Notification Settings', content: <p className="text-sm text-content-secondary">Choose what notifications you want to receive.</p> }
                  ]}
                  variant="border"
                  showButtons={true}
                  buttonLabel="Edit"
                  allowMultiple={true}
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-content-secondary mb-4">Borderless Accordion</h3>
                <Accordion
                  items={[
                    { title: 'General Information', content: <p className="text-sm text-content-secondary">Basic information about the product or service.</p> },
                    { title: 'Technical Specifications', content: <p className="text-sm text-content-secondary">Detailed technical specifications and requirements.</p> },
                    { title: 'Support & Help', content: <p className="text-sm text-content-secondary">Get help and support for any issues you may encounter.</p> }
                  ]}
                  variant="borderless"
                  defaultExpanded={[1]}
                  allowMultiple={false}
                />
              </div>
            </div>
          </section>

          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Usage Guidelines</h2>

            <div className="space-y-6 text-content-secondary">
              <div>
                <h3 className="font-semibold mb-2 text-lg">When to Use</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>To organize and hide complex information until needed</li>
                  <li>For FAQ sections where users can expand questions of interest</li>
                  <li>To save vertical space while maintaining access to content</li>
                  <li>For hierarchical content that needs progressive disclosure</li>
                  <li>When you have multiple related sections that don't all need to be visible</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Variants</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Border:</strong> Clear visual separation with borders, best for distinct sections</li>
                  <li><strong className="text-[indigo-600]">Borderless:</strong> Cleaner look with minimal visual weight, good for subtle content organization</li>
                  <li><strong className="text-[indigo-600]">Nested:</strong> Hierarchical content structure with parent-child relationships</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Behavior</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Single Expand:</strong> Only one panel can be open at a time (radio behavior)</li>
                  <li><strong className="text-[indigo-600]">Multiple Expand:</strong> Multiple panels can be open simultaneously (checkbox behavior)</li>
                  <li>Click anywhere on the header to toggle expansion</li>
                  <li>Action buttons and icons can have separate click handlers</li>
                  <li>Smooth transitions when expanding and collapsing</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Best Practices</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Use clear, descriptive headers that indicate the content inside</li>
                  <li>Keep accordion headers concise and scannable</li>
                  <li>Use consistent icons across all accordion items</li>
                  <li>Maintain the same button variant throughout an accordion group</li>
                  <li>Consider default states carefully - important content should be expanded by default</li>
                  <li>Don't nest accordions more than 2 levels deep</li>
                  <li>Provide visual feedback for interactive elements (hover, focus states)</li>
                  <li>Use chevron icons to indicate expandable content</li>
                  <li>Ensure content panels have adequate padding for readability</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Accessibility</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Use proper ARIA attributes (aria-expanded, aria-controls)</li>
                  <li>Ensure keyboard navigation support (Enter/Space to toggle)</li>
                  <li>Provide clear focus indicators for keyboard users</li>
                  <li>Use semantic HTML (button elements for headers)</li>
                  <li>Ensure sufficient color contrast for all states</li>
                  <li>Make clickable areas large enough for easy interaction</li>
                  <li>Test with screen readers to ensure proper announcement</li>
                  <li>Don't hide critical information in collapsed accordions</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
