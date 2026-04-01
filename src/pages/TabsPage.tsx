import { SimpleTab, Tabs } from '../components/ui/Tab';
import { useState } from 'react';

export function TabsPage() {
  const [activeTab, setActiveTab] = useState('tab1');

  const exampleTabs = [
    { id: 'tab1', label: 'Tab 1', content: <div className="text-gray-700">Content for Tab 1</div> },
    { id: 'tab2', label: 'Tab 2', content: <div className="text-gray-700">Content for Tab 2</div> },
    { id: 'tab3', label: 'Tab 3', content: <div className="text-gray-700">Content for Tab 3</div> },
    { id: 'tab4', label: 'Tab 4', content: <div className="text-gray-700">Content for Tab 4</div> },
    { id: 'tab5', label: 'Tab 5', content: <div className="text-gray-700">Content for Tab 5</div> }
  ];

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Tabs</h1>
          <p className="text-gray-600">
            Navigation component for switching between different views
          </p>
        </div>

        <div className="space-y-8">
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Master Components <span className="text-base font-normal text-gray-500">(for UI Kit building only)</span>
            </h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4">Normal (16)</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs text-gray-500 mb-2">NORMAL LIST</div>
                    <div className="border-2 border-dashed border-[#9B85D8] rounded p-4 space-y-2">
                      <div className="flex gap-2">
                        <SimpleTab label="Tab 1" active size="normal" style="solid" />
                        <SimpleTab label="Tab 1" closeable size="normal" style="solid" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-2">OUTLINE</div>
                    <div className="border-2 border-dashed border-[#9B85D8] rounded p-4 space-y-2">
                      <div className="flex gap-2">
                        <SimpleTab label="Tab 1" active size="normal" style="outline" />
                        <SimpleTab label="Tab 1" closeable size="normal" style="outline" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4">Small (14)</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs text-gray-500 mb-2">SMALL LIST</div>
                    <div className="border-2 border-dashed border-[#9B85D8] rounded p-4 space-y-2">
                      <div className="flex gap-2">
                        <SimpleTab label="Tab 1" active size="small" style="solid" />
                        <SimpleTab label="Tab 1" closeable size="small" style="solid" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-2">SMALL LIST</div>
                    <div className="border-2 border-dashed border-[#9B85D8] rounded p-4 space-y-2">
                      <div className="flex gap-2">
                        <SimpleTab label="Tab 1" active size="small" style="outline" />
                        <SimpleTab label="Tab 1" closeable size="small" style="outline" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4">Vertical Tab</h3>
                <div className="border-2 border-dashed border-[#9B85D8] rounded p-4 inline-block">
                  <div className="flex flex-col border-r border-gray-200">
                    <SimpleTab label="Normal tab" active size="normal" style="outline" className="border-b-0 border-r-2 border-r-[indigo-600]" />
                    <SimpleTab label="Normal tab" size="normal" style="outline" className="border-b-0 border-r-2 border-r-transparent" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Solid Tab</h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4 bg-gray-100 p-2">Normal (16)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-300">
                        <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase"></th>
                        <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Default</th>
                        <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Active</th>
                        <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Hover</th>
                        <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Pressed</th>
                        <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Focused Default</th>
                        <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Disabled</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="p-4 text-sm font-medium text-gray-700 bg-gray-50">Default</td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" size="normal" style="solid" state="default" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" active size="normal" style="solid" state="active" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" size="normal" style="solid" state="hover" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" size="normal" style="solid" state="pressed" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" size="normal" style="solid" state="focused" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" disabled size="normal" style="solid" />
                          </div>
                        </td>
                      </tr>

                      <tr className="border-b border-gray-200">
                        <td className="p-4 text-sm font-medium text-gray-700 bg-gray-50">Closeable</td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" closeable size="normal" style="solid" state="default" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" active closeable size="normal" style="solid" state="active" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" closeable size="normal" style="solid" state="hover" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" closeable size="normal" style="solid" state="pressed" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" closeable size="normal" style="solid" state="focused" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" disabled closeable size="normal" style="solid" />
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4 bg-gray-100 p-2">Small (14)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-300">
                        <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase"></th>
                        <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Default</th>
                        <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Active</th>
                        <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Hover</th>
                        <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Pressed</th>
                        <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Focused Default</th>
                        <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Disabled</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="p-4 text-sm font-medium text-gray-700 bg-gray-50">Default</td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" size="small" style="solid" state="default" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" active size="small" style="solid" state="active" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" size="small" style="solid" state="hover" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" size="small" style="solid" state="pressed" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" size="small" style="solid" state="focused" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" disabled size="small" style="solid" />
                          </div>
                        </td>
                      </tr>

                      <tr className="border-b border-gray-200">
                        <td className="p-4 text-sm font-medium text-gray-700 bg-gray-50">Closeable</td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" closeable size="small" style="solid" state="default" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" active closeable size="small" style="solid" state="active" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" closeable size="small" style="solid" state="hover" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" closeable size="small" style="solid" state="pressed" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" closeable size="small" style="solid" state="focused" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" disabled closeable size="small" style="solid" />
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Outline Tab</h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4 bg-gray-100 p-2">Normal (16)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-300">
                        <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase"></th>
                        <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Default</th>
                        <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Active</th>
                        <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Hover</th>
                        <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Pressed</th>
                        <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Focused Default</th>
                        <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Disabled</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="p-4 text-sm font-medium text-gray-700 bg-gray-50">Default</td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" size="normal" style="outline" state="default" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" active size="normal" style="outline" state="active" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" size="normal" style="outline" state="hover" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" size="normal" style="outline" state="pressed" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" size="normal" style="outline" state="focused" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" disabled size="normal" style="outline" />
                          </div>
                        </td>
                      </tr>

                      <tr className="border-b border-gray-200">
                        <td className="p-4 text-sm font-medium text-gray-700 bg-gray-50">Closeable</td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" closeable size="normal" style="outline" state="default" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" active closeable size="normal" style="outline" state="active" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" closeable size="normal" style="outline" state="hover" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" closeable size="normal" style="outline" state="pressed" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" closeable size="normal" style="outline" state="focused" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" disabled closeable size="normal" style="outline" />
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4 bg-gray-100 p-2">Small (14)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-300">
                        <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase"></th>
                        <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Default</th>
                        <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Active</th>
                        <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Hover</th>
                        <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Pressed</th>
                        <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Focused Default</th>
                        <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Disabled</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="p-4 text-sm font-medium text-gray-700 bg-gray-50">Default</td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" size="small" style="outline" state="default" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" active size="small" style="outline" state="active" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" size="small" style="outline" state="hover" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" size="small" style="outline" state="pressed" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" size="small" style="outline" state="focused" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" disabled size="small" style="outline" />
                          </div>
                        </td>
                      </tr>

                      <tr className="border-b border-gray-200">
                        <td className="p-4 text-sm font-medium text-gray-700 bg-gray-50">Closeable</td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" closeable size="small" style="outline" state="default" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" active closeable size="small" style="outline" state="active" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" closeable size="small" style="outline" state="hover" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" closeable size="small" style="outline" state="pressed" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" closeable size="small" style="outline" state="focused" />
                          </div>
                        </td>
                        <td className="p-4 text-center bg-gray-50">
                          <div className="flex justify-center">
                            <SimpleTab label="Tab 1" disabled closeable size="small" style="outline" />
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Examples</h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4">Solid Tabs</h3>
                <Tabs
                  tabs={exampleTabs}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  style="solid"
                  size="normal"
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4">Outline Tabs</h3>
                <Tabs
                  tabs={exampleTabs}
                  style="outline"
                  size="normal"
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4">Small Tabs</h3>
                <Tabs
                  tabs={exampleTabs}
                  style="solid"
                  size="small"
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Vertical Tab</h2>

            <div className="border border-gray-200 rounded inline-block">
              <Tabs
                tabs={exampleTabs}
                style="outline"
                size="normal"
                orientation="vertical"
              />
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Usage Guidelines</h2>

            <div className="space-y-6 text-gray-700">
              <div>
                <h3 className="font-semibold mb-2 text-lg">When to Use</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>To organize related content into separate views</li>
                  <li>When users need to switch between multiple sections frequently</li>
                  <li>To reduce page scrolling and improve content organization</li>
                  <li>For settings panels with multiple categories</li>
                  <li>To display different data views or filters</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Best Practices</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Keep tab labels short and descriptive</li>
                  <li>Use 3-7 tabs for optimal usability</li>
                  <li>Make the active tab clearly visible</li>
                  <li>Maintain tab state when users navigate away and return</li>
                  <li>Use consistent tab ordering across the application</li>
                  <li>Consider vertical tabs for narrow viewports or many tabs</li>
                  <li>Enable keyboard navigation (arrow keys, Tab)</li>
                  <li>Add close buttons only when tabs are user-generated</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
