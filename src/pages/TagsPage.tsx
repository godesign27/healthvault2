import { Tag, TagGroup } from '../components/ui/Tag';
import { useState } from 'react';

export function TagsPage() {
  const [tags, setTags] = useState([
    { id: '1', label: 'Design', variant: 'primary' as const },
    { id: '2', label: 'Development', variant: 'success' as const },
    { id: '3', label: 'Marketing', variant: 'warning' as const },
    { id: '4', label: 'Sales', variant: 'error' as const },
    { id: '5', label: 'Support', variant: 'info' as const }
  ]);

  const handleRemove = (id: string) => {
    setTags(tags.filter(tag => tag.id !== id));
  };

  return (
    <div className="w-full min-h-0">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-content-primary mb-2">Tags</h1>
          <p className="text-content-secondary">
            Labels for categorizing and organizing content
          </p>
        </div>

        <div className="space-y-8">
          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Sizes</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-content-secondary uppercase mb-3">Small</h3>
                <div className="flex flex-wrap gap-3">
                  <Tag size="small" variant="default">Default</Tag>
                  <Tag size="small" variant="primary">Primary</Tag>
                  <Tag size="small" variant="success">Success</Tag>
                  <Tag size="small" variant="warning">Warning</Tag>
                  <Tag size="small" variant="error">Error</Tag>
                  <Tag size="small" variant="info">Info</Tag>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-content-secondary uppercase mb-3">Medium (Default)</h3>
                <div className="flex flex-wrap gap-3">
                  <Tag size="medium" variant="default">Default</Tag>
                  <Tag size="medium" variant="primary">Primary</Tag>
                  <Tag size="medium" variant="success">Success</Tag>
                  <Tag size="medium" variant="warning">Warning</Tag>
                  <Tag size="medium" variant="error">Error</Tag>
                  <Tag size="medium" variant="info">Info</Tag>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-content-secondary uppercase mb-3">Large</h3>
                <div className="flex flex-wrap gap-3">
                  <Tag size="large" variant="default">Default</Tag>
                  <Tag size="large" variant="primary">Primary</Tag>
                  <Tag size="large" variant="success">Success</Tag>
                  <Tag size="large" variant="warning">Warning</Tag>
                  <Tag size="large" variant="error">Error</Tag>
                  <Tag size="large" variant="info">Info</Tag>
                </div>
              </div>
            </div>
          </section>

          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Styles</h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-semibold text-content-secondary uppercase mb-4">Filled</h3>
                <div className="flex flex-wrap gap-3">
                  <Tag style="filled" variant="default">Default</Tag>
                  <Tag style="filled" variant="primary">Primary</Tag>
                  <Tag style="filled" variant="success">Success</Tag>
                  <Tag style="filled" variant="warning">Warning</Tag>
                  <Tag style="filled" variant="error">Error</Tag>
                  <Tag style="filled" variant="info">Info</Tag>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-content-secondary uppercase mb-4">Outlined</h3>
                <div className="flex flex-wrap gap-3">
                  <Tag style="outlined" variant="default">Default</Tag>
                  <Tag style="outlined" variant="primary">Primary</Tag>
                  <Tag style="outlined" variant="success">Success</Tag>
                  <Tag style="outlined" variant="warning">Warning</Tag>
                  <Tag style="outlined" variant="error">Error</Tag>
                  <Tag style="outlined" variant="info">Info</Tag>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-content-secondary uppercase mb-4">Subtle</h3>
                <div className="flex flex-wrap gap-3">
                  <Tag style="subtle" variant="default">Default</Tag>
                  <Tag style="subtle" variant="primary">Primary</Tag>
                  <Tag style="subtle" variant="success">Success</Tag>
                  <Tag style="subtle" variant="warning">Warning</Tag>
                  <Tag style="subtle" variant="error">Error</Tag>
                  <Tag style="subtle" variant="info">Info</Tag>
                </div>
              </div>
            </div>
          </section>

          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Removable Tags</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-content-secondary uppercase mb-3">Filled with Close</h3>
                <div className="flex flex-wrap gap-3">
                  <Tag removable onRemove={() => alert('Remove default')} variant="default">Default</Tag>
                  <Tag removable onRemove={() => alert('Remove primary')} variant="primary">Primary</Tag>
                  <Tag removable onRemove={() => alert('Remove success')} variant="success">Success</Tag>
                  <Tag removable onRemove={() => alert('Remove warning')} variant="warning">Warning</Tag>
                  <Tag removable onRemove={() => alert('Remove error')} variant="error">Error</Tag>
                  <Tag removable onRemove={() => alert('Remove info')} variant="info">Info</Tag>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-content-secondary uppercase mb-3">Outlined with Close</h3>
                <div className="flex flex-wrap gap-3">
                  <Tag removable style="outlined" onRemove={() => {}} variant="default">Default</Tag>
                  <Tag removable style="outlined" onRemove={() => {}} variant="primary">Primary</Tag>
                  <Tag removable style="outlined" onRemove={() => {}} variant="success">Success</Tag>
                  <Tag removable style="outlined" onRemove={() => {}} variant="warning">Warning</Tag>
                  <Tag removable style="outlined" onRemove={() => {}} variant="error">Error</Tag>
                  <Tag removable style="outlined" onRemove={() => {}} variant="info">Info</Tag>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-content-secondary uppercase mb-3">Subtle with Close</h3>
                <div className="flex flex-wrap gap-3">
                  <Tag removable style="subtle" onRemove={() => {}} variant="default">Default</Tag>
                  <Tag removable style="subtle" onRemove={() => {}} variant="primary">Primary</Tag>
                  <Tag removable style="subtle" onRemove={() => {}} variant="success">Success</Tag>
                  <Tag removable style="subtle" onRemove={() => {}} variant="warning">Warning</Tag>
                  <Tag removable style="subtle" onRemove={() => {}} variant="error">Error</Tag>
                  <Tag removable style="subtle" onRemove={() => {}} variant="info">Info</Tag>
                </div>
              </div>
            </div>
          </section>

          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Tag Groups</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-content-secondary uppercase mb-3">Simple Group</h3>
                <TagGroup
                  tags={tags}
                  onRemove={handleRemove}
                  size="medium"
                  style="filled"
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-content-secondary uppercase mb-3">Outlined Group</h3>
                <TagGroup
                  tags={[
                    { id: '1', label: 'React', variant: 'primary' },
                    { id: '2', label: 'TypeScript', variant: 'info' },
                    { id: '3', label: 'Tailwind', variant: 'success' },
                    { id: '4', label: 'Vite', variant: 'warning' }
                  ]}
                  size="medium"
                  style="outlined"
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-content-secondary uppercase mb-3">Subtle Group</h3>
                <TagGroup
                  tags={[
                    { id: '1', label: 'Frontend', variant: 'primary' },
                    { id: '2', label: 'Backend', variant: 'success' },
                    { id: '3', label: 'DevOps', variant: 'warning' },
                    { id: '4', label: 'Design', variant: 'info' }
                  ]}
                  size="medium"
                  style="subtle"
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-content-secondary uppercase mb-3">With Max Display (showing 3 of 8)</h3>
                <TagGroup
                  tags={[
                    { id: '1', label: 'JavaScript', variant: 'primary' },
                    { id: '2', label: 'Python', variant: 'success' },
                    { id: '3', label: 'Java', variant: 'warning' },
                    { id: '4', label: 'C++', variant: 'error' },
                    { id: '5', label: 'Go', variant: 'info' },
                    { id: '6', label: 'Rust', variant: 'default' },
                    { id: '7', label: 'Swift', variant: 'primary' },
                    { id: '8', label: 'Kotlin', variant: 'success' }
                  ]}
                  maxDisplay={3}
                  size="medium"
                  style="filled"
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-content-secondary uppercase mb-3">Small Tags</h3>
                <TagGroup
                  tags={[
                    { id: '1', label: 'Tag 1', variant: 'default' },
                    { id: '2', label: 'Tag 2', variant: 'primary' },
                    { id: '3', label: 'Tag 3', variant: 'success' },
                    { id: '4', label: 'Tag 4', variant: 'warning' },
                    { id: '5', label: 'Tag 5', variant: 'error' }
                  ]}
                  size="small"
                  style="filled"
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-content-secondary uppercase mb-3">Large Tags</h3>
                <TagGroup
                  tags={[
                    { id: '1', label: 'Tag 1', variant: 'default' },
                    { id: '2', label: 'Tag 2', variant: 'primary' },
                    { id: '3', label: 'Tag 3', variant: 'success' }
                  ]}
                  size="large"
                  style="filled"
                />
              </div>
            </div>
          </section>

          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Component Specifications</h2>

            <div className="space-y-6 text-content-secondary">
              <div>
                <h3 className="font-semibold mb-2 text-lg">Sizes</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Small:</strong> Compact tags for dense layouts (text-xs, minimal padding)</li>
                  <li><strong className="text-[indigo-600]">Medium:</strong> Standard size for most use cases (text-sm, comfortable padding)</li>
                  <li><strong className="text-[indigo-600]">Large:</strong> Prominent tags for emphasis (text-base, generous padding)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Variants</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-content-secondary]">Default:</strong> Neutral gray for general purpose tags</li>
                  <li><strong className="text-[indigo-600]">Primary:</strong> Teal for main categories or important items</li>
                  <li><strong className="text-[#10B981]">Success:</strong> Green for positive states or completed items</li>
                  <li><strong className="text-[#EAB308]">Warning:</strong> Yellow for cautionary or pending items</li>
                  <li><strong className="text-[#EF4444]">Error:</strong> Red for errors or critical items</li>
                  <li><strong className="text-[#3B82F6]">Info:</strong> Blue for informational tags</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Styles</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Filled:</strong> Solid background color with white or dark text</li>
                  <li><strong className="text-[indigo-600]">Outlined:</strong> Border with colored text on white background</li>
                  <li><strong className="text-[indigo-600]">Subtle:</strong> Light tinted background with colored text</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Visual Design</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Rounded pill shape for modern appearance</li>
                  <li>Medium font weight for readability</li>
                  <li>Optional close button on the right</li>
                  <li>Consistent padding based on size</li>
                  <li>Color-coded by variant for quick identification</li>
                  <li>Subtle hover effects on close button</li>
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
                  <li>To categorize or label content with keywords</li>
                  <li>To display selected filters or search criteria</li>
                  <li>To show status indicators or metadata</li>
                  <li>To represent user skills, interests, or attributes</li>
                  <li>To organize items into groups or collections</li>
                  <li>For displaying active selections in multi-select interfaces</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">When Not to Use</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>For navigation - use tabs or navigation menus instead</li>
                  <li>For actions - use buttons instead</li>
                  <li>For exclusive selections - use radio buttons or segmented control</li>
                  <li>For long text content - use labels or text blocks</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Best Practices</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Keep tag text short and concise (1-3 words)</li>
                  <li>Use consistent capitalization (sentence case recommended)</li>
                  <li>Group related tags together visually</li>
                  <li>Limit the number of tags shown (use +N for overflow)</li>
                  <li>Make removable tags interactive with clear affordance</li>
                  <li>Use semantic colors to convey meaning</li>
                  <li>Maintain consistent sizing within a group</li>
                  <li>Allow adequate spacing between tags</li>
                  <li>Consider wrapping behavior for responsive layouts</li>
                  <li>Use filled style for emphasis, subtle for less prominent tags</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Variant Selection</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-content-secondary">Default:</strong> General categories, neutral labels</li>
                  <li><strong className="text-[indigo-600]">Primary:</strong> Key categories, important classifications</li>
                  <li><strong className="text-[#10B981]">Success:</strong> Completed, approved, or positive states</li>
                  <li><strong className="text-[#EAB308]">Warning:</strong> Pending, review needed, or cautionary states</li>
                  <li><strong className="text-[#EF4444]">Error:</strong> Rejected, failed, or critical issues</li>
                  <li><strong className="text-[#3B82F6]">Info:</strong> Informational, new, or neutral states</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Accessibility</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Ensure sufficient color contrast for text readability</li>
                  <li>Don't rely solely on color to convey meaning</li>
                  <li>Provide descriptive aria-labels for screen readers</li>
                  <li>Make close buttons keyboard accessible</li>
                  <li>Use focus indicators for interactive tags</li>
                  <li>Consider text alternatives for icon-only tags</li>
                  <li>Ensure minimum touch target size of 44×44px for mobile</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Tag Groups</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Use TagGroup component for multiple related tags</li>
                  <li>Set maxDisplay to limit visible tags and show overflow count</li>
                  <li>Apply consistent size and style across the group</li>
                  <li>Allow users to remove tags when appropriate</li>
                  <li>Consider sorting tags by relevance or alphabetically</li>
                  <li>Provide clear visual separation between tag groups</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Content Guidelines</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Use nouns or short phrases for tag text</li>
                  <li>Avoid articles (a, an, the) in tag labels</li>
                  <li>Use sentence case rather than all caps</li>
                  <li>Keep related tags consistent in naming convention</li>
                  <li>Use familiar terminology for your audience</li>
                  <li>Avoid ambiguous or overly generic labels</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
