import { useState } from 'react';
import { Toast } from '../components/ui/Toast';
import { Banner } from '../components/ui/Banner';

export function NotificationsPage() {
  const [showToasts, setShowToasts] = useState(true);
  const [showBanners, setShowBanners] = useState(true);

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Notifications</h1>
          <p className="text-gray-600">Toast messages and banner notifications for user feedback</p>
        </div>

        <div className="space-y-12">
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Toast Notifications</h2>

            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">Inline Style</h3>
                  <button
                    onClick={() => setShowToasts(!showToasts)}
                    className="px-4 py-2 bg-[indigo-600] text-white rounded hover:bg-[#156570] transition-colors text-sm"
                  >
                    {showToasts ? 'Hide' : 'Show'} Toasts
                  </button>
                </div>
                {showToasts && (
                  <div className="space-y-3">
                    <Toast
                      message="This is an info message"
                      variant="info"
                      style="inline"
                      onClose={() => {}}
                    />
                    <Toast
                      message="This is an error message"
                      variant="error"
                      style="inline"
                      onClose={() => {}}
                    />
                    <Toast
                      message="This is a success message"
                      variant="success"
                      style="inline"
                      onClose={() => {}}
                    />
                    <Toast
                      message="This is a warning message"
                      variant="warning"
                      style="inline"
                      onClose={() => {}}
                    />
                    <Toast
                      message="Loading your data..."
                      variant="loading"
                      style="inline"
                    />
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Solid Style</h3>
                <div className="space-y-3">
                  <Toast
                    message="This is an info message"
                    variant="info"
                    style="solid"
                    onClose={() => {}}
                  />
                  <Toast
                    message="This is an error message"
                    variant="error"
                    style="solid"
                    onClose={() => {}}
                  />
                  <Toast
                    message="This is a success message"
                    variant="success"
                    style="solid"
                    onClose={() => {}}
                  />
                  <Toast
                    message="This is a warning message"
                    variant="warning"
                    style="solid"
                    onClose={() => {}}
                  />
                  <Toast
                    message="Processing your request..."
                    variant="loading"
                    style="solid"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Banner Notifications</h2>

            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">Outline Style</h3>
                  <button
                    onClick={() => setShowBanners(!showBanners)}
                    className="px-4 py-2 bg-[indigo-600] text-white rounded hover:bg-[#156570] transition-colors text-sm"
                  >
                    {showBanners ? 'Hide' : 'Show'} Banners
                  </button>
                </div>
                {showBanners && (
                  <div className="space-y-3">
                    <Banner
                      message="This is an info banner"
                      variant="info"
                      style="outline"
                      onClose={() => {}}
                    />
                    <Banner
                      message="This is an error banner"
                      variant="error"
                      style="outline"
                      onClose={() => {}}
                    />
                    <Banner
                      message="This is a success banner"
                      variant="success"
                      style="outline"
                      onClose={() => {}}
                    />
                    <Banner
                      message="This is a warning banner"
                      variant="warning"
                      style="outline"
                      onClose={() => {}}
                    />
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Solid Style</h3>
                <div className="space-y-3">
                  <Banner
                    message="This is an info banner"
                    variant="info"
                    style="solid"
                    onClose={() => {}}
                  />
                  <Banner
                    message="This is an error banner"
                    variant="error"
                    style="solid"
                    onClose={() => {}}
                  />
                  <Banner
                    message="This is a success banner"
                    variant="success"
                    style="solid"
                    onClose={() => {}}
                  />
                  <Banner
                    message="This is a warning banner"
                    variant="warning"
                    style="solid"
                    onClose={() => {}}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Light Style</h3>
                <div className="space-y-3">
                  <Banner
                    message="This is an info banner"
                    variant="info"
                    style="light"
                    onClose={() => {}}
                  />
                  <Banner
                    message="This is an error banner"
                    variant="error"
                    style="light"
                    onClose={() => {}}
                  />
                  <Banner
                    message="This is a success banner"
                    variant="success"
                    style="light"
                    onClose={() => {}}
                  />
                  <Banner
                    message="This is a warning banner"
                    variant="warning"
                    style="light"
                    onClose={() => {}}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Usage Guidelines</h2>

            <div className="space-y-6 text-gray-700">
              <div>
                <h3 className="font-semibold mb-2">Toast vs Banner</h3>
                <div className="grid md:grid-cols-2 gap-4 mt-3">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-[indigo-600] mb-2">Toast Notifications</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Temporary, auto-dismissing messages</li>
                      <li>Non-critical information</li>
                      <li>Success confirmations</li>
                      <li>Usually appear in corner of screen</li>
                      <li>Should not block user interaction</li>
                    </ul>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-[indigo-600] mb-2">Banner Notifications</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Persistent until dismissed</li>
                      <li>Important system-wide messages</li>
                      <li>Warnings or errors requiring attention</li>
                      <li>Full-width, prominent display</li>
                      <li>Can block or interrupt workflow</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Variant Selection</h3>
                <div className="space-y-2 ml-2">
                  <div className="flex items-start gap-3">
                    <div className="w-4 h-4 bg-[#3B9CFF] rounded mt-0.5"></div>
                    <div>
                      <strong>Info:</strong> General information, tips, or neutral updates
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-4 h-4 bg-[#C81E1E] rounded mt-0.5"></div>
                    <div>
                      <strong>Error:</strong> Failed operations, validation errors, critical issues
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-4 h-4 bg-[#0B8457] rounded mt-0.5"></div>
                    <div>
                      <strong>Success:</strong> Completed actions, confirmations, achievements
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-4 h-4 bg-[#8B6914] rounded mt-0.5"></div>
                    <div>
                      <strong>Warning:</strong> Potential issues, important notices, caution messages
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-4 h-4 bg-gray-400 rounded mt-0.5"></div>
                    <div>
                      <strong>Loading:</strong> In-progress operations, processing states
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Best Practices</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Keep messages concise and actionable</li>
                  <li>Use appropriate variant for the message context</li>
                  <li>Always provide a way to dismiss notifications</li>
                  <li>Avoid showing multiple notifications simultaneously</li>
                  <li>Use loading state for operations that take time</li>
                  <li>Match the notification style to its importance</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Accessibility</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Notifications should be announced to screen readers</li>
                  <li>Error messages must be clear and descriptive</li>
                  <li>Ensure sufficient color contrast for all styles</li>
                  <li>Provide keyboard navigation for dismissal</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
