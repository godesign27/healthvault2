export function TypographyPage() {
  const typographySpecs = [
    {
      name: 'Display',
      size: '44px',
      lineHeight: '56px',
      letterSpacing: '-0.15px',
      weight: 'Semi Bold',
      usage: 'KPI values',
      fontWeight: 600
    },
    {
      name: 'Headline 1',
      size: '28px',
      lineHeight: '40px',
      letterSpacing: '-0.15px',
      weight: 'Semi Bold',
      usage: 'Page Headings',
      fontWeight: 600
    },
    {
      name: 'Headline 2',
      size: '20px',
      lineHeight: '28px',
      letterSpacing: '-0.15px',
      weight: 'Semi Bold',
      usage: 'Section Headings',
      fontWeight: 600
    },
    {
      name: 'Headline 3',
      size: '16px',
      lineHeight: '24px',
      letterSpacing: '-0.15px',
      weight: 'Semi Bold',
      usage: 'Component Headings',
      fontWeight: 600
    },
    {
      name: 'Body - Regular',
      size: '14px',
      lineHeight: '20px',
      letterSpacing: '-0.15px',
      weight: 'Regular',
      usage: 'Body copy and number, paragraph, etc.',
      fontWeight: 400
    },
    {
      name: 'Body - SemiBold',
      size: '14px',
      lineHeight: '20px',
      letterSpacing: '-0.15px',
      weight: 'Semi Bold',
      usage: 'Body copy and number, paragraph, etc.',
      fontWeight: 600
    },
    {
      name: 'Body - Bold',
      size: '14px',
      lineHeight: '20px',
      letterSpacing: '-0.15px',
      weight: 'Bold',
      usage: 'Body copy and number, paragraph, etc.',
      fontWeight: 700
    },
    {
      name: 'Caption 1 - Regular',
      size: '12px',
      lineHeight: '16px',
      letterSpacing: '-0.15px',
      weight: 'Regular',
      usage: 'Disclaimers, body copy, time stamp, etc.',
      fontWeight: 400
    },
    {
      name: 'Caption 1 - Semi Bold',
      size: '12px',
      lineHeight: '16px',
      letterSpacing: '-0.15px',
      weight: 'Semi Bold',
      usage: 'Disclaimers, body copy, time stamp, etc.',
      fontWeight: 600
    },
    {
      name: 'Caption 1 - Italic',
      size: '12px',
      lineHeight: '16px',
      letterSpacing: '-0.15px',
      weight: 'Italic',
      usage: 'Disclaimers, body copy, time stamp, etc.',
      fontWeight: 400,
      italic: true
    },
    {
      name: 'Caption 2 - Regular',
      size: '10px',
      lineHeight: '14px',
      letterSpacing: '-0.15px',
      weight: 'Regular',
      usage: 'Disclaimers, body copy, time stamp, etc.',
      fontWeight: 400
    },
    {
      name: 'Caption 2 - Semi Bold',
      size: '10px',
      lineHeight: '14px',
      letterSpacing: '-0.15px',
      weight: 'Semi Bold',
      usage: 'Disclaimers, body copy, time stamp, etc.',
      fontWeight: 600
    },
    {
      name: 'Caption 2 - Italic',
      size: '10px',
      lineHeight: '16px',
      letterSpacing: '-0.15px',
      weight: 'Italic',
      usage: 'Disclaimers, body copy, time stamp, etc.',
      fontWeight: 400,
      italic: true
    }
  ];

  return (
    <div className="w-full min-h-0">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-content-primary mb-2">Typography</h1>
          <p className="text-content-secondary">
            Open Sans is the default font in ZSUI and specifications are as follows
          </p>
        </div>

        <div className="hv-surface-card overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-sunken border-b border-stroke-subtle">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-content-primary">Type(Name)</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-content-primary">Size(px)</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-content-primary">Line height(px)</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-content-primary">Letter spacing(px)</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-content-primary">Weight</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-content-primary">Where to use</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke-subtle">
                {typographySpecs.map((spec, index) => (
                  <tr key={index} className="hover:bg-surface-sunken">
                    <td className="px-6 py-4 text-sm text-content-primary">{spec.name}</td>
                    <td className="px-6 py-4 text-sm text-content-primary">{spec.size}</td>
                    <td className="px-6 py-4 text-sm text-content-primary">{spec.lineHeight}</td>
                    <td className="px-6 py-4 text-sm text-content-primary">{spec.letterSpacing}</td>
                    <td className="px-6 py-4 text-sm text-content-primary">{spec.weight}</td>
                    <td className="px-6 py-4 text-sm text-content-secondary">{spec.usage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-8">
          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Typography Examples</h2>

            <div className="space-y-8">
              {typographySpecs.map((spec, index) => (
                <div key={index} className="border-b border-stroke-subtle pb-6 last:border-b-0">
                  <div className="flex items-baseline justify-between mb-3">
                    <span className="text-sm font-semibold text-[indigo-600]">{spec.name}</span>
                    <span className="text-xs text-content-secondary">
                      {spec.size} / {spec.lineHeight} / {spec.letterSpacing}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: spec.size,
                      lineHeight: spec.lineHeight,
                      letterSpacing: spec.letterSpacing,
                      fontWeight: spec.fontWeight,
                      fontStyle: spec.italic ? 'italic' : 'normal'
                    }}
                    className="text-content-primary"
                  >
                    The quick brown fox jumps over the lazy dog
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Usage Guidelines</h2>

            <div className="space-y-6 text-content-secondary">
              <div>
                <h3 className="font-semibold mb-2 text-lg">Font Family</h3>
                <p className="text-sm mb-3">
                  Open Sans is the default font family for ZSUI. It provides excellent readability
                  across all screen sizes and weights. The system falls back to system fonts if Open Sans
                  is unavailable: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Type Scale</h3>
                <p className="text-sm mb-3">
                  The typography system uses a carefully considered type scale that ensures visual
                  hierarchy and consistency across the interface. Each size serves a specific purpose
                  and should be used accordingly.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Headings</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Display (44px):</strong> Reserved for prominent KPI values and critical metrics</li>
                  <li><strong className="text-[indigo-600]">Headline 1 (28px):</strong> Main page titles and primary headings</li>
                  <li><strong className="text-[indigo-600]">Headline 2 (20px):</strong> Section titles within a page</li>
                  <li><strong className="text-[indigo-600]">Headline 3 (16px):</strong> Component titles and subsection headings</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Body Text</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Body Regular (14px):</strong> Default text for paragraphs and general content</li>
                  <li><strong className="text-[indigo-600]">Body SemiBold (14px):</strong> Emphasized text within body content</li>
                  <li><strong className="text-[indigo-600]">Body Bold (14px):</strong> Strong emphasis and important callouts</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Captions</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Caption 1 (12px):</strong> Secondary information, timestamps, and helper text</li>
                  <li><strong className="text-[indigo-600]">Caption 2 (10px):</strong> Fine print, disclaimers, and tertiary information</li>
                  <li><strong className="text-[indigo-600]">Italic variants:</strong> Use for citations, emphasis, or special notes</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Best Practices</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Maintain consistent hierarchy throughout your interface</li>
                  <li>Use semantic HTML elements (h1, h2, p, etc.) with corresponding typography styles</li>
                  <li>Ensure sufficient color contrast for accessibility (WCAG AA minimum: 4.5:1 for body text)</li>
                  <li>Limit line length to 60-80 characters for optimal readability</li>
                  <li>Use letter spacing sparingly and consistently as specified</li>
                  <li>Avoid using all caps for long text passages</li>
                  <li>Use bold or semi-bold weights for emphasis rather than color alone</li>
                  <li>Maintain the specified line heights to ensure proper vertical rhythm</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Responsive Considerations</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>On mobile devices, consider reducing Display size to 32-36px for better fit</li>
                  <li>Maintain minimum body text size of 14px for mobile readability</li>
                  <li>Increase line height slightly on mobile for easier touch interaction</li>
                  <li>Test typography on actual devices to ensure readability</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Accessibility</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Always maintain proper heading hierarchy (h1 → h2 → h3)</li>
                  <li>Ensure text can be resized up to 200% without breaking layout</li>
                  <li>Provide sufficient contrast between text and background</li>
                  <li>Don't rely on font weight alone to convey information</li>
                  <li>Use appropriate semantic markup for screen readers</li>
                  <li>Test with different zoom levels and font size settings</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Implementation</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3 text-lg">Tailwind CSS Classes</h3>
                <div className="bg-surface-sunken p-4 font-mono text-xs overflow-x-auto space-y-3">
                  <div>
                    <div className="text-content-secondary mb-1">Display</div>
                    <div>className="text-[44px] leading-[56px] tracking-[-0.15px] font-semibold"</div>
                  </div>
                  <div>
                    <div className="text-content-secondary mb-1">Headline 1</div>
                    <div>className="text-[28px] leading-[40px] tracking-[-0.15px] font-semibold"</div>
                  </div>
                  <div>
                    <div className="text-content-secondary mb-1">Headline 2</div>
                    <div>className="text-xl leading-7 tracking-[-0.15px] font-semibold"</div>
                  </div>
                  <div>
                    <div className="text-content-secondary mb-1">Headline 3</div>
                    <div>className="text-base leading-6 tracking-[-0.15px] font-semibold"</div>
                  </div>
                  <div>
                    <div className="text-content-secondary mb-1">Body - Regular</div>
                    <div>className="text-sm leading-5 tracking-[-0.15px]"</div>
                  </div>
                  <div>
                    <div className="text-content-secondary mb-1">Body - SemiBold</div>
                    <div>className="text-sm leading-5 tracking-[-0.15px] font-semibold"</div>
                  </div>
                  <div>
                    <div className="text-content-secondary mb-1">Caption 1 - Regular</div>
                    <div>className="text-xs leading-4 tracking-[-0.15px]"</div>
                  </div>
                  <div>
                    <div className="text-content-secondary mb-1">Caption 2 - Regular</div>
                    <div>className="text-[10px] leading-[14px] tracking-[-0.15px]"</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
