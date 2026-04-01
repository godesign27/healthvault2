import { useState } from 'react';
import { RadioButton } from '../components/ui/RadioButton';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Toast } from '../components/ui/Toast';
import { Banner } from '../components/ui/Banner';
import { PopupMenu } from '../components/ui/PopupMenu';

export function ShowcasePage() {
  const [selectedRadio, setSelectedRadio] = useState<string>('option1');
  const [showToast, setShowToast] = useState(true);
  const [showBanner, setShowBanner] = useState(true);

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Design System Showcase</h1>
          <p className="text-gray-600">Explore the ZAIDYN design system components and patterns</p>
        </div>

        <div className="space-y-12">
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Radio Buttons</h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Without Labels</h3>
                <div className="grid grid-cols-6 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Default</p>
                    <RadioButton size="16px" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Hover</p>
                    <RadioButton size="16px" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Disabled</p>
                    <RadioButton size="16px" disabled />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Selected</p>
                    <RadioButton size="16px" checked />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Selected Disabled</p>
                    <RadioButton size="16px" checked disabled />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Focus</p>
                    <RadioButton size="16px" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">With Labels</h3>
                <div className="space-y-3">
                  <RadioButton
                    label="Option 1"
                    size="16px"
                    checked={selectedRadio === 'option1'}
                    onChange={() => setSelectedRadio('option1')}
                    name="radio-group"
                  />
                  <RadioButton
                    label="Option 2"
                    size="16px"
                    checked={selectedRadio === 'option2'}
                    onChange={() => setSelectedRadio('option2')}
                    name="radio-group"
                  />
                  <RadioButton
                    label="Option 3 (Disabled)"
                    size="16px"
                    disabled
                    name="radio-group"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Progress Bars</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-3">Progress</h3>
                <div className="space-y-3">
                  <ProgressBar value={10} variant="progress" size="tiny" />
                  <ProgressBar value={20} variant="progress" size="xsmall" />
                  <ProgressBar value={40} variant="progress" size="small" showText />
                  <ProgressBar value={60} variant="progress" size="normal" showText />
                  <ProgressBar value={80} variant="progress" size="large" showText />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-3">Error</h3>
                <div className="space-y-3">
                  <ProgressBar value={30} variant="error" size="small" />
                  <ProgressBar value={60} variant="error" size="normal" showText />
                  <ProgressBar value={90} variant="error" size="large" showText />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-3">Success</h3>
                <div className="space-y-3">
                  <ProgressBar value={40} variant="success" size="small" />
                  <ProgressBar value={70} variant="success" size="normal" showText />
                  <ProgressBar value={100} variant="success" size="large" showText />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-3">Warning</h3>
                <div className="space-y-3">
                  <ProgressBar value={25} variant="warning" size="small" />
                  <ProgressBar value={50} variant="warning" size="normal" showText />
                  <ProgressBar value={75} variant="warning" size="large" showText />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Notifications</h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Toasts</h3>
                <div className="space-y-3">
                  {showToast && (
                    <>
                      <Toast
                        message="This is an info message"
                        variant="info"
                        style="inline"
                        onClose={() => setShowToast(false)}
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
                        message="Loading data..."
                        variant="loading"
                        style="inline"
                      />
                    </>
                  )}
                  {!showToast && (
                    <button
                      onClick={() => setShowToast(true)}
                      className="px-4 py-2 bg-[indigo-600] text-white rounded hover:bg-[#156570] transition-colors"
                    >
                      Show Toasts
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Banners</h3>
                <div className="space-y-3">
                  {showBanner && (
                    <>
                      <Banner
                        message="This is an info banner"
                        variant="info"
                        style="outline"
                        onClose={() => setShowBanner(false)}
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
                        style="light"
                        onClose={() => {}}
                      />
                    </>
                  )}
                  {!showBanner && (
                    <button
                      onClick={() => setShowBanner(true)}
                      className="px-4 py-2 bg-[indigo-600] text-white rounded hover:bg-[#156570] transition-colors"
                    >
                      Show Banners
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Pop-Up Menus</h2>

            <div className="grid grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-3">Normal</h3>
                <PopupMenu
                  size="normal"
                  items={[
                    { label: 'Menu item 1' },
                    { label: 'Menu item 2' },
                    { label: 'Menu item 3' },
                    { label: 'Menu item 4' },
                    { label: 'Submenu', submenu: [] },
                    { label: 'Menu item 5' }
                  ]}
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-3">Small</h3>
                <PopupMenu
                  size="small"
                  items={[
                    { label: 'Menu item 1' },
                    { label: 'Menu item 2' },
                    { label: 'Menu item 3' },
                    { label: 'Menu item 4' },
                    { label: 'Submenu', submenu: [] },
                    { label: 'Menu item 5' }
                  ]}
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-3">X-Small</h3>
                <PopupMenu
                  size="xsmall"
                  items={[
                    { label: 'Menu item 1' },
                    { label: 'Menu item 2' },
                    { label: 'Menu item 3' },
                    { label: 'Menu item 4' },
                    { label: 'Submenu', submenu: [] },
                    { label: 'Menu item 5' }
                  ]}
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Design Tokens</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Colors</h3>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { name: 'Primary Dark', value: '#1C2938' },
                    { name: 'Teal Primary', value: 'indigo-600' },
                    { name: 'Focus Blue', value: '#3B9CFF' },
                    { name: 'Error Red', value: '#C81E1E' },
                    { name: 'Success Green', value: '#0B8457' },
                    { name: 'Warning Gold', value: '#8B6914' },
                    { name: 'Background Light', value: '#F5F5F5' },
                    { name: 'White', value: '#FFFFFF' }
                  ].map((color) => (
                    <div key={color.name} className="border border-gray-200 rounded p-3">
                      <div
                        className="h-16 rounded mb-2 border border-gray-200"
                        style={{ backgroundColor: color.value }}
                      />
                      <p className="text-sm font-medium text-gray-900">{color.name}</p>
                      <p className="text-xs text-gray-500 font-mono">{color.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Spacing</h3>
                <div className="space-y-3">
                  {[
                    { name: '8px', value: '0.5rem' },
                    { name: '16px', value: '1rem' },
                    { name: '24px', value: '1.5rem' },
                    { name: '32px', value: '2rem' }
                  ].map((spacing) => (
                    <div key={spacing.name} className="flex items-center gap-4">
                      <div
                        className="bg-[indigo-600] h-8"
                        style={{ width: spacing.value }}
                      />
                      <span className="text-sm font-medium text-gray-900">{spacing.name}</span>
                      <span className="text-xs text-gray-500 font-mono">{spacing.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
