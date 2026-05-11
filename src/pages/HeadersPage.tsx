import { Header } from '../components/ui/Header';

export function HeadersPage() {
  return (
    <div className="w-full min-h-0">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-content-primary mb-2">Headers</h1>
          <p className="text-content-secondary">Page headers with context, actions, and navigation elements</p>
        </div>

        <div className="space-y-12">
          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Header Variations</h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-content-secondary mb-4">Full Header</h3>
                <div className="border border-stroke-subtle rounded-lg overflow-hidden">
                  <Header
                    title="ALIGNMENTS"
                    showStatus={true}
                    showDate={true}
                    showActions={true}
                    showLanguage={true}
                  />
                </div>
                <p className="text-sm text-content-secondary mt-3">
                  Complete header with title badge, status indicator, date, action menu, and language selector.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-content-secondary mb-4">With Search and Filter</h3>
                <div className="border border-stroke-subtle rounded-lg overflow-hidden">
                  <Header
                    title="ALIGNMENTS"
                    showStatus={true}
                    showDate={true}
                    showActions={true}
                    showSearch={true}
                    showFilter={true}
                    showLanguage={true}
                  />
                </div>
                <p className="text-sm text-content-secondary mt-3">
                  Header with additional search and filter controls for data-heavy interfaces.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-content-secondary mb-4">Minimal Header</h3>
                <div className="border border-stroke-subtle rounded-lg overflow-hidden">
                  <Header
                    title="DASHBOARD"
                    showStatus={false}
                    showDate={false}
                    showActions={false}
                    showLanguage={false}
                  />
                </div>
                <p className="text-sm text-content-secondary mt-3">
                  Simplified header with just the title badge, suitable for simple pages.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-content-secondary mb-4">With Status and Date Only</h3>
                <div className="border border-stroke-subtle rounded-lg overflow-hidden">
                  <Header
                    title="REPORTS"
                    showStatus={true}
                    showDate={true}
                    showActions={false}
                    showLanguage={false}
                  />
                </div>
                <p className="text-sm text-content-secondary mt-3">
                  Header focused on context information without action elements.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-content-secondary mb-4">With Language Selector</h3>
                <div className="border border-stroke-subtle rounded-lg overflow-hidden">
                  <Header
                    title="SETTINGS"
                    showStatus={false}
                    showDate={false}
                    showActions={false}
                    showLanguage={true}
                  />
                </div>
                <p className="text-sm text-content-secondary mt-3">
                  Header with language localization dropdown for international applications.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Header Elements</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-content-secondary mb-3">Title Badge</h3>
                <div className="flex gap-4">
                  <span className="bg-[#EC7200] text-white px-4 py-1.5 rounded font-semibold text-sm uppercase">
                    ALIGNMENTS
                  </span>
                  <span className="bg-[#EC7200] text-white px-4 py-1.5 rounded font-semibold text-sm uppercase">
                    DASHBOARD
                  </span>
                  <span className="bg-[#EC7200] text-white px-4 py-1.5 rounded font-semibold text-sm uppercase">
                    REPORTS
                  </span>
                </div>
                <p className="text-sm text-content-secondary mt-3">
                  Orange secondary color used to identify the current section or module. Always uppercase.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-content-secondary mb-3">Status Indicator</h3>
                <div className="flex gap-4">
                  <span className="bg-[#2364C7] text-white px-4 py-1.5 rounded font-semibold text-sm">
                    ACTIVE
                  </span>
                  <span className="bg-[#B21111] text-white px-4 py-1.5 rounded font-semibold text-sm">
                    INACTIVE
                  </span>
                  <span className="bg-[#00A663] text-white px-4 py-1.5 rounded font-semibold text-sm">
                    COMPLETED
                  </span>
                  <span className="bg-[#C17509] text-white px-4 py-1.5 rounded font-semibold text-sm">
                    PENDING
                  </span>
                </div>
                <p className="text-sm text-content-secondary mt-3">
                  Status badges using semantic colors to indicate the current state or mode.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-content-secondary mb-3">Action Buttons</h3>
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <button className="flex items-center gap-2 px-4 py-1.5 bg-[indigo-600] text-white rounded hover:bg-[#156570] transition-colors text-sm font-medium">
                      Configurations
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button className="p-2 hover:bg-surface-sunken rounded transition-colors">
                      <svg className="w-5 h-5 text-content-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                    <button className="p-2 hover:bg-surface-sunken rounded transition-colors">
                      <svg className="w-5 h-5 text-content-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-content-secondary">
                    Teal primary buttons for primary actions with dropdown menus. Icon buttons for secondary actions.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-content-secondary mb-3">Language Dropdown</h3>
                <div className="inline-block">
                  <button className="flex items-center gap-2 px-4 py-1.5 bg-[indigo-600] text-white rounded hover:bg-[#156570] transition-colors text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    English
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-content-secondary mt-3">
                  Localization selector for switching between supported languages.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Usage Guidelines</h2>

            <div className="space-y-6 text-content-secondary">
              <div>
                <h3 className="font-semibold mb-2 text-lg">When to Use</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>At the top of every page to provide context and actions</li>
                  <li>To display the current section, module, or workflow</li>
                  <li>To provide quick access to key actions and filters</li>
                  <li>To show relevant metadata (dates, status, etc.)</li>
                  <li>For language or localization switching</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Element Guidelines</h3>
                <div className="space-y-3 ml-2">
                  <div>
                    <strong className="text-[indigo-600]">Title Badge:</strong>
                    <p className="text-sm mt-1">
                      Always use uppercase text. Keep it short (1-2 words). Use the secondary orange color.
                      This helps users quickly identify their current location.
                    </p>
                  </div>
                  <div>
                    <strong className="text-[indigo-600]">Status Indicator:</strong>
                    <p className="text-sm mt-1">
                      Use semantic colors consistently. Keep status labels short and descriptive.
                      Common statuses: ACTIVE, INACTIVE, PENDING, COMPLETED.
                    </p>
                  </div>
                  <div>
                    <strong className="text-[indigo-600]">Date Display:</strong>
                    <p className="text-sm mt-1">
                      Include a calendar icon for clarity. Use consistent date formatting across the application.
                      Show relevant context (e.g., "Cardiology - Apr 22, 2020").
                    </p>
                  </div>
                  <div>
                    <strong className="text-[indigo-600]">Action Buttons:</strong>
                    <p className="text-sm mt-1">
                      Place primary actions on the right side. Use dropdowns for multiple related actions.
                      Icon-only buttons for common actions like search and filter.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Best Practices</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Keep headers consistent across the application</li>
                  <li>Limit the number of elements to avoid clutter</li>
                  <li>Prioritize the most important actions and information</li>
                  <li>Use dropdown menus to group related actions</li>
                  <li>Ensure headers are responsive on mobile devices</li>
                  <li>Maintain proper spacing between elements</li>
                  <li>Test dropdown positioning to avoid overflow</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Design Tokens</h3>
                <div className="grid md:grid-cols-3 gap-4 mt-3">
                  <div className="border border-stroke-subtle rounded p-4">
                    <div className="h-12 bg-[#EC7200] rounded mb-2"></div>
                    <p className="text-xs font-medium">Title Badge</p>
                    <p className="text-xs text-content-secondary font-mono">#EC7200</p>
                  </div>
                  <div className="border border-stroke-subtle rounded p-4">
                    <div className="h-12 bg-[indigo-600] rounded mb-2"></div>
                    <p className="text-xs font-medium">Primary Actions</p>
                    <p className="text-xs text-content-secondary font-mono">indigo-600</p>
                  </div>
                  <div className="border border-stroke-subtle rounded p-4">
                    <div className="h-12 bg-[#2364C7] rounded mb-2"></div>
                    <p className="text-xs font-medium">Active Status</p>
                    <p className="text-xs text-content-secondary font-mono">#2364C7</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Accessibility</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>All buttons and dropdowns must be keyboard accessible</li>
                  <li>Provide clear focus indicators for all interactive elements</li>
                  <li>Use semantic HTML (header, nav elements)</li>
                  <li>Include descriptive aria-labels for icon-only buttons</li>
                  <li>Ensure sufficient color contrast for text and badges</li>
                  <li>Dropdown menus should be navigable with arrow keys</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
