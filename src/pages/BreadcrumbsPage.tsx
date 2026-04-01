import { Breadcrumb, BreadcrumbLink, BreadcrumbSeparator } from '../components/ui/Breadcrumb';

export function BreadcrumbsPage() {
  const exampleItems = [
    { label: 'Page level 2', onClick: () => console.log('Page level 2') },
    { label: 'Page level 3', onClick: () => console.log('Page level 3') },
    { label: 'Page level 4', onClick: () => console.log('Page level 4') },
    { label: 'Active page', isActive: true }
  ];

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Breadcrumbs</h1>
          <p className="text-gray-600">
            Navigation component showing the current page location within the site hierarchy
          </p>
        </div>

        <div className="space-y-8">
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Master Components</h2>
            <p className="text-sm text-gray-600 mb-6">For UI kit building only</p>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Normal</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-2">Active Page</div>
                    <BreadcrumbLink label="Page name" isActive size="normal" theme="light" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-2">Previous Page Link</div>
                    <BreadcrumbLink label="Page name" isPrevious size="normal" theme="light" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-2">Separator</div>
                    <BreadcrumbSeparator size="normal" theme="light" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Small</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-2">Active Page</div>
                    <BreadcrumbLink label="Page name" isActive size="small" theme="light" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-2">Previous Page Link</div>
                    <BreadcrumbLink label="Page name" isPrevious size="small" theme="light" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-2">Separator</div>
                    <BreadcrumbSeparator size="small" theme="light" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">X-Small</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-2">Active Page</div>
                    <BreadcrumbLink label="Page name" isActive size="x-small" theme="light" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-2">Previous Page Link</div>
                    <BreadcrumbLink label="Page name" isPrevious size="x-small" theme="light" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-2">Separator</div>
                    <BreadcrumbSeparator size="x-small" theme="light" />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="text-xs font-medium text-gray-600 mb-2">Input Field (for reference)</div>
                <input
                  type="text"
                  placeholder="Search..."
                  className="px-3 py-2 border-2 border-[indigo-600] rounded text-sm focus:outline-none"
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Breadcrumbs/Parts/Link: Normal</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Light Theme</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-2">Default</div>
                    <div className="flex items-center gap-3">
                      <BreadcrumbLink label="Active page" isActive size="normal" theme="light" />
                      <BreadcrumbLink label="Active page" isActive size="normal" theme="light" />
                      <BreadcrumbLink label="Previous page" isPrevious size="normal" theme="light" />
                      <BreadcrumbLink label="Previous page" size="normal" theme="light" />
                      <BreadcrumbLink label="" isIconOnly size="normal" theme="light" />
                      <BreadcrumbSeparator size="normal" theme="light" />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-2">Hover</div>
                    <div className="flex items-center gap-3">
                      <BreadcrumbLink label="Active page" isActive size="normal" theme="light" />
                      <BreadcrumbLink label="Active page" isActive size="normal" theme="light" />
                      <BreadcrumbLink label="Previous page" isPrevious size="normal" theme="light" />
                      <BreadcrumbLink label="Previous page" size="normal" theme="light" />
                      <BreadcrumbLink label="" isIconOnly size="normal" theme="light" />
                      <BreadcrumbSeparator size="normal" theme="light" />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-2">Focus</div>
                    <div className="flex items-center gap-3">
                      <BreadcrumbLink label="Active page" isActive size="normal" theme="light" />
                      <BreadcrumbLink label="Active page" isActive size="normal" theme="light" />
                      <BreadcrumbLink label="Previous page" isPrevious size="normal" theme="light" />
                      <BreadcrumbLink label="Previous page" size="normal" theme="light" />
                      <BreadcrumbLink label="" isIconOnly size="normal" theme="light" />
                      <BreadcrumbSeparator size="normal" theme="light" />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-2">Disabled</div>
                    <div className="flex items-center gap-3 opacity-50">
                      <BreadcrumbLink label="Active page" isActive size="normal" theme="light" />
                      <BreadcrumbLink label="Active page" isActive size="normal" theme="light" />
                      <BreadcrumbLink label="Previous page" isPrevious size="normal" theme="light" />
                      <BreadcrumbLink label="Previous page" size="normal" theme="light" />
                      <BreadcrumbLink label="" isIconOnly size="normal" theme="light" />
                      <BreadcrumbSeparator size="normal" theme="light" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#1C2938] p-6 rounded-lg">
                <h3 className="text-sm font-semibold text-white mb-4">Dark Theme</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-medium text-gray-400 mb-2">Default</div>
                    <div className="flex items-center gap-3">
                      <BreadcrumbLink label="Active page" isActive size="normal" theme="dark" />
                      <BreadcrumbLink label="Active page" isActive size="normal" theme="dark" />
                      <BreadcrumbLink label="Previous page" isPrevious size="normal" theme="dark" />
                      <BreadcrumbLink label="Previous page" size="normal" theme="dark" />
                      <BreadcrumbLink label="" isIconOnly size="normal" theme="dark" />
                      <BreadcrumbSeparator size="normal" theme="dark" />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-gray-400 mb-2">Hover</div>
                    <div className="flex items-center gap-3">
                      <BreadcrumbLink label="Active page" isActive size="normal" theme="dark" />
                      <BreadcrumbLink label="Active page" isActive size="normal" theme="dark" />
                      <BreadcrumbLink label="Previous page" isPrevious size="normal" theme="dark" />
                      <BreadcrumbLink label="Previous page" size="normal" theme="dark" />
                      <BreadcrumbLink label="" isIconOnly size="normal" theme="dark" />
                      <BreadcrumbSeparator size="normal" theme="dark" />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-gray-400 mb-2">Focus</div>
                    <div className="flex items-center gap-3">
                      <BreadcrumbLink label="Active page" isActive size="normal" theme="dark" />
                      <BreadcrumbLink label="Active page" isActive size="normal" theme="dark" />
                      <BreadcrumbLink label="Previous page" isPrevious size="normal" theme="dark" />
                      <BreadcrumbLink label="Previous page" size="normal" theme="dark" />
                      <BreadcrumbLink label="" isIconOnly size="normal" theme="dark" />
                      <BreadcrumbSeparator size="normal" theme="dark" />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-gray-400 mb-2">Disabled</div>
                    <div className="flex items-center gap-3 opacity-50">
                      <BreadcrumbLink label="Active page" isActive size="normal" theme="dark" />
                      <BreadcrumbLink label="Active page" isActive size="normal" theme="dark" />
                      <BreadcrumbLink label="Previous page" isPrevious size="normal" theme="dark" />
                      <BreadcrumbLink label="Previous page" size="normal" theme="dark" />
                      <BreadcrumbLink label="" isIconOnly size="normal" theme="dark" />
                      <BreadcrumbSeparator size="normal" theme="dark" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Breadcrumbs/Parts/Link: Small</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Light Theme</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-2">Default</div>
                    <div className="flex items-center gap-2">
                      <BreadcrumbLink label="Active page" isActive size="small" theme="light" />
                      <BreadcrumbLink label="Active page" isActive size="small" theme="light" />
                      <BreadcrumbLink label="Previous page" isPrevious size="small" theme="light" />
                      <BreadcrumbLink label="Previous page" size="small" theme="light" />
                      <BreadcrumbLink label="" isIconOnly size="small" theme="light" />
                      <BreadcrumbSeparator size="small" theme="light" />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-2">Hover</div>
                    <div className="flex items-center gap-2">
                      <BreadcrumbLink label="Active page" isActive size="small" theme="light" />
                      <BreadcrumbLink label="Active page" isActive size="small" theme="light" />
                      <BreadcrumbLink label="Previous page" isPrevious size="small" theme="light" />
                      <BreadcrumbLink label="Previous page" size="small" theme="light" />
                      <BreadcrumbLink label="" isIconOnly size="small" theme="light" />
                      <BreadcrumbSeparator size="small" theme="light" />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-2">Focus</div>
                    <div className="flex items-center gap-2">
                      <BreadcrumbLink label="Active page" isActive size="small" theme="light" />
                      <BreadcrumbLink label="Active page" isActive size="small" theme="light" />
                      <BreadcrumbLink label="Previous page" isPrevious size="small" theme="light" />
                      <BreadcrumbLink label="Previous page" size="small" theme="light" />
                      <BreadcrumbLink label="" isIconOnly size="small" theme="light" />
                      <BreadcrumbSeparator size="small" theme="light" />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-2">Disabled</div>
                    <div className="flex items-center gap-2 opacity-50">
                      <BreadcrumbLink label="Active page" isActive size="small" theme="light" />
                      <BreadcrumbLink label="Active page" isActive size="small" theme="light" />
                      <BreadcrumbLink label="Previous page" isPrevious size="small" theme="light" />
                      <BreadcrumbLink label="Previous page" size="small" theme="light" />
                      <BreadcrumbLink label="" isIconOnly size="small" theme="light" />
                      <BreadcrumbSeparator size="small" theme="light" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#1C2938] p-6 rounded-lg">
                <h3 className="text-sm font-semibold text-white mb-4">Dark Theme</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-medium text-gray-400 mb-2">Default</div>
                    <div className="flex items-center gap-2">
                      <BreadcrumbLink label="Active page" isActive size="small" theme="dark" />
                      <BreadcrumbLink label="Active page" isActive size="small" theme="dark" />
                      <BreadcrumbLink label="Previous page" isPrevious size="small" theme="dark" />
                      <BreadcrumbLink label="Previous page" size="small" theme="dark" />
                      <BreadcrumbLink label="" isIconOnly size="small" theme="dark" />
                      <BreadcrumbSeparator size="small" theme="dark" />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-gray-400 mb-2">Hover</div>
                    <div className="flex items-center gap-2">
                      <BreadcrumbLink label="Active page" isActive size="small" theme="dark" />
                      <BreadcrumbLink label="Active page" isActive size="small" theme="dark" />
                      <BreadcrumbLink label="Previous page" isPrevious size="small" theme="dark" />
                      <BreadcrumbLink label="Previous page" size="small" theme="dark" />
                      <BreadcrumbLink label="" isIconOnly size="small" theme="dark" />
                      <BreadcrumbSeparator size="small" theme="dark" />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-gray-400 mb-2">Focus</div>
                    <div className="flex items-center gap-2">
                      <BreadcrumbLink label="Active page" isActive size="small" theme="dark" />
                      <BreadcrumbLink label="Active page" isActive size="small" theme="dark" />
                      <BreadcrumbLink label="Previous page" isPrevious size="small" theme="dark" />
                      <BreadcrumbLink label="Previous page" size="small" theme="dark" />
                      <BreadcrumbLink label="" isIconOnly size="small" theme="dark" />
                      <BreadcrumbSeparator size="small" theme="dark" />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-gray-400 mb-2">Disabled</div>
                    <div className="flex items-center gap-2 opacity-50">
                      <BreadcrumbLink label="Active page" isActive size="small" theme="dark" />
                      <BreadcrumbLink label="Active page" isActive size="small" theme="dark" />
                      <BreadcrumbLink label="Previous page" isPrevious size="small" theme="dark" />
                      <BreadcrumbLink label="Previous page" size="small" theme="dark" />
                      <BreadcrumbLink label="" isIconOnly size="small" theme="dark" />
                      <BreadcrumbSeparator size="small" theme="dark" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Breadcrumbs/Parts/Link: X-Small</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Light Theme</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-2">Default</div>
                    <div className="flex items-center gap-1.5">
                      <BreadcrumbLink label="Active page" isActive size="x-small" theme="light" />
                      <BreadcrumbLink label="Active page" isActive size="x-small" theme="light" />
                      <BreadcrumbLink label="Previous page" isPrevious size="x-small" theme="light" />
                      <BreadcrumbLink label="Previous page" size="x-small" theme="light" />
                      <BreadcrumbLink label="" isIconOnly size="x-small" theme="light" />
                      <BreadcrumbSeparator size="x-small" theme="light" />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-2">Hover</div>
                    <div className="flex items-center gap-1.5">
                      <BreadcrumbLink label="Active page" isActive size="x-small" theme="light" />
                      <BreadcrumbLink label="Active page" isActive size="x-small" theme="light" />
                      <BreadcrumbLink label="Previous page" isPrevious size="x-small" theme="light" />
                      <BreadcrumbLink label="Previous page" size="x-small" theme="light" />
                      <BreadcrumbLink label="" isIconOnly size="x-small" theme="light" />
                      <BreadcrumbSeparator size="x-small" theme="light" />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-2">Focus</div>
                    <div className="flex items-center gap-1.5">
                      <BreadcrumbLink label="Active page" isActive size="x-small" theme="light" />
                      <BreadcrumbLink label="Active page" isActive size="x-small" theme="light" />
                      <BreadcrumbLink label="Previous page" isPrevious size="x-small" theme="light" />
                      <BreadcrumbLink label="Previous page" size="x-small" theme="light" />
                      <BreadcrumbLink label="" isIconOnly size="x-small" theme="light" />
                      <BreadcrumbSeparator size="x-small" theme="light" />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-2">Disabled</div>
                    <div className="flex items-center gap-1.5 opacity-50">
                      <BreadcrumbLink label="Active page" isActive size="x-small" theme="light" />
                      <BreadcrumbLink label="Active page" isActive size="x-small" theme="light" />
                      <BreadcrumbLink label="Previous page" isPrevious size="x-small" theme="light" />
                      <BreadcrumbLink label="Previous page" size="x-small" theme="light" />
                      <BreadcrumbLink label="" isIconOnly size="x-small" theme="light" />
                      <BreadcrumbSeparator size="x-small" theme="light" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#1C2938] p-6 rounded-lg">
                <h3 className="text-sm font-semibold text-white mb-4">Dark Theme</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-medium text-gray-400 mb-2">Default</div>
                    <div className="flex items-center gap-1.5">
                      <BreadcrumbLink label="Active page" isActive size="x-small" theme="dark" />
                      <BreadcrumbLink label="Active page" isActive size="x-small" theme="dark" />
                      <BreadcrumbLink label="Previous page" isPrevious size="x-small" theme="dark" />
                      <BreadcrumbLink label="Previous page" size="x-small" theme="dark" />
                      <BreadcrumbLink label="" isIconOnly size="x-small" theme="dark" />
                      <BreadcrumbSeparator size="x-small" theme="dark" />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-gray-400 mb-2">Hover</div>
                    <div className="flex items-center gap-1.5">
                      <BreadcrumbLink label="Active page" isActive size="x-small" theme="dark" />
                      <BreadcrumbLink label="Active page" isActive size="x-small" theme="dark" />
                      <BreadcrumbLink label="Previous page" isPrevious size="x-small" theme="dark" />
                      <BreadcrumbLink label="Previous page" size="x-small" theme="dark" />
                      <BreadcrumbLink label="" isIconOnly size="x-small" theme="dark" />
                      <BreadcrumbSeparator size="x-small" theme="dark" />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-gray-400 mb-2">Focus</div>
                    <div className="flex items-center gap-1.5">
                      <BreadcrumbLink label="Active page" isActive size="x-small" theme="dark" />
                      <BreadcrumbLink label="Active page" isActive size="x-small" theme="dark" />
                      <BreadcrumbLink label="Previous page" isPrevious size="x-small" theme="dark" />
                      <BreadcrumbLink label="Previous page" size="x-small" theme="dark" />
                      <BreadcrumbLink label="" isIconOnly size="x-small" theme="dark" />
                      <BreadcrumbSeparator size="x-small" theme="dark" />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-gray-400 mb-2">Disabled</div>
                    <div className="flex items-center gap-1.5 opacity-50">
                      <BreadcrumbLink label="Active page" isActive size="x-small" theme="dark" />
                      <BreadcrumbLink label="Active page" isActive size="x-small" theme="dark" />
                      <BreadcrumbLink label="Previous page" isPrevious size="x-small" theme="dark" />
                      <BreadcrumbLink label="Previous page" size="x-small" theme="dark" />
                      <BreadcrumbLink label="" isIconOnly size="x-small" theme="dark" />
                      <BreadcrumbSeparator size="x-small" theme="dark" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Breadcrumb Examples</h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Normal Size - Light Theme</h3>
                <div className="space-y-4">
                  <Breadcrumb
                    items={exampleItems}
                    size="normal"
                    theme="light"
                    showHomeIcon
                  />
                  <Breadcrumb
                    items={exampleItems}
                    size="normal"
                    theme="light"
                    showHomeIcon
                    showBackLink
                    onBackClick={() => console.log('Back clicked')}
                  />
                </div>
              </div>

              <div className="bg-[#1C2938] p-6 rounded-lg">
                <h3 className="text-sm font-semibold text-white mb-4">Normal Size - Dark Theme</h3>
                <div className="space-y-4">
                  <Breadcrumb
                    items={exampleItems}
                    size="normal"
                    theme="dark"
                    showHomeIcon
                  />
                  <Breadcrumb
                    items={exampleItems}
                    size="normal"
                    theme="dark"
                    showHomeIcon
                    showBackLink
                    onBackClick={() => console.log('Back clicked')}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Small Size - Light Theme</h3>
                <div className="space-y-4">
                  <Breadcrumb
                    items={exampleItems}
                    size="small"
                    theme="light"
                    showHomeIcon
                  />
                  <Breadcrumb
                    items={exampleItems}
                    size="small"
                    theme="light"
                    showHomeIcon
                    showBackLink
                    onBackClick={() => console.log('Back clicked')}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">X-Small Size - Light Theme</h3>
                <div className="space-y-4">
                  <Breadcrumb
                    items={exampleItems}
                    size="x-small"
                    theme="light"
                    showHomeIcon
                  />
                  <Breadcrumb
                    items={exampleItems}
                    size="x-small"
                    theme="light"
                    showHomeIcon
                    showBackLink
                    onBackClick={() => console.log('Back clicked')}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Usage Guidelines</h2>

            <div className="space-y-6 text-gray-700">
              <div>
                <h3 className="font-semibold mb-2 text-lg">When to Use</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>To show users their current location within the site hierarchy</li>
                  <li>To provide quick navigation back to parent pages</li>
                  <li>In complex applications with deep navigation structures</li>
                  <li>When users need to understand their context within the application</li>
                  <li>For multi-step processes where users may need to go back</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Sizes</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Normal:</strong> Default size for most use cases and primary navigation</li>
                  <li><strong className="text-[indigo-600]">Small:</strong> For compact interfaces or secondary breadcrumbs</li>
                  <li><strong className="text-[indigo-600]">X-Small:</strong> For dense layouts or minimal UI contexts</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Themes</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Light:</strong> For use on light backgrounds (default)</li>
                  <li><strong className="text-[indigo-600]">Dark:</strong> For use on dark backgrounds or dark mode interfaces</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Best Practices</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Place breadcrumbs at the top of the page, below the main header</li>
                  <li>Use clear, concise labels that match page titles</li>
                  <li>Always make the current page non-clickable</li>
                  <li>Use chevron separators for clear visual hierarchy</li>
                  <li>Include a home icon as the first element when appropriate</li>
                  <li>Limit breadcrumb depth to 5-7 levels for usability</li>
                  <li>Ensure breadcrumb links match the actual navigation structure</li>
                  <li>Consider adding a "Back to page" link for quick navigation</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Accessibility</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Use semantic HTML with nav element and aria-label="breadcrumb"</li>
                  <li>Ensure sufficient color contrast for all text (minimum 4.5:1)</li>
                  <li>Make all links keyboard accessible (Tab navigation)</li>
                  <li>Provide clear focus states for keyboard users</li>
                  <li>Use aria-current="page" for the current page</li>
                  <li>Ensure separators are presentational only (aria-hidden="true")</li>
                  <li>Test with screen readers to verify proper announcement</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
