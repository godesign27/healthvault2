import { ProgressBar } from '../components/ui/ProgressBar';

export function ProgressBarsPage() {
  const sizes = ['tiny', 'xsmall', 'small', 'normal', 'large', 'xlarge', 'xxl', 'hero'] as const;
  const percentages = [8, 10, 12, 14, 16, 20, 24, 32, 48];

  return (
    <div className="w-full min-h-0">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-content-primary mb-2">Progress Bars</h1>
          <p className="text-content-secondary">Visual indicators for task completion and loading states</p>
        </div>

        <div className="space-y-12">
          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Duration: Default</h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-content-secondary mb-4">Master</h3>
                <div className="grid grid-cols-9 gap-4">
                  {percentages.map((pct, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <p className="text-xs text-content-secondary mb-2">{pct}PX</p>
                      <div className="w-full">
                        <ProgressBar value={pct * 2} variant="master" size={sizes[idx]} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-content-secondary mb-4">Progress</h3>
                <div className="grid grid-cols-9 gap-4">
                  {percentages.map((pct, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <div className="w-full">
                        <ProgressBar value={pct * 2} variant="progress" size={sizes[idx]} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-content-secondary mb-4">Progress (With Text)</h3>
                <div className="grid grid-cols-9 gap-4">
                  {percentages.map((pct, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <div className="w-full">
                        <ProgressBar value={100} variant="progress" size={sizes[idx]} showText />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-content-secondary mb-4">Error</h3>
                <div className="grid grid-cols-9 gap-4">
                  {percentages.map((pct, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <div className="w-full">
                        <ProgressBar value={pct * 2} variant="error" size={sizes[idx]} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-content-secondary mb-4">Error (With Text)</h3>
                <div className="grid grid-cols-9 gap-4">
                  {percentages.map((pct, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <div className="w-full">
                        <ProgressBar value={100} variant="error" size={sizes[idx]} showText />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-content-secondary mb-4">Success</h3>
                <div className="grid grid-cols-9 gap-4">
                  {percentages.map((pct, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <div className="w-full">
                        <ProgressBar value={pct * 2} variant="success" size={sizes[idx]} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-content-secondary mb-4">Success (With Text)</h3>
                <div className="grid grid-cols-9 gap-4">
                  {percentages.map((pct, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <div className="w-full">
                        <ProgressBar value={100} variant="success" size={sizes[idx]} showText />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-content-secondary mb-4">Warning</h3>
                <div className="grid grid-cols-9 gap-4">
                  {percentages.map((pct, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <div className="w-full">
                        <ProgressBar value={pct * 2} variant="warning" size={sizes[idx]} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-content-secondary mb-4">Warning (With Text)</h3>
                <div className="grid grid-cols-9 gap-4">
                  {percentages.map((pct, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <div className="w-full">
                        <ProgressBar value={100} variant="warning" size={sizes[idx]} showText />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Track: Default</h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-content-secondary mb-4">Background</h3>
                <div className="grid grid-cols-9 gap-4">
                  {percentages.map((pct, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <div className="w-full">
                        <ProgressBar value={pct * 2} variant="progress" size={sizes[idx]} showTrack={false} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-content-secondary mb-4">Background (With Text)</h3>
                <div className="grid grid-cols-9 gap-4">
                  {percentages.map((pct, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <div className="w-full">
                        <ProgressBar value={100} variant="progress" size={sizes[idx]} showText showTrack={false} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Size Reference</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-stroke-subtle">
                  <tr>
                    <th className="pb-3 text-sm font-semibold text-content-secondary">Size Name</th>
                    <th className="pb-3 text-sm font-semibold text-content-secondary">Height</th>
                    <th className="pb-3 text-sm font-semibold text-content-secondary">Use Case</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke-subtle">
                  <tr>
                    <td className="py-3 text-sm font-medium">Tiny</td>
                    <td className="py-3 text-sm text-content-secondary">8px</td>
                    <td className="py-3 text-sm text-content-secondary">Minimal space, inline indicators</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-sm font-medium">X-Small</td>
                    <td className="py-3 text-sm text-content-secondary">10px</td>
                    <td className="py-3 text-sm text-content-secondary">Compact interfaces, cards</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-sm font-medium">Small</td>
                    <td className="py-3 text-sm text-content-secondary">12px</td>
                    <td className="py-3 text-sm text-content-secondary">Lists, tables</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-sm font-medium">Normal</td>
                    <td className="py-3 text-sm text-content-secondary">16px</td>
                    <td className="py-3 text-sm text-content-secondary">Default size, most common use</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-sm font-medium">Large</td>
                    <td className="py-3 text-sm text-content-secondary">20px</td>
                    <td className="py-3 text-sm text-content-secondary">Emphasized progress, dashboards</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-sm font-medium">X-Large</td>
                    <td className="py-3 text-sm text-content-secondary">24px</td>
                    <td className="py-3 text-sm text-content-secondary">High visibility requirements</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-sm font-medium">XXL</td>
                    <td className="py-3 text-sm text-content-secondary">32px</td>
                    <td className="py-3 text-sm text-content-secondary">Page-level progress</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-sm font-medium">Hero</td>
                    <td className="py-3 text-sm text-content-secondary">48px</td>
                    <td className="py-3 text-sm text-content-secondary">Splash screens, onboarding</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="hv-surface-card p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Usage Guidelines</h2>

            <div className="space-y-4 text-content-secondary">
              <div>
                <h3 className="font-semibold mb-2">When to Use</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>To show completion status of tasks or operations</li>
                  <li>For file uploads or downloads</li>
                  <li>During multi-step processes</li>
                  <li>To indicate loading states with known duration</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Variant Selection</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Progress:</strong> Default state, ongoing operations</li>
                  <li><strong>Error:</strong> Failed operations or critical issues</li>
                  <li><strong>Success:</strong> Completed tasks or achievements</li>
                  <li><strong>Warning:</strong> Operations requiring attention</li>
                  <li><strong>Master:</strong> Primary or hero sections</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Design Tokens</h3>
                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div className="border border-stroke-subtle rounded p-3">
                    <div className="h-4 bg-[indigo-600] rounded mb-2"></div>
                    <p className="text-xs font-medium">Progress</p>
                    <p className="text-xs text-content-secondary font-mono">indigo-600</p>
                  </div>
                  <div className="border border-stroke-subtle rounded p-3">
                    <div className="h-4 bg-[#C81E1E] rounded mb-2"></div>
                    <p className="text-xs font-medium">Error</p>
                    <p className="text-xs text-content-secondary font-mono">#C81E1E</p>
                  </div>
                  <div className="border border-stroke-subtle rounded p-3">
                    <div className="h-4 bg-[#0B8457] rounded mb-2"></div>
                    <p className="text-xs font-medium">Success</p>
                    <p className="text-xs text-content-secondary font-mono">#0B8457</p>
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
