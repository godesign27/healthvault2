import { Dropdown, SimpleDropdown, DropdownWithSubmenu } from '../components/ui/Dropdown';
import { useState } from 'react';

export function DropdownsPage() {
  const [masterNormal, setMasterNormal] = useState('Selection');
  const [masterSmall, setMasterSmall] = useState('Selection');
  const [masterXSmall, setMasterXSmall] = useState('Selection');

  const [outlineDefault, setOutlineDefault] = useState('');
  const [outlineDefaultSmall, setOutlineDefaultSmall] = useState('');
  const [outlineDefaultXSmall, setOutlineDefaultXSmall] = useState('');

  const [outlineSelected, setOutlineSelected] = useState('2');
  const [outlineSelectedSmall, setOutlineSelectedSmall] = useState('2');
  const [outlineSelectedXSmall, setOutlineSelectedXSmall] = useState('2');

  const [outlineFocused, setOutlineFocused] = useState('2');
  const [outlineFocusedSmall, setOutlineFocusedSmall] = useState('2');
  const [outlineFocusedXSmall, setOutlineFocusedXSmall] = useState('2');

  const [menuDefault, setMenuDefault] = useState('');
  const [menuDefaultSmall, setMenuDefaultSmall] = useState('');
  const [menuDefaultXSmall, setMenuDefaultXSmall] = useState('');

  const [menuSelected, setMenuSelected] = useState('2');
  const [menuSelectedSmall, setMenuSelectedSmall] = useState('2');
  const [menuSelectedXSmall, setMenuSelectedXSmall] = useState('2');

  return (
    <div className="w-full min-h-0">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-content-primary mb-2">Dropdowns</h1>
          <p className="text-content-secondary">
            Select components for choosing values from lists with support for submenus
          </p>
        </div>

        <div className="space-y-8">
          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Master Components</h2>

            <div className="space-y-6">
              <div>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="text-sm font-semibold text-content-secondary uppercase">Master</div>
                  <div className="text-sm font-semibold text-content-secondary uppercase">Normal</div>
                  <div className="text-sm font-semibold text-content-secondary uppercase">Small</div>
                  <div className="text-sm font-semibold text-content-secondary uppercase">XSmall</div>
                </div>

                <div className="grid grid-cols-4 gap-4 items-center">
                  <div className="text-sm font-medium text-content-secondary">MASTER</div>
                  <div className="border-2 border-dashed border-stroke-default rounded p-4">
                    <Dropdown
                      options={[{ value: 'Selection', label: 'Selection' }]}
                      value={masterNormal}
                      onChange={setMasterNormal}
                      size="normal"
                      showCheckmark={true}
                    />
                  </div>
                  <div className="border-2 border-dashed border-stroke-default rounded p-4">
                    <Dropdown
                      options={[{ value: 'Selection', label: 'Selection' }]}
                      value={masterSmall}
                      onChange={setMasterSmall}
                      size="small"
                      showCheckmark={true}
                    />
                  </div>
                  <div className="border-2 border-dashed border-stroke-default rounded p-4">
                    <Dropdown
                      options={[{ value: 'Selection', label: 'Selection' }]}
                      value={masterXSmall}
                      onChange={setMasterXSmall}
                      size="xsmall"
                      showCheckmark={true}
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <div className="w-1/4 border-2 border-[indigo-600] rounded p-4">
                    <div className="text-xs text-content-secondary mb-2">Display Area</div>
                    <div className="h-20 bg-surface-raised"></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Dropdown - Outline</h2>

            <div className="space-y-6">
              <div>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="text-sm font-semibold text-content-secondary uppercase"></div>
                  <div className="text-sm font-semibold text-content-secondary uppercase">Normal - 50PX</div>
                  <div className="text-sm font-semibold text-content-secondary uppercase">Small - 44PX</div>
                  <div className="text-sm font-semibold text-content-secondary uppercase">XSmall - 38PX</div>
                </div>

                <div className="grid grid-cols-4 gap-4 items-center py-4 border-b border-stroke-subtle">
                  <div className="text-sm font-medium text-content-secondary bg-surface-sunken px-4 py-2">DEFAULT</div>
                  <div className="border-2 border-dashed border-stroke-default rounded p-4">
                    <SimpleDropdown
                      value={outlineDefault}
                      onChange={setOutlineDefault}
                      size="normal"
                      variant="outline"
                    />
                  </div>
                  <div className="border-2 border-dashed border-stroke-default rounded p-4">
                    <SimpleDropdown
                      value={outlineDefaultSmall}
                      onChange={setOutlineDefaultSmall}
                      size="small"
                      variant="outline"
                    />
                  </div>
                  <div className="border-2 border-dashed border-stroke-default rounded p-4">
                    <SimpleDropdown
                      value={outlineDefaultXSmall}
                      onChange={setOutlineDefaultXSmall}
                      size="xsmall"
                      variant="outline"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 items-center py-4 border-b border-stroke-subtle">
                  <div className="text-sm font-medium text-content-secondary bg-surface-sunken px-4 py-2">SELECTED</div>
                  <div className="border-2 border-dashed border-stroke-default rounded p-4">
                    <SimpleDropdown
                      value={outlineSelected}
                      onChange={setOutlineSelected}
                      size="normal"
                      variant="outline"
                    />
                  </div>
                  <div className="border-2 border-dashed border-stroke-default rounded p-4">
                    <SimpleDropdown
                      value={outlineSelectedSmall}
                      onChange={setOutlineSelectedSmall}
                      size="small"
                      variant="outline"
                    />
                  </div>
                  <div className="border-2 border-dashed border-stroke-default rounded p-4">
                    <SimpleDropdown
                      value={outlineSelectedXSmall}
                      onChange={setOutlineSelectedXSmall}
                      size="xsmall"
                      variant="outline"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 items-center py-4 border-b border-stroke-subtle">
                  <div className="text-sm font-medium text-content-secondary bg-surface-sunken px-4 py-2">FOCUSED</div>
                  <div className="border-2 border-dashed border-stroke-default rounded p-4">
                    <SimpleDropdown
                      value={outlineFocused}
                      onChange={setOutlineFocused}
                      size="normal"
                      variant="outline"
                    />
                  </div>
                  <div className="border-2 border-dashed border-stroke-default rounded p-4">
                    <SimpleDropdown
                      value={outlineFocusedSmall}
                      onChange={setOutlineFocusedSmall}
                      size="small"
                      variant="outline"
                    />
                  </div>
                  <div className="border-2 border-dashed border-stroke-default rounded p-4">
                    <SimpleDropdown
                      value={outlineFocusedXSmall}
                      onChange={setOutlineFocusedXSmall}
                      size="xsmall"
                      variant="outline"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 items-center py-4 border-b border-stroke-subtle">
                  <div className="text-sm font-medium text-content-secondary bg-surface-sunken px-4 py-2">DISABLED</div>
                  <div className="border-2 border-dashed border-stroke-default rounded p-4">
                    <SimpleDropdown
                      value=""
                      onChange={() => {}}
                      size="normal"
                      variant="outline"
                      disabled
                    />
                  </div>
                  <div className="border-2 border-dashed border-stroke-default rounded p-4">
                    <SimpleDropdown
                      value=""
                      onChange={() => {}}
                      size="small"
                      variant="outline"
                      disabled
                    />
                  </div>
                  <div className="border-2 border-dashed border-stroke-default rounded p-4">
                    <SimpleDropdown
                      value=""
                      onChange={() => {}}
                      size="xsmall"
                      variant="outline"
                      disabled
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 items-center py-4">
                  <div className="text-sm font-medium text-content-secondary bg-surface-sunken px-4 py-2">FILLED & DISABLED</div>
                  <div className="border-2 border-dashed border-stroke-default rounded p-4">
                    <SimpleDropdown
                      value="2"
                      onChange={() => {}}
                      size="normal"
                      variant="filled"
                      disabled
                    />
                  </div>
                  <div className="border-2 border-dashed border-stroke-default rounded p-4">
                    <SimpleDropdown
                      value="2"
                      onChange={() => {}}
                      size="small"
                      variant="filled"
                      disabled
                    />
                  </div>
                  <div className="border-2 border-dashed border-stroke-default rounded p-4">
                    <SimpleDropdown
                      value="2"
                      onChange={() => {}}
                      size="xsmall"
                      variant="filled"
                      disabled
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Dropdown - With Menu</h2>

            <div className="space-y-6">
              <div>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="text-sm font-semibold text-content-secondary uppercase"></div>
                  <div className="text-sm font-semibold text-content-secondary uppercase">Normal - 50PX</div>
                  <div className="text-sm font-semibold text-content-secondary uppercase">Small - 44PX</div>
                  <div className="text-sm font-semibold text-content-secondary uppercase">XSmall - 38PX</div>
                </div>

                <div className="grid grid-cols-4 gap-4 items-start py-4 border-b border-stroke-subtle">
                  <div className="text-sm font-medium text-content-secondary bg-surface-sunken px-4 py-2">DEFAULT</div>
                  <div className="border-2 border-dashed border-[indigo-600] rounded p-4">
                    <DropdownWithSubmenu
                      value={menuDefault}
                      onChange={setMenuDefault}
                      size="normal"
                    />
                  </div>
                  <div className="border-2 border-dashed border-[indigo-600] rounded p-4">
                    <DropdownWithSubmenu
                      value={menuDefaultSmall}
                      onChange={setMenuDefaultSmall}
                      size="small"
                    />
                  </div>
                  <div className="border-2 border-dashed border-[indigo-600] rounded p-4">
                    <DropdownWithSubmenu
                      value={menuDefaultXSmall}
                      onChange={setMenuDefaultXSmall}
                      size="xsmall"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 items-start py-4">
                  <div className="text-sm font-medium text-content-secondary bg-surface-sunken px-4 py-2">SELECTED</div>
                  <div className="border-2 border-dashed border-[indigo-600] rounded p-4">
                    <DropdownWithSubmenu
                      value={menuSelected}
                      onChange={setMenuSelected}
                      size="normal"
                      showCheckmark={true}
                    />
                  </div>
                  <div className="border-2 border-dashed border-[indigo-600] rounded p-4">
                    <DropdownWithSubmenu
                      value={menuSelectedSmall}
                      onChange={setMenuSelectedSmall}
                      size="small"
                      showCheckmark={true}
                    />
                  </div>
                  <div className="border-2 border-dashed border-[indigo-600] rounded p-4">
                    <DropdownWithSubmenu
                      value={menuSelectedXSmall}
                      onChange={setMenuSelectedXSmall}
                      size="xsmall"
                      showCheckmark={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-surface-raised rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-content-primary mb-6">Component Specifications</h2>

            <div className="space-y-6 text-content-secondary">
              <div>
                <h3 className="font-semibold mb-2 text-lg">Sizes</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Normal:</strong> 50px height - Standard size for most forms</li>
                  <li><strong className="text-[indigo-600]">Small:</strong> 44px height - Compact layouts and tables</li>
                  <li><strong className="text-[indigo-600]">XSmall:</strong> 38px height - Dense data displays</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Variants</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Outline:</strong> Default style with white background and border</li>
                  <li><strong className="text-[indigo-600]">Filled:</strong> Gray background for filled state, disabled appearance</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">States</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Default:</strong> Empty state with placeholder text in gray</li>
                  <li><strong className="text-[indigo-600]">Selected:</strong> Shows selected value with optional checkmark, includes clear (X) button</li>
                  <li><strong className="text-[indigo-600]">Focused:</strong> Teal border (indigo-600) when active or open</li>
                  <li><strong className="text-[indigo-600]">Disabled:</strong> Gray background with reduced opacity, not interactive</li>
                  <li><strong className="text-[indigo-600]">Filled & Disabled:</strong> Shows selected value but not interactive</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Menu Features</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Dropdown menu appears below the trigger button</li>
                  <li>Menu items highlight with dark teal background (#0D4B56) on hover</li>
                  <li>Selected item shown with darker background</li>
                  <li>Optional checkmark icon for selected state</li>
                  <li>Support for submenus with chevron indicator</li>
                  <li>Submenus appear to the right with hover trigger</li>
                  <li>Maximum height with vertical scrolling for long lists</li>
                  <li>Closes when clicking outside or selecting an item</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Interactive Elements</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Chevron:</strong> Rotates 180° when menu is open</li>
                  <li><strong className="text-[indigo-600]">Clear Button:</strong> X icon appears when value is selected (outline variant only)</li>
                  <li><strong className="text-[indigo-600]">Checkmark:</strong> Optional indicator showing selected state in both button and menu</li>
                  <li><strong className="text-[indigo-600]">Submenu Arrow:</strong> Chevron right icon for items with submenus</li>
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
                  <li>For selecting a single option from a list of 5+ choices</li>
                  <li>When screen space is limited and options need to be hidden until needed</li>
                  <li>For forms where users need to make selections from predefined options</li>
                  <li>When options are organized into categories (use submenus)</li>
                  <li>In filters and settings where users configure preferences</li>
                  <li>For navigation when grouping related links or actions</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">When Not to Use</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>For 2-4 options - use radio buttons or segmented control instead</li>
                  <li>When users need to select multiple options - use checkboxes or multi-select</li>
                  <li>For boolean choices - use toggle switch or checkbox</li>
                  <li>When options need to be immediately visible - use radio buttons</li>
                  <li>For primary actions - use buttons instead</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Best Practices</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Use clear, concise labels for dropdown trigger and menu items</li>
                  <li>Provide a descriptive placeholder text (e.g., "Select a country" not "Select")</li>
                  <li>Order menu items logically (alphabetically, by frequency, or by importance)</li>
                  <li>Keep menu item labels short and scannable</li>
                  <li>Use consistent sizing within the same form or interface section</li>
                  <li>Show visual feedback for all interactive states</li>
                  <li>Include a clear button for easy value removal (when appropriate)</li>
                  <li>Use submenus sparingly - only for truly nested categories</li>
                  <li>Limit submenu depth to one level to avoid complexity</li>
                  <li>Ensure dropdown width accommodates the longest option without truncation</li>
                  <li>Consider using search/filter for lists with many options</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Behavior</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Opening:</strong> Click trigger to open menu, focus border appears</li>
                  <li><strong className="text-[indigo-600]">Selection:</strong> Click item to select, menu closes automatically</li>
                  <li><strong className="text-[indigo-600]">Closing:</strong> Click outside, select item, or click trigger again</li>
                  <li><strong className="text-[indigo-600]">Submenus:</strong> Hover to reveal, appear to the right of parent item</li>
                  <li><strong className="text-[indigo-600]">Clearing:</strong> Click X button to remove selected value</li>
                  <li><strong className="text-[indigo-600]">Scrolling:</strong> Menu scrolls vertically if content exceeds max height</li>
                  <li><strong className="text-[indigo-600]">Disabled:</strong> No interaction, no hover effects, grayed out appearance</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Accessibility</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Support keyboard navigation (Arrow keys, Enter, Escape, Tab)</li>
                  <li>Use proper ARIA attributes (role="combobox", aria-expanded, aria-haspopup)</li>
                  <li>Announce state changes to screen readers</li>
                  <li>Ensure focus is visible and follows keyboard navigation</li>
                  <li>Make trigger button large enough for easy clicking (minimum 44px)</li>
                  <li>Provide sufficient color contrast for all text (WCAG AA minimum)</li>
                  <li>Don't rely solely on color to indicate state</li>
                  <li>Include text labels, not just icons</li>
                  <li>Support browser autofill and form validation</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Content Guidelines</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Use sentence case for menu items (not title case or ALL CAPS)</li>
                  <li>Keep menu item text concise (aim for 1-3 words)</li>
                  <li>Avoid duplicate labels - each option should be unique</li>
                  <li>Use parallel construction for menu items (all nouns, all verbs, etc.)</li>
                  <li>Provide helpful placeholder text that indicates the purpose</li>
                  <li>Group related items together within the menu</li>
                  <li>Consider adding dividers between logical groups</li>
                  <li>For submenus, ensure parent label clearly indicates category</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
