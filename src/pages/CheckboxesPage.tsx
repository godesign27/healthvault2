import { Checkbox } from '../components/ui/Checkbox';
import { useState } from 'react';

export function CheckboxesPage() {
  const [masterChecked, setMasterChecked] = useState(false);

  return (
    <div className="w-full min-h-0">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-content-primary mb-2">Checkboxes</h1>
          <p className="text-content-secondary">
            Multi-selection controls for forms and lists
          </p>
        </div>

        <div className="space-y-8">
          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Master Components</h2>

            <div className="border-2 border-dashed border-[#9B85D8] rounded p-6 inline-block">
              <div className="space-y-2">
                <Checkbox
                  checked={masterChecked}
                  onChange={setMasterChecked}
                  label="Checkbox"
                  size="16px"
                />
                <Checkbox
                  checked={false}
                  onChange={() => {}}
                  label="Checkbox"
                  size="16px"
                />
              </div>
            </div>
          </section>

          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Checkbox</h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-stroke-default">
                    <th className="text-left p-4 text-sm font-semibold text-content-secondary uppercase">Check Mark</th>
                    <th className="text-center p-4 text-sm font-semibold text-content-secondary uppercase">Unselected</th>
                    <th className="text-center p-4 text-sm font-semibold text-content-secondary uppercase">Selected</th>
                    <th className="text-center p-4 text-sm font-semibold text-content-secondary uppercase">Indeterminate</th>
                    <th className="text-center p-4 text-sm font-semibold text-content-secondary uppercase">Hover</th>
                    <th className="text-center p-4 text-sm font-semibold text-content-secondary uppercase">Focus</th>
                    <th className="text-center p-4 text-sm font-semibold text-content-secondary uppercase">Disabled</th>
                    <th className="text-center p-4 text-sm font-semibold text-content-secondary uppercase">Selected-Disabled</th>
                    <th className="text-center p-4 text-sm font-semibold text-content-secondary uppercase">Indeterminate-Disabled</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-stroke-subtle bg-surface-sunken">
                    <td className="p-4 text-sm font-medium text-content-secondary bg-surface-sunken">20PX</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Checkbox size="20px" />
                      </div>
                    </td>
                    <td className="p-4 text-center bg-surface-raised">
                      <div className="flex justify-center">
                        <Checkbox checked size="20px" onChange={() => {}} />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Checkbox indeterminate size="20px" onChange={() => {}} />
                      </div>
                    </td>
                    <td className="p-4 text-center bg-surface-raised">
                      <div className="flex justify-center">
                        <Checkbox size="20px" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <div className="ring-2 ring-[indigo-600] ring-offset-2 rounded">
                          <Checkbox size="20px" />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center bg-surface-raised">
                      <div className="flex justify-center">
                        <Checkbox disabled size="20px" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Checkbox checked disabled size="20px" onChange={() => {}} />
                      </div>
                    </td>
                    <td className="p-4 text-center bg-surface-raised">
                      <div className="flex justify-center">
                        <Checkbox indeterminate disabled size="20px" onChange={() => {}} />
                      </div>
                    </td>
                  </tr>

                  <tr className="border-b border-stroke-subtle bg-surface-sunken">
                    <td className="p-4 text-sm font-medium text-content-secondary bg-surface-sunken">18PX</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Checkbox size="18px" />
                      </div>
                    </td>
                    <td className="p-4 text-center bg-surface-raised">
                      <div className="flex justify-center">
                        <Checkbox checked size="18px" onChange={() => {}} />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Checkbox indeterminate size="18px" onChange={() => {}} />
                      </div>
                    </td>
                    <td className="p-4 text-center bg-surface-raised">
                      <div className="flex justify-center">
                        <Checkbox size="18px" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <div className="ring-2 ring-[indigo-600] ring-offset-2 rounded">
                          <Checkbox size="18px" />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center bg-surface-raised">
                      <div className="flex justify-center">
                        <Checkbox disabled size="18px" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Checkbox checked disabled size="18px" onChange={() => {}} />
                      </div>
                    </td>
                    <td className="p-4 text-center bg-surface-raised">
                      <div className="flex justify-center">
                        <Checkbox indeterminate disabled size="18px" onChange={() => {}} />
                      </div>
                    </td>
                  </tr>

                  <tr className="border-b border-stroke-subtle bg-surface-sunken">
                    <td className="p-4 text-sm font-medium text-content-secondary bg-surface-sunken">16PX</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Checkbox size="16px" />
                      </div>
                    </td>
                    <td className="p-4 text-center bg-surface-raised">
                      <div className="flex justify-center">
                        <Checkbox checked size="16px" onChange={() => {}} />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Checkbox indeterminate size="16px" onChange={() => {}} />
                      </div>
                    </td>
                    <td className="p-4 text-center bg-surface-raised">
                      <div className="flex justify-center">
                        <Checkbox size="16px" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <div className="ring-2 ring-[indigo-600] ring-offset-2 rounded">
                          <Checkbox size="16px" />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center bg-surface-raised">
                      <div className="flex justify-center">
                        <Checkbox disabled size="16px" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Checkbox checked disabled size="16px" onChange={() => {}} />
                      </div>
                    </td>
                    <td className="p-4 text-center bg-surface-raised">
                      <div className="flex justify-center">
                        <Checkbox indeterminate disabled size="16px" onChange={() => {}} />
                      </div>
                    </td>
                  </tr>

                  <tr className="bg-surface-sunken">
                    <td className="p-4 text-sm font-medium text-content-secondary bg-surface-sunken">14PX</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Checkbox size="14px" />
                      </div>
                    </td>
                    <td className="p-4 text-center bg-surface-raised">
                      <div className="flex justify-center">
                        <Checkbox checked size="14px" onChange={() => {}} />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Checkbox indeterminate size="14px" onChange={() => {}} />
                      </div>
                    </td>
                    <td className="p-4 text-center bg-surface-raised">
                      <div className="flex justify-center">
                        <Checkbox size="14px" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <div className="ring-2 ring-[indigo-600] ring-offset-2 rounded">
                          <Checkbox size="14px" />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center bg-surface-raised">
                      <div className="flex justify-center">
                        <Checkbox disabled size="14px" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Checkbox checked disabled size="14px" onChange={() => {}} />
                      </div>
                    </td>
                    <td className="p-4 text-center bg-surface-raised">
                      <div className="flex justify-center">
                        <Checkbox indeterminate disabled size="14px" onChange={() => {}} />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-8 border-t-2 border-stroke-default pt-8">
                <h3 className="text-sm font-semibold text-content-secondary uppercase mb-4">Error Variant</h3>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-stroke-default">
                      <th className="text-left p-4 text-sm font-semibold text-content-secondary uppercase"></th>
                      <th className="text-center p-4 text-sm font-semibold text-content-secondary uppercase">Unselected</th>
                      <th className="text-center p-4 text-sm font-semibold text-content-secondary uppercase">Selected</th>
                      <th className="text-center p-4 text-sm font-semibold text-content-secondary uppercase">Indeterminate</th>
                      <th className="text-center p-4 text-sm font-semibold text-content-secondary uppercase">Hover</th>
                      <th className="text-center p-4 text-sm font-semibold text-content-secondary uppercase">Focus</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-stroke-subtle bg-[#FEF2F2]">
                      <td className="p-4 text-sm font-medium text-content-secondary bg-[#FED7D7]">20PX</td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center">
                          <Checkbox variant="error" size="20px" />
                        </div>
                      </td>
                      <td className="p-4 text-center bg-surface-raised">
                        <div className="flex justify-center">
                          <Checkbox checked variant="error" size="20px" onChange={() => {}} />
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center">
                          <Checkbox indeterminate variant="error" size="20px" onChange={() => {}} />
                        </div>
                      </td>
                      <td className="p-4 text-center bg-surface-raised">
                        <div className="flex justify-center">
                          <Checkbox variant="error" size="20px" />
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center">
                          <div className="ring-2 ring-[indigo-600] ring-offset-2 rounded">
                            <Checkbox variant="error" size="20px" />
                          </div>
                        </div>
                      </td>
                    </tr>

                    <tr className="border-b border-stroke-subtle bg-[#FEF2F2]">
                      <td className="p-4 text-sm font-medium text-content-secondary bg-[#FED7D7]">18PX</td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center">
                          <Checkbox variant="error" size="18px" />
                        </div>
                      </td>
                      <td className="p-4 text-center bg-surface-raised">
                        <div className="flex justify-center">
                          <Checkbox checked variant="error" size="18px" onChange={() => {}} />
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center">
                          <Checkbox indeterminate variant="error" size="18px" onChange={() => {}} />
                        </div>
                      </td>
                      <td className="p-4 text-center bg-surface-raised">
                        <div className="flex justify-center">
                          <Checkbox variant="error" size="18px" />
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center">
                          <div className="ring-2 ring-[indigo-600] ring-offset-2 rounded">
                            <Checkbox variant="error" size="18px" />
                          </div>
                        </div>
                      </td>
                    </tr>

                    <tr className="border-b border-stroke-subtle bg-[#FEF2F2]">
                      <td className="p-4 text-sm font-medium text-content-secondary bg-[#FED7D7]">16PX</td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center">
                          <Checkbox variant="error" size="16px" />
                        </div>
                      </td>
                      <td className="p-4 text-center bg-surface-raised">
                        <div className="flex justify-center">
                          <Checkbox checked variant="error" size="16px" onChange={() => {}} />
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center">
                          <Checkbox indeterminate variant="error" size="16px" onChange={() => {}} />
                        </div>
                      </td>
                      <td className="p-4 text-center bg-surface-raised">
                        <div className="flex justify-center">
                          <Checkbox variant="error" size="16px" />
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center">
                          <div className="ring-2 ring-[indigo-600] ring-offset-2 rounded">
                            <Checkbox variant="error" size="16px" />
                          </div>
                        </div>
                      </td>
                    </tr>

                    <tr className="bg-[#FEF2F2]">
                      <td className="p-4 text-sm font-medium text-content-secondary bg-[#FED7D7]">14PX</td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center">
                          <Checkbox variant="error" size="14px" />
                        </div>
                      </td>
                      <td className="p-4 text-center bg-surface-raised">
                        <div className="flex justify-center">
                          <Checkbox checked variant="error" size="14px" onChange={() => {}} />
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center">
                          <Checkbox indeterminate variant="error" size="14px" onChange={() => {}} />
                        </div>
                      </td>
                      <td className="p-4 text-center bg-surface-raised">
                        <div className="flex justify-center">
                          <Checkbox variant="error" size="14px" />
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center">
                          <div className="ring-2 ring-[indigo-600] ring-offset-2 rounded">
                            <Checkbox variant="error" size="14px" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Checkbox + Text</h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-stroke-default">
                    <th className="text-left p-4 text-sm font-semibold text-content-secondary uppercase"></th>
                    <th className="text-center p-4 text-sm font-semibold text-content-secondary uppercase">Unselected</th>
                    <th className="text-center p-4 text-sm font-semibold text-content-secondary uppercase">Selected</th>
                    <th className="text-center p-4 text-sm font-semibold text-content-secondary uppercase">Indeterminate</th>
                    <th className="text-center p-4 text-sm font-semibold text-content-secondary uppercase">Hover</th>
                    <th className="text-center p-4 text-sm font-semibold text-content-secondary uppercase">Disabled</th>
                    <th className="text-center p-4 text-sm font-semibold text-content-secondary uppercase">Selected-Disabled</th>
                    <th className="text-center p-4 text-sm font-semibold text-content-secondary uppercase">Indeterminate-Disabled</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-stroke-subtle bg-surface-sunken">
                    <td className="p-4 text-sm font-medium text-content-secondary bg-surface-sunken">16PX</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Checkbox label="Checkbox" size="16px" />
                      </div>
                    </td>
                    <td className="p-4 text-center bg-surface-raised">
                      <div className="flex justify-center">
                        <Checkbox checked label="Checkbox" size="16px" onChange={() => {}} />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Checkbox indeterminate label="Checkbox" size="16px" onChange={() => {}} />
                      </div>
                    </td>
                    <td className="p-4 text-center bg-surface-raised">
                      <div className="flex justify-center">
                        <Checkbox label="Checkbox" size="16px" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Checkbox disabled label="Checkbox" size="16px" />
                      </div>
                    </td>
                    <td className="p-4 text-center bg-surface-raised">
                      <div className="flex justify-center">
                        <Checkbox checked disabled label="Checkbox" size="16px" onChange={() => {}} />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Checkbox indeterminate disabled label="Checkbox" size="16px" onChange={() => {}} />
                      </div>
                    </td>
                  </tr>

                  <tr className="bg-surface-sunken">
                    <td className="p-4 text-sm font-medium text-content-secondary bg-surface-sunken">14PX</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Checkbox label="Checkbox" size="14px" />
                      </div>
                    </td>
                    <td className="p-4 text-center bg-surface-raised">
                      <div className="flex justify-center">
                        <Checkbox checked label="Checkbox" size="14px" onChange={() => {}} />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Checkbox indeterminate label="Checkbox" size="14px" onChange={() => {}} />
                      </div>
                    </td>
                    <td className="p-4 text-center bg-surface-raised">
                      <div className="flex justify-center">
                        <Checkbox label="Checkbox" size="14px" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Checkbox disabled label="Checkbox" size="14px" />
                      </div>
                    </td>
                    <td className="p-4 text-center bg-surface-raised">
                      <div className="flex justify-center">
                        <Checkbox checked disabled label="Checkbox" size="14px" onChange={() => {}} />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Checkbox indeterminate disabled label="Checkbox" size="14px" onChange={() => {}} />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Component Specifications</h2>

            <div className="space-y-6 text-content-secondary">
              <div>
                <h3 className="font-semibold mb-2 text-lg">Sizes</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">20px:</strong> Large size for prominent selections</li>
                  <li><strong className="text-[indigo-600]">18px:</strong> Standard size for most forms</li>
                  <li><strong className="text-[indigo-600]">16px:</strong> Default size for general use</li>
                  <li><strong className="text-[indigo-600]">14px:</strong> Small size for dense layouts and tables</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Variants</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Primary:</strong> Teal color (indigo-600) for standard selections</li>
                  <li><strong className="text-[indigo-600]">Error:</strong> Red color (#C1292E) for invalid or error states</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">States</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Unselected:</strong> Empty checkbox with border, white background</li>
                  <li><strong className="text-[indigo-600]">Selected:</strong> Filled with checkmark icon, colored background</li>
                  <li><strong className="text-[indigo-600]">Indeterminate:</strong> Filled with minus icon, represents partial selection</li>
                  <li><strong className="text-[indigo-600]">Hover:</strong> Border color changes to indicate interactivity</li>
                  <li><strong className="text-[indigo-600]">Focus:</strong> Visible focus ring for keyboard navigation</li>
                  <li><strong className="text-[indigo-600]">Disabled:</strong> Grayed out appearance, not interactive</li>
                  <li><strong className="text-[indigo-600]">Selected-Disabled:</strong> Shows selection but grayed out</li>
                  <li><strong className="text-[indigo-600]">Indeterminate-Disabled:</strong> Shows indeterminate state but grayed out</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Visual Design</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>2px border width for all states</li>
                  <li>Rounded corners for softer appearance</li>
                  <li>Checkmark icon for selected state</li>
                  <li>Minus/dash icon for indeterminate state</li>
                  <li>White checkmark/minus on colored background when selected</li>
                  <li>Smooth transitions between states</li>
                  <li>2px focus ring with offset for accessibility</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Usage Guidelines</h2>

            <div className="space-y-6 text-content-secondary">
              <div>
                <h3 className="font-semibold mb-2 text-lg">When to Use</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>For selecting multiple options from a list</li>
                  <li>When users can select zero, one, or many options</li>
                  <li>For toggling individual settings on or off</li>
                  <li>In forms where multiple selections are allowed</li>
                  <li>For accepting terms and conditions</li>
                  <li>When showing parent-child relationships (use indeterminate for parent)</li>
                  <li>In tables for bulk selection of rows</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">When Not to Use</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>For mutually exclusive options - use radio buttons instead</li>
                  <li>For single selection - use radio buttons</li>
                  <li>For binary on/off states - use toggle switch instead</li>
                  <li>When immediate action is required - use buttons</li>
                  <li>For navigation - use links or buttons</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Indeterminate State</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Use for parent checkboxes when some but not all child items are selected</li>
                  <li>Represents a "partially selected" or "mixed" state</li>
                  <li>Common in hierarchical lists or nested selections</li>
                  <li>Clicking an indeterminate checkbox typically selects all items</li>
                  <li>Cannot be set by user directly, only programmatically</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Best Practices</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Always include a clear label next to the checkbox</li>
                  <li>Make the entire checkbox + label area clickable</li>
                  <li>Use appropriate size for the context (larger for touch, smaller for dense data)</li>
                  <li>Group related checkboxes together visually</li>
                  <li>Use error variant to indicate invalid selections</li>
                  <li>Provide clear feedback when state changes</li>
                  <li>Don't use checkboxes for actions - use buttons instead</li>
                  <li>Keep checkbox labels short and descriptive</li>
                  <li>Use positive phrasing in labels when possible</li>
                  <li>Order options logically (alphabetically, by frequency, or importance)</li>
                  <li>Consider default selections carefully based on user needs</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Behavior</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Click/Tap:</strong> Toggles between checked and unchecked</li>
                  <li><strong className="text-[indigo-600]">Keyboard:</strong> Space or Enter key to toggle when focused</li>
                  <li><strong className="text-[indigo-600]">Focus:</strong> Tab key to navigate, visible focus indicator</li>
                  <li><strong className="text-[indigo-600]">Label Click:</strong> Clicking label toggles checkbox state</li>
                  <li><strong className="text-[indigo-600]">Disabled:</strong> No interaction, visual feedback only</li>
                  <li><strong className="text-[indigo-600]">Hover:</strong> Visual feedback on hover (not on touch devices)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Accessibility</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Use proper ARIA attributes (role="checkbox", aria-checked, aria-disabled)</li>
                  <li>Support keyboard navigation (Tab, Space, Enter)</li>
                  <li>Provide visible focus indicators</li>
                  <li>Ensure minimum touch target size of 44x44px for mobile</li>
                  <li>Use semantic HTML with proper label associations</li>
                  <li>Announce state changes to screen readers</li>
                  <li>Don't rely solely on color to convey state</li>
                  <li>Provide sufficient color contrast (WCAG AA minimum)</li>
                  <li>Include descriptive labels, not just visual checkboxes</li>
                  <li>Group related checkboxes with fieldset and legend</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Content Guidelines</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Use clear, concise labels that describe what will be selected</li>
                  <li>Write labels in sentence case</li>
                  <li>Keep labels to a single line when possible</li>
                  <li>Use positive phrasing (e.g., "Send me updates" not "Don't send me updates")</li>
                  <li>Avoid negation in labels to prevent double negatives</li>
                  <li>Be specific about what the checkbox controls</li>
                  <li>For required selections, mark them clearly</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
