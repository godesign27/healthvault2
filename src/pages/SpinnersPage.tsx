import { useState } from 'react';
import { Spinner, SpinnerOverlay, InlineSpinner } from '../components/ui/Spinner';

export function SpinnersPage() {
  const [showOverlay, setShowOverlay] = useState(false);

  const handleShowOverlay = () => {
    setShowOverlay(true);
    setTimeout(() => setShowOverlay(false), 3000);
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Spinners</h1>
          <p className="text-gray-600">
            Loading indicators to show ongoing processes
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Interactive Examples</h2>

          <div className="space-y-12">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Spinner Sizes</h3>
              <div className="flex items-end gap-8">
                <div className="flex flex-col items-center gap-3">
                  <Spinner size="sm" />
                  <span className="text-sm text-gray-600">Small</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <Spinner size="md" />
                  <span className="text-sm text-gray-600">Medium</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <Spinner size="lg" />
                  <span className="text-sm text-gray-600">Large</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <Spinner size="xl" />
                  <span className="text-sm text-gray-600">Extra Large</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Spinner Colors</h3>
              <div className="flex flex-wrap gap-8">
                <div className="flex flex-col items-center gap-3">
                  <Spinner color="primary" />
                  <span className="text-sm text-gray-600">Primary</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <Spinner color="secondary" />
                  <span className="text-sm text-gray-600">Secondary</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <Spinner color="success" />
                  <span className="text-sm text-gray-600">Success</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <Spinner color="error" />
                  <span className="text-sm text-gray-600">Error</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <Spinner color="warning" />
                  <span className="text-sm text-gray-600">Warning</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <Spinner color="info" />
                  <span className="text-sm text-gray-600">Info</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Inline Spinners</h3>
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <InlineSpinner message="Loading data..." />
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <InlineSpinner message="Processing request..." size="lg" color="success" />
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <InlineSpinner message="Saving changes..." size="sm" color="warning" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Overlay Spinner</h3>
              <p className="text-sm text-gray-600 mb-4">
                Click the button below to see a full-page loading overlay
              </p>
              <button
                onClick={handleShowOverlay}
                className="px-6 py-3 bg-[indigo-600] text-white rounded-lg hover:bg-[indigo-700] transition-colors font-medium"
              >
                Show Loading Overlay
              </button>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">In Context Examples</h3>
              <div className="space-y-6">
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Button Loading State</h4>
                  </div>
                  <div className="flex gap-4">
                    <button className="px-6 py-3 bg-[indigo-600] text-white rounded-lg hover:bg-[indigo-700] transition-colors font-medium flex items-center gap-3">
                      <Spinner size="sm" className="text-white" />
                      Loading...
                    </button>
                    <button className="px-6 py-3 bg-gray-200 text-gray-400 rounded-lg cursor-not-allowed font-medium flex items-center gap-3">
                      <Spinner size="sm" color="secondary" />
                      Processing
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Card Loading State</h4>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-12 flex flex-col items-center justify-center gap-4">
                    <Spinner size="lg" />
                    <p className="text-gray-600">Loading content...</p>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Table Loading State</h4>
                  </div>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td colSpan={3} className="px-6 py-12">
                            <div className="flex flex-col items-center justify-center gap-3">
                              <Spinner />
                              <p className="text-gray-600 text-sm">Loading data...</p>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Usage Guidelines</h2>
          <div className="prose max-w-none">
            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">When to Use</h3>
            <ul className="text-gray-600 space-y-2">
              <li>To indicate that content is loading or processing</li>
              <li>During asynchronous operations like API calls</li>
              <li>When saving or submitting data</li>
              <li>During page transitions or content updates</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Best Practices</h3>
            <ul className="text-gray-600 space-y-2">
              <li>Use appropriate sizes based on the context (small for buttons, large for pages)</li>
              <li>Always provide context with loading messages when possible</li>
              <li>Use overlay spinners sparingly for critical blocking operations</li>
              <li>Match spinner colors to your action context (success, error, etc.)</li>
              <li>Don't use spinners for operations that complete in under 300ms</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Accessibility</h3>
            <ul className="text-gray-600 space-y-2">
              <li>Spinners should be accompanied by loading text for screen readers</li>
              <li>Use aria-live regions to announce loading states</li>
              <li>Ensure sufficient color contrast for spinner visibility</li>
              <li>Provide alternative text descriptions for loading operations</li>
            </ul>
          </div>
        </div>
      </div>

      {showOverlay && <SpinnerOverlay message="Loading, please wait..." />}
    </div>
  );
}
