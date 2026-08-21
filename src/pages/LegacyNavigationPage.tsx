import { PrimaryNavigation } from '../components/ui/PrimaryNavigation';
import { Home } from 'lucide-react';

export function LegacyNavigationPage() {
  return (
    <div className="w-full min-h-0">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-content-primary mb-2">Navigation - Legacy</h1>
          <p className="text-content-secondary">
            Legacy navigation pattern with icon-based primary navigation and flyout drawers
          </p>
        </div>

        <div className="space-y-8">
          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Navigation Links: Interactive States</h2>

            <div className="mb-8">
              <h3 className="text-lg font-semibold text-content-primary mb-4">Dark Theme</h3>
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <div className="text-sm font-medium text-content-secondary mb-3">Default</div>
                  <div className="w-20 h-20 flex items-center justify-center bg-[#1A1628]">
                    <div className="flex flex-col items-center gap-1 text-white">
                      <Home size={24} />
                      <span className="text-[10px] font-semibold">NAV 1</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-content-secondary mb-3">Hover</div>
                  <div className="w-20 h-20 flex items-center justify-center bg-[#2F2C3C]">
                    <div className="flex flex-col items-center gap-1 text-white">
                      <Home size={24} />
                      <span className="text-[10px] font-semibold">NAV 1</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-content-secondary mb-3">Active</div>
                  <div className="w-20 h-20 flex items-center justify-center bg-[indigo-700]">
                    <div className="flex flex-col items-center gap-1 text-white">
                      <Home size={24} />
                      <span className="text-[10px] font-semibold">NAV 1</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-content-secondary mb-3">Pressed</div>
                  <div className="w-20 h-20 flex items-center justify-center bg-[#27504A]">
                    <div className="flex flex-col items-center gap-1 text-white">
                      <Home size={24} />
                      <span className="text-[10px] font-semibold">NAV 1</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-content-primary mb-4">Light Theme</h3>
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <div className="text-sm font-medium text-content-secondary mb-3">Default</div>
                  <div className="w-20 h-20 flex items-center justify-center bg-surface-raised border border-stroke-subtle">
                    <div className="flex flex-col items-center gap-1 text-[#454250]">
                      <Home size={24} />
                      <span className="text-[10px] font-semibold">NAV 1</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-content-secondary mb-3">Hover</div>
                  <div className="w-20 h-20 flex items-center justify-center bg-[#E7E6E8]">
                    <div className="flex flex-col items-center gap-1 text-[#454250]">
                      <Home size={24} />
                      <span className="text-[10px] font-semibold">NAV 1</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-content-secondary mb-3">Active</div>
                  <div className="w-20 h-20 flex items-center justify-center bg-[#DFF1F2]">
                    <div className="flex flex-col items-center gap-1 text-[indigo-700]">
                      <Home size={24} />
                      <span className="text-[10px] font-semibold">NAV 1</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-content-secondary mb-3">Pressed</div>
                  <div className="w-20 h-20 flex items-center justify-center bg-[#73BAC0]">
                    <div className="flex flex-col items-center gap-1 text-white">
                      <Home size={24} />
                      <span className="text-[10px] font-semibold">NAV 1</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Drawer: Interactive States</h2>

            <div className="mb-8">
              <h3 className="text-lg font-semibold text-content-primary mb-4">Dark Drawer</h3>
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <div className="text-sm font-medium text-content-secondary mb-3">Default</div>
                  <div className="w-48 bg-[#1A1628] p-4">
                    <span className="text-[14px] text-white">SUBMENU ITEM 1</span>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-content-secondary mb-3">Hover</div>
                  <div className="w-48 bg-[#2F2C3C] p-4">
                    <span className="text-[14px] text-white">SUBMENU ITEM 1</span>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-content-secondary mb-3">Active</div>
                  <div className="w-48 bg-[#2F2C3C] p-4">
                    <span className="text-[14px] text-white">SUBMENU ITEM 1</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-content-primary mb-4">Light Drawer (Mixed Mode)</h3>
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <div className="text-sm font-medium text-content-secondary mb-3">Default</div>
                  <div className="w-48 bg-surface-raised border border-stroke-subtle p-4">
                    <span className="text-[14px] text-[#454250]">SUBMENU ITEM 1</span>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-content-secondary mb-3">Hover</div>
                  <div className="w-48 bg-surface-sunken border border-stroke-subtle p-4">
                    <span className="text-[14px] text-[#454250]">SUBMENU ITEM 1</span>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-content-secondary mb-3">Active</div>
                  <div className="w-48 bg-[#E7E6E8] border border-stroke-subtle p-4">
                    <span className="text-[14px] text-[indigo-700]">SUBMENU ITEM 1</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Full Navigation Examples</h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-content-primary mb-4">Dark Theme</h3>
                <div className="border border-stroke-subtle rounded-lg overflow-hidden" style={{ height: '600px' }}>
                  <PrimaryNavigation variant="expanded" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-content-primary mb-4">Collapsed Variant</h3>
                <div className="border border-stroke-subtle rounded-lg overflow-hidden" style={{ height: '600px' }}>
                  <PrimaryNavigation variant="collapsed" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-content-primary mb-4">Sidebar Variant</h3>
                <div className="border border-stroke-subtle rounded-lg overflow-hidden" style={{ height: '600px' }}>
                  <PrimaryNavigation variant="sidebar" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
