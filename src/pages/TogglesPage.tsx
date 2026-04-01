import { Toggle } from '../components/ui/Toggle';
import { useState } from 'react';

export function TogglesPage() {
  const [normalToggle, setNormalToggle] = useState(false);
  const [smallToggle, setSmallToggle] = useState(false);

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Toggles</h1>
          <p className="text-gray-600">
            Binary switches for enabling or disabling settings
          </p>
        </div>

        <div className="space-y-8">
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Master Components</h2>

            <div className="grid grid-cols-4 gap-6">
              <div className="text-center space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase">Off</h3>
                <div className="border-2 border-dashed border-[#9B85D8] rounded p-6 space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="text-xs text-gray-500">NORMAL</div>
                    <Toggle checked={false} onChange={() => {}} />
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    <div className="text-xs text-gray-500">SMALL</div>
                    <Toggle checked={false} onChange={() => {}} size="small" />
                  </div>
                </div>
              </div>

              <div className="text-center space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase">On</h3>
                <div className="border-2 border-dashed border-[#9B85D8] rounded p-6 space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="text-xs text-gray-500">NORMAL</div>
                    <Toggle checked={true} onChange={() => {}} />
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    <div className="text-xs text-gray-500">SMALL</div>
                    <Toggle checked={true} onChange={() => {}} size="small" />
                  </div>
                </div>
              </div>

              <div className="text-center space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase">Label</h3>
                <div className="border-2 border-dashed border-[#9B85D8] rounded p-6 space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="text-xs text-gray-500">NORMAL</div>
                    <Toggle checked={normalToggle} onChange={setNormalToggle} label="Label" />
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    <div className="text-xs text-gray-500">SMALL</div>
                    <Toggle checked={smallToggle} onChange={setSmallToggle} label="Label" size="small" />
                  </div>
                </div>
              </div>

              <div className="text-center space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase">Error Message</h3>
                <div className="border-2 border-dashed border-[#9B85D8] rounded p-6 space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    <Toggle checked={false} onChange={() => {}} error errorMessage="Error message" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Toggles: Without label</h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left p-4 text-sm font-semibold text-gray-500 uppercase"></th>
                    <th className="text-center p-4 text-sm font-semibold text-gray-500 uppercase">Off-Default</th>
                    <th className="text-center p-4 text-sm font-semibold text-gray-500 uppercase">Off-Focused</th>
                    <th className="text-center p-4 text-sm font-semibold text-gray-500 uppercase">Off-Disabled</th>
                    <th className="text-center p-4 text-sm font-semibold text-gray-500 uppercase">On-Default</th>
                    <th className="text-center p-4 text-sm font-semibold text-gray-500 uppercase">On-Focused</th>
                    <th className="text-center p-4 text-sm font-semibold text-gray-500 uppercase">On-Disabled</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="p-4 text-sm font-medium text-gray-700 bg-gray-100">Normal</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Toggle checked={false} onChange={() => {}} />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <div className="ring-2 ring-[indigo-600] ring-offset-2 rounded-full">
                          <Toggle checked={false} onChange={() => {}} />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Toggle checked={false} disabled onChange={() => {}} />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Toggle checked={true} onChange={() => {}} />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <div className="ring-2 ring-[indigo-600] ring-offset-2 rounded-full">
                          <Toggle checked={true} onChange={() => {}} />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Toggle checked={true} disabled onChange={() => {}} />
                      </div>
                    </td>
                  </tr>

                  <tr className="bg-gray-50">
                    <td className="p-4 text-sm font-medium text-gray-700 bg-gray-100">Small</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Toggle checked={false} onChange={() => {}} size="small" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <div className="ring-2 ring-[indigo-600] ring-offset-2 rounded-full">
                          <Toggle checked={false} onChange={() => {}} size="small" />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Toggle checked={false} disabled onChange={() => {}} size="small" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Toggle checked={true} onChange={() => {}} size="small" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <div className="ring-2 ring-[indigo-600] ring-offset-2 rounded-full">
                          <Toggle checked={true} onChange={() => {}} size="small" />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Toggle checked={true} disabled onChange={() => {}} size="small" />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Toggles: With Label</h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left p-4 text-sm font-semibold text-gray-500 uppercase"></th>
                    <th className="text-center p-4 text-sm font-semibold text-gray-500 uppercase">Off-Default</th>
                    <th className="text-center p-4 text-sm font-semibold text-gray-500 uppercase">Off-Focused</th>
                    <th className="text-center p-4 text-sm font-semibold text-gray-500 uppercase">Off-Disabled</th>
                    <th className="text-center p-4 text-sm font-semibold text-gray-500 uppercase">On-Default</th>
                    <th className="text-center p-4 text-sm font-semibold text-gray-500 uppercase">On-Focused</th>
                    <th className="text-center p-4 text-sm font-semibold text-gray-500 uppercase">On-Disabled</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="p-4 text-sm font-medium text-gray-700 bg-gray-100">Normal</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Toggle checked={false} onChange={() => {}} label="Label" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <div className="ring-2 ring-[indigo-600] ring-offset-2 rounded-full inline-flex items-center gap-3">
                          <span className="text-sm text-gray-700">Label</span>
                          <Toggle checked={false} onChange={() => {}} />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Toggle checked={false} disabled onChange={() => {}} label="Label" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Toggle checked={true} onChange={() => {}} label="Label" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <div className="ring-2 ring-[indigo-600] ring-offset-2 rounded-full inline-flex items-center gap-3">
                          <span className="text-sm text-gray-700">Label</span>
                          <Toggle checked={true} onChange={() => {}} />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Toggle checked={true} disabled onChange={() => {}} label="Label" />
                      </div>
                    </td>
                  </tr>

                  <tr className="bg-gray-50">
                    <td className="p-4 text-sm font-medium text-gray-700 bg-gray-100">Small</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Toggle checked={false} onChange={() => {}} label="Label" size="small" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <div className="ring-2 ring-[indigo-600] ring-offset-2 rounded-full inline-flex items-center gap-3">
                          <span className="text-sm text-gray-700">Label</span>
                          <Toggle checked={false} onChange={() => {}} size="small" />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Toggle checked={false} disabled onChange={() => {}} label="Label" size="small" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Toggle checked={true} onChange={() => {}} label="Label" size="small" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <div className="ring-2 ring-[indigo-600] ring-offset-2 rounded-full inline-flex items-center gap-3">
                          <span className="text-sm text-gray-700">Label</span>
                          <Toggle checked={true} onChange={() => {}} size="small" />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Toggle checked={true} disabled onChange={() => {}} label="Label" size="small" />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Toggles: Error Mode</h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left p-4 text-sm font-semibold text-gray-500 uppercase"></th>
                    <th className="text-center p-4 text-sm font-semibold text-gray-500 uppercase">Off-Disabled</th>
                    <th className="text-center p-4 text-sm font-semibold text-gray-500 uppercase">On-Disabled</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="p-4 text-sm font-medium text-gray-700 bg-gray-100">Normal<br/>With Label</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Toggle
                          checked={false}
                          disabled
                          onChange={() => {}}
                          label="Label"
                          error
                          errorMessage="Error message"
                        />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Toggle
                          checked={true}
                          disabled
                          onChange={() => {}}
                          label="Label"
                          error
                          errorMessage="Error message"
                        />
                      </div>
                    </td>
                  </tr>

                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="p-4 text-sm font-medium text-gray-700 bg-gray-100">Normal<br/>No Label</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Toggle
                          checked={false}
                          disabled
                          onChange={() => {}}
                          error
                          errorMessage="Error message"
                        />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Toggle
                          checked={true}
                          disabled
                          onChange={() => {}}
                          error
                          errorMessage="Error message"
                        />
                      </div>
                    </td>
                  </tr>

                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="p-4 text-sm font-medium text-gray-700 bg-gray-100">Small<br/>With Label</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Toggle
                          checked={false}
                          disabled
                          onChange={() => {}}
                          label="Label"
                          size="small"
                          error
                          errorMessage="Error message"
                        />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Toggle
                          checked={true}
                          disabled
                          onChange={() => {}}
                          label="Label"
                          size="small"
                          error
                          errorMessage="Error message"
                        />
                      </div>
                    </td>
                  </tr>

                  <tr className="bg-gray-50">
                    <td className="p-4 text-sm font-medium text-gray-700 bg-gray-100">Small<br/>No Label</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Toggle
                          checked={false}
                          disabled
                          onChange={() => {}}
                          size="small"
                          error
                          errorMessage="Error message"
                        />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Toggle
                          checked={true}
                          disabled
                          onChange={() => {}}
                          size="small"
                          error
                          errorMessage="Error message"
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Component Specifications</h2>

            <div className="space-y-6 text-gray-700">
              <div>
                <h3 className="font-semibold mb-2 text-lg">Sizes</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Normal:</strong> 44px wide × 24px tall - Standard size for most uses</li>
                  <li><strong className="text-[indigo-600]">Small:</strong> 36px wide × 20px tall - Compact size for dense layouts</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">States</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Off:</strong> Gray background, thumb on left side</li>
                  <li><strong className="text-[indigo-600]">On:</strong> Teal background (indigo-600), thumb on right side</li>
                  <li><strong className="text-[indigo-600]">Focused:</strong> Visible focus ring for keyboard navigation</li>
                  <li><strong className="text-[indigo-600]">Disabled:</strong> Grayed out, not interactive</li>
                  <li><strong className="text-[indigo-600]">Error:</strong> Disabled state with error message below</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Visual Design</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Rounded track with pill shape</li>
                  <li>White circular thumb that slides smoothly</li>
                  <li>Smooth transition animations between states</li>
                  <li>2px focus ring with offset for accessibility</li>
                  <li>Color changes on hover for feedback</li>
                  <li>Error icon and message for validation</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Usage Guidelines</h2>

            <div className="space-y-6 text-gray-700">
              <div>
                <h3 className="font-semibold mb-2 text-lg">When to Use</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>For immediate on/off state changes (takes effect immediately)</li>
                  <li>To enable or disable features and settings</li>
                  <li>For binary choices with clear opposite states</li>
                  <li>In settings panels and configuration screens</li>
                  <li>When the action does not require confirmation</li>
                  <li>For preferences that users can easily undo</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">When Not to Use</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>For selections that require confirmation - use checkboxes with a submit button</li>
                  <li>For mutually exclusive options - use radio buttons or segmented control</li>
                  <li>For multiple related options - use checkbox group</li>
                  <li>When the action is destructive or irreversible - use confirmation dialog</li>
                  <li>In forms that need explicit submission - use checkboxes instead</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Best Practices</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Always include a clear label describing what the toggle controls</li>
                  <li>Place label to the left of the toggle for consistency</li>
                  <li>Use positive phrasing (e.g., "Enable notifications" not "Disable notifications")</li>
                  <li>Make the entire label + toggle area clickable</li>
                  <li>Provide immediate visual feedback when toggled</li>
                  <li>Show loading state if action takes time to complete</li>
                  <li>Use normal size by default, small for space-constrained areas</li>
                  <li>Group related toggles together visually</li>
                  <li>Consider showing a toast notification for important state changes</li>
                  <li>Use error state to show validation issues</li>
                  <li>Keep labels short and descriptive</li>
                  <li>Ensure minimum touch target size of 44×44px on mobile</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Behavior</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Click/Tap:</strong> Toggles between on and off states immediately</li>
                  <li><strong className="text-[indigo-600]">Keyboard:</strong> Space or Enter key to toggle when focused</li>
                  <li><strong className="text-[indigo-600]">Focus:</strong> Tab key to navigate, visible focus indicator</li>
                  <li><strong className="text-[indigo-600]">Label Click:</strong> Clicking label toggles the switch</li>
                  <li><strong className="text-[indigo-600]">Animation:</strong> Smooth sliding transition for thumb movement</li>
                  <li><strong className="text-[indigo-600]">Disabled:</strong> No interaction, visual feedback only</li>
                  <li><strong className="text-[indigo-600]">State Persistence:</strong> Save state immediately upon change</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Accessibility</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Use proper ARIA attributes (role="switch", aria-checked, aria-disabled)</li>
                  <li>Support keyboard navigation (Tab, Space, Enter)</li>
                  <li>Provide visible focus indicators</li>
                  <li>Associate labels properly with switches</li>
                  <li>Announce state changes to screen readers</li>
                  <li>Ensure sufficient color contrast</li>
                  <li>Don't rely solely on color to convey state</li>
                  <li>Ensure minimum touch target size of 44×44px</li>
                  <li>Include descriptive labels, not just visual switches</li>
                  <li>Provide clear feedback for all state changes</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Content Guidelines</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Use clear, concise labels that describe the setting</li>
                  <li>Write labels in sentence case</li>
                  <li>Keep labels to a single line when possible</li>
                  <li>Use positive phrasing to avoid double negatives</li>
                  <li>Be specific about what the toggle controls</li>
                  <li>Avoid technical jargon in user-facing labels</li>
                  <li>Consider adding helper text for complex settings</li>
                  <li>Make error messages clear and actionable</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Toggle vs Checkbox</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Use Toggle:</strong> When the change takes effect immediately</li>
                  <li><strong className="text-[indigo-600]">Use Toggle:</strong> For system or application preferences</li>
                  <li><strong className="text-[indigo-600]">Use Toggle:</strong> When the action is easily reversible</li>
                  <li><strong className="text-[indigo-600]">Use Checkbox:</strong> When part of a form requiring submission</li>
                  <li><strong className="text-[indigo-600]">Use Checkbox:</strong> For multiple related selections</li>
                  <li><strong className="text-[indigo-600]">Use Checkbox:</strong> When confirmation is needed before applying</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
