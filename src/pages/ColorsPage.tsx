import { useEffect, useState } from 'react';
import { supabase, type DesignToken } from '../lib/supabase';

export function ColorsPage() {
  const [tokens, setTokens] = useState<DesignToken[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      const { data } = await supabase
        .from('design_tokens')
        .select('*')
        .like('category', 'colors%')
        .order('category, name');

      if (data) setTokens(data);
    } catch (error) {
      console.error('Error loading tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupedTokens = tokens.reduce((acc, token) => {
    if (!acc[token.category]) {
      acc[token.category] = [];
    }
    acc[token.category].push(token);
    return acc;
  }, {} as Record<string, DesignToken[]>);

  const getCategoryTitle = (category: string) => {
    if (category === 'colors-primary') return 'Primary Colors';
    if (category === 'colors-secondary') return 'Secondary Colors';
    if (category === 'colors-neutral') return 'Neutral Colors';
    if (category === 'colors-semantic') return 'Semantic Colors';
    if (category === 'colors-data') return 'Data Visualization Colors';
    return category;
  };

  const getColorFamily = (name: string) => {
    const parts = name.split('-');
    return parts.slice(0, -1).join('-');
  };

  const groupByFamily = (categoryTokens: DesignToken[]) => {
    const families: Record<string, DesignToken[]> = {};
    categoryTokens.forEach(token => {
      const family = getColorFamily(token.name);
      if (!families[family]) {
        families[family] = [];
      }
      families[family].push(token);
    });
    return families;
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-content-secondary">Loading colors...</div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-0">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-content-primary mb-2">Color System</h1>
          <p className="text-content-secondary">Comprehensive color palette for the Health Vault design system</p>
        </div>

        <div className="space-y-12">
          {Object.entries(groupedTokens).map(([category, categoryTokens]) => {
            const families = groupByFamily(categoryTokens);

            return (
              <section key={category} className="bg-surface-raised rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold text-content-primary mb-6">{getCategoryTitle(category)}</h2>

                <div className="space-y-8">
                  {Object.entries(families).map(([family, familyTokens]) => {
                    const sortedTokens = familyTokens.sort((a, b) => {
                      const numA = parseInt(a.name.split('-').pop() || '0');
                      const numB = parseInt(b.name.split('-').pop() || '0');
                      return numB - numA;
                    });

                    const mainColor = sortedTokens.find(t => t.name.includes('-60')) || sortedTokens[0];

                    return (
                      <div key={family}>
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold text-content-primary capitalize mb-1">
                            {family.replace(/-/g, ' ')}
                          </h3>
                          <p className="text-sm text-content-secondary">{mainColor.description}</p>
                        </div>

                        <div className="grid grid-cols-10 gap-2">
                          {sortedTokens.map((token) => {
                            const shade = token.name.split('-').pop();
                            const isMainColor = token.name.includes('-60');

                            return (
                              <div key={token.id} className="group relative">
                                <div
                                  className={`
                                    h-20 rounded transition-all cursor-pointer
                                    ${isMainColor ? 'ring-2 ring-stroke-strong ring-offset-2 ring-offset-surface-page' : 'hover:ring-2 hover:ring-stroke-default hover:ring-offset-2 hover:ring-offset-surface-page'}
                                  `}
                                  style={{ backgroundColor: token.value }}
                                  title={`${token.name}: ${token.value}`}
                                />
                                <div className="mt-2 text-center">
                                  <p className="text-xs font-medium text-content-secondary">{shade}</p>
                                  <p className="text-xs text-content-secondary font-mono">{token.value}</p>
                                </div>

                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                  <div className="bg-surface-overlay text-content-primary text-xs rounded py-1 px-2 whitespace-nowrap border border-stroke-subtle shadow-md">
                                    {token.name}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Usage Guidelines</h2>

            <div className="space-y-6 text-content-secondary">
              <div>
                <h3 className="font-semibold mb-2 text-lg">Color Categories</h3>

                <div className="space-y-4 mt-4">
                  <div className="border-l-4 border-indigo-600 pl-4">
                    <h4 className="font-semibold">Primary Colors</h4>
                    <p className="text-sm">
                      Indigo is the primary brand color displayed most frequently across screens,
                      components, and CTAs. Use it for key actions and brand elements.
                    </p>
                  </div>

                  <div className="border-l-4 border-orange-600 pl-4">
                    <h4 className="font-semibold">Secondary Colors</h4>
                    <p className="text-sm">
                      Use secondary colors as accents in combination with primary colors to draw
                      attention. Great for highlighting important elements.
                    </p>
                  </div>

                  <div className="border-l-4 border-stroke-strong pl-4">
                    <h4 className="font-semibold">Neutral Colors</h4>
                    <p className="text-sm">
                      Neutral colors including Slate, Gray, Zinc, Neutral, and Stone are used for backgrounds,
                      text, and UI elements. These colors ensure proper hierarchy and readability.
                    </p>
                  </div>

                  <div className="border-l-4 border-green-600 pl-4">
                    <h4 className="font-semibold">Semantic Colors</h4>
                    <p className="text-sm">
                      Colors that convey meaning: Success (Green), Error (Red),
                      Information (Blue). Use these colors consistently for their intended purposes.
                    </p>
                  </div>

                  <div className="border-l-4 border-pink-600 pl-4">
                    <h4 className="font-semibold">Data Visualization Colors</h4>
                    <p className="text-sm">
                      A comprehensive palette including Orange, Amber, Yellow, Lime, Emerald, Teal, Cyan,
                      Sky, Violet, Purple, Fuchsia, Pink, and Rose for charts, graphs, and data representations.
                      Each color family provides 10 shades for different data points and visual hierarchies.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Color Scale</h3>
                <p className="text-sm mb-3">
                  Each color family includes 10 shades (10-100) providing flexibility for different use cases:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong>100-80:</strong> Dark shades for text, borders, and high contrast elements</li>
                  <li><strong>60-70:</strong> Primary shades for main UI elements and brand applications</li>
                  <li><strong>40-50:</strong> Medium shades for hover states and secondary elements</li>
                  <li><strong>10-30:</strong> Light shades for backgrounds, subtle highlights, and low emphasis</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Best Practices</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Always ensure sufficient contrast ratios for accessibility (WCAG AA: 4.5:1 for normal text)</li>
                  <li>Use semantic colors consistently for their intended purposes</li>
                  <li>Limit color usage in a single view to maintain visual hierarchy</li>
                  <li>Test colors in both light and dark contexts</li>
                  <li>Consider colorblind-friendly combinations for data visualizations</li>
                  <li>Use the 60 shade as the primary representation of each color family</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Accessibility</h3>
                <p className="text-sm mb-3">
                  Color should never be the only means of conveying information. Always pair color with:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Text labels or descriptions</li>
                  <li>Icons or visual indicators</li>
                  <li>Patterns or textures for data visualization</li>
                  <li>Sufficient contrast for readability</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
