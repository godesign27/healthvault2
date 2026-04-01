import { useState } from 'react';
import { Icon, iconCategories } from '../components/ui/Icon';
import { Search, Copy, Check } from 'lucide-react';
import * as Icons from 'lucide-react';

export function IconsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedIcon, setCopiedIcon] = useState<string | null>(null);

  const allIconNames = Object.keys(Icons).filter(
    (name) => name !== 'createLucideIcon' && typeof (Icons as any)[name] === 'function'
  );

  const filteredIcons = () => {
    let icons = selectedCategory === 'all'
      ? allIconNames
      : iconCategories[selectedCategory as keyof typeof iconCategories] || [];

    if (searchQuery) {
      icons = icons.filter((name) =>
        name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return icons;
  };

  const copyIconName = (iconName: string) => {
    navigator.clipboard.writeText(iconName);
    setCopiedIcon(iconName);
    setTimeout(() => setCopiedIcon(null), 2000);
  };

  const icons = filteredIcons();

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Icons</h1>
          <p className="text-gray-600">
            Complete icon library using Lucide React with {allIconNames.length} icons
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search icons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[indigo-600] focus:border-transparent"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-[indigo-600] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Icons
              </button>
              {Object.keys(iconCategories).map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-[indigo-600] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4 text-sm text-gray-600">
            Showing {icons.length} icon{icons.length !== 1 ? 's' : ''}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {icons.map((iconName) => {
              return (
                <button
                  key={iconName}
                  onClick={() => copyIconName(iconName)}
                  className="group relative flex flex-col items-center justify-center p-4 border border-gray-200 hover:border-[indigo-600] hover:bg-gray-50 transition-all"
                  title={`Click to copy: ${iconName}`}
                >
                  <div className="mb-2">
                    <Icon name={iconName} size={32} className="text-gray-700 group-hover:text-[indigo-600]" />
                  </div>
                  <span className="text-xs text-center text-gray-600 group-hover:text-[indigo-600] line-clamp-2 break-all">
                    {iconName}
                  </span>

                  {copiedIcon === iconName ? (
                    <div className="absolute top-1 right-1">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                  ) : (
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Copy className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {icons.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No icons found matching "{searchQuery}"
            </div>
          )}
        </div>

        <div className="space-y-8">
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Icon Sizes</h2>

            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <Icon name="Home" size={16} className="text-gray-700" />
                  <span className="text-sm text-gray-600">16px - Small</span>
                </div>
                <div className="flex items-center gap-3">
                  <Icon name="Home" size={20} className="text-gray-700" />
                  <span className="text-sm text-gray-600">20px - Default</span>
                </div>
                <div className="flex items-center gap-3">
                  <Icon name="Home" size={24} className="text-gray-700" />
                  <span className="text-sm text-gray-600">24px - Medium</span>
                </div>
                <div className="flex items-center gap-3">
                  <Icon name="Home" size={32} className="text-gray-700" />
                  <span className="text-sm text-gray-600">32px - Large</span>
                </div>
                <div className="flex items-center gap-3">
                  <Icon name="Home" size={48} className="text-gray-700" />
                  <span className="text-sm text-gray-600">48px - XL</span>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Icon Colors</h2>

            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <Icon name="Heart" size={32} className="text-[indigo-600]" />
                  <span className="text-sm text-gray-600">Primary</span>
                </div>
                <div className="flex items-center gap-3">
                  <Icon name="Heart" size={32} className="text-[#EC7200]" />
                  <span className="text-sm text-gray-600">Secondary</span>
                </div>
                <div className="flex items-center gap-3">
                  <Icon name="Heart" size={32} className="text-[#00A663]" />
                  <span className="text-sm text-gray-600">Success</span>
                </div>
                <div className="flex items-center gap-3">
                  <Icon name="Heart" size={32} className="text-[#C17509]" />
                  <span className="text-sm text-gray-600">Warning</span>
                </div>
                <div className="flex items-center gap-3">
                  <Icon name="Heart" size={32} className="text-[#B21111]" />
                  <span className="text-sm text-gray-600">Error</span>
                </div>
                <div className="flex items-center gap-3">
                  <Icon name="Heart" size={32} className="text-gray-600" />
                  <span className="text-sm text-gray-600">Neutral</span>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Usage Guidelines</h2>

            <div className="space-y-6 text-gray-700">
              <div>
                <h3 className="font-semibold mb-2 text-lg">Icon Library</h3>
                <p className="text-sm mb-3">
                  This design system uses Lucide React, a beautiful and consistent icon library with over 1,000 icons.
                  All icons are designed on a 24x24 grid with consistent stroke width and style.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">When to Use Icons</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>To provide visual cues and improve recognition</li>
                  <li>To save space and reduce text clutter</li>
                  <li>To indicate actions (edit, delete, save)</li>
                  <li>To represent status or categories</li>
                  <li>To enhance navigation and wayfinding</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Size Guidelines</h3>
                <div className="space-y-2 ml-2 text-sm">
                  <p><strong className="text-[indigo-600]">16px:</strong> Use in dense interfaces, tables, or inline with small text</p>
                  <p><strong className="text-[indigo-600]">20px:</strong> Standard size for most UI elements and buttons</p>
                  <p><strong className="text-[indigo-600]">24px:</strong> Use for primary actions or more prominent UI elements</p>
                  <p><strong className="text-[indigo-600]">32px:</strong> Use for featured content or larger buttons</p>
                  <p><strong className="text-[indigo-600]">48px+:</strong> Use for empty states, splash screens, or hero sections</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Best Practices</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Always pair icons with labels for clarity (except for universally recognized icons)</li>
                  <li>Maintain consistent icon sizing within the same context</li>
                  <li>Use semantic colors to convey meaning (green for success, red for errors)</li>
                  <li>Ensure icons have sufficient contrast with their background</li>
                  <li>Keep stroke width consistent across all icons</li>
                  <li>Test icons at actual size to ensure clarity</li>
                  <li>Provide descriptive alt text or aria-labels for accessibility</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Implementation</h3>
                <div className="bg-gray-50 p-4 font-mono text-xs overflow-x-auto">
                  <div className="mb-4">
                    <div className="text-gray-500 mb-1">// Import the Icon component</div>
                    <div>import {'{'} Icon {'}'} from '@/components/ui/Icon';</div>
                  </div>
                  <div className="mb-4">
                    <div className="text-gray-500 mb-1">// Basic usage</div>
                    <div>&lt;Icon name="Home" /&gt;</div>
                  </div>
                  <div className="mb-4">
                    <div className="text-gray-500 mb-1">// With custom size</div>
                    <div>&lt;Icon name="Settings" size={'{32}'} /&gt;</div>
                  </div>
                  <div className="mb-4">
                    <div className="text-gray-500 mb-1">// With custom color</div>
                    <div>&lt;Icon name="Heart" color="indigo-600" /&gt;</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">// With Tailwind classes</div>
                    <div>&lt;Icon name="Star" className="text-yellow-500" /&gt;</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Accessibility</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Icons should not be the only means of conveying information</li>
                  <li>Provide text labels or tooltips for icon-only buttons</li>
                  <li>Use aria-label or aria-labelledby for screen readers</li>
                  <li>Ensure sufficient color contrast (minimum 3:1 for non-text elements)</li>
                  <li>Consider users with color blindness when using color to convey meaning</li>
                  <li>Test with keyboard navigation and screen readers</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
