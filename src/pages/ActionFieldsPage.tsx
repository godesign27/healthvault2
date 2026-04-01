import { ActionField, TextAreaField } from '../components/ui/ActionField';
import { Search, Info } from 'lucide-react';

export function ActionFieldsPage() {
  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Action Fields</h1>
          <p className="text-gray-600">
            Form input fields with various states, sizes, and validation options
          </p>
        </div>

        <div className="space-y-8">
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Master Components</h2>

            <div className="grid grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Left Icon</h3>
                <div className="space-y-4">
                  <ActionField
                    leftIcon={<Search className="w-4 h-4" />}
                    placeholder="Input Nominal/ Nilai"
                    showLabel={false}
                    showHelper={false}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Right Icon</h3>
                <div className="space-y-4">
                  <ActionField
                    rightIcon={<Search className="w-4 h-4" />}
                    placeholder="Input Nominal/ Nilai"
                    showLabel={false}
                    showHelper={false}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Left + Right Icon</h3>
                <div className="space-y-4">
                  <ActionField
                    leftIcon={<Search className="w-4 h-4" />}
                    rightIcon={<Info className="w-4 h-4" />}
                    placeholder="Input Nominal/ Nilai"
                    showLabel={false}
                    showHelper={false}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Single & Double Line - Not Recommended for Use</h2>

            <div className="grid grid-cols-6 gap-6">
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-gray-700 mb-2">Default Combination</h3>
                <ActionField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" />
                <ActionField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" variant="search" />
                <ActionField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" variant="removable-tag" />
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-gray-700 mb-2">Normal (without)</h3>
                <ActionField placeholder="Input Nominal/ Nilai" showLabel={false} showHelper={false} />
                <ActionField placeholder="Input Nominal/ Nilai" showLabel={false} showHelper={false} variant="search" />
                <ActionField placeholder="Input Nominal/ Nilai" showLabel={false} showHelper={false} variant="removable-tag" />
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-gray-700 mb-2">Small Combination</h3>
                <ActionField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" size="small" />
                <ActionField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" variant="search" size="small" />
                <ActionField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" variant="removable-tag" size="small" />
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-gray-700 mb-2">Small (without)</h3>
                <ActionField placeholder="Input Nominal/ Nilai" showLabel={false} showHelper={false} size="small" />
                <ActionField placeholder="Input Nominal/ Nilai" showLabel={false} showHelper={false} variant="search" size="small" />
                <ActionField placeholder="Input Nominal/ Nilai" showLabel={false} showHelper={false} variant="removable-tag" size="small" />
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-gray-700 mb-2">Normal Combination</h3>
                <ActionField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" />
                <ActionField placeholder="Input Nominal/ Nilai" showLabel={false} helperText="Helper text" />
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-gray-700 mb-2">Small Combination</h3>
                <ActionField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" size="small" />
                <ActionField placeholder="Input Nominal/ Nilai" showLabel={false} helperText="Helper text" size="small" />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">All States - Default</h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-base font-semibold text-gray-700 mb-4">Default</h3>
                <div className="grid grid-cols-3 gap-6">
                  <ActionField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" />
                  <ActionField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" variant="search" />
                  <ActionField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" variant="removable-tag" />
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-700 mb-4">Hover</h3>
                <div className="grid grid-cols-3 gap-6">
                  <ActionField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" state="hover" />
                  <ActionField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" variant="search" state="hover" />
                  <ActionField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" variant="removable-tag" state="hover" />
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-700 mb-4">Focused</h3>
                <div className="grid grid-cols-3 gap-6">
                  <ActionField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" state="focused" />
                  <ActionField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" variant="search" state="focused" />
                  <ActionField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" variant="removable-tag" state="focused" />
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-700 mb-4">Disabled</h3>
                <div className="grid grid-cols-3 gap-6">
                  <ActionField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" state="disabled" />
                  <ActionField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" variant="search" state="disabled" />
                  <ActionField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" variant="removable-tag" state="disabled" />
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-700 mb-4">Read Only</h3>
                <div className="grid grid-cols-3 gap-6">
                  <ActionField label="Label text" showInfoIcon value="Read only value" helperText="Helper text" state="readonly" />
                  <ActionField label="Label text" showInfoIcon value="Read only value" helperText="Helper text" variant="search" state="readonly" />
                  <ActionField label="Label text" showInfoIcon value="Read only value" helperText="Helper text" variant="removable-tag" state="readonly" />
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-700 mb-4">Error</h3>
                <div className="grid grid-cols-3 gap-6">
                  <ActionField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" state="error" />
                  <ActionField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" variant="search" state="error" />
                  <ActionField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" variant="removable-tag" state="error" />
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-700 mb-4">Warning</h3>
                <div className="grid grid-cols-3 gap-6">
                  <ActionField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" state="warning" />
                  <ActionField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" variant="search" state="warning" />
                  <ActionField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" variant="removable-tag" state="warning" />
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-700 mb-4">Success</h3>
                <div className="grid grid-cols-3 gap-6">
                  <ActionField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" state="success" />
                  <ActionField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" variant="search" state="success" />
                  <ActionField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" variant="removable-tag" state="success" />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Text Area Fields</h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-base font-semibold text-gray-700 mb-4">Default</h3>
                <div className="grid grid-cols-3 gap-6">
                  <TextAreaField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" />
                  <TextAreaField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" state="focused" />
                  <TextAreaField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" state="disabled" />
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-700 mb-4">Validation States</h3>
                <div className="grid grid-cols-3 gap-6">
                  <TextAreaField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" state="error" />
                  <TextAreaField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" state="warning" />
                  <TextAreaField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" state="success" />
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-700 mb-4">Small Size</h3>
                <div className="grid grid-cols-3 gap-6">
                  <TextAreaField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" size="small" />
                  <TextAreaField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" size="small" state="focused" />
                  <TextAreaField label="Label text" showInfoIcon placeholder="Input Nominal/ Nilai" helperText="Helper text" size="small" state="error" />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Examples</h2>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <ActionField
                  label="Label text"
                  showInfoIcon
                  value="SBI"
                  helperText="Error only shows on relevant actions"
                  state="error"
                />
                <ActionField
                  label="Label text"
                  showInfoIcon
                  value="SBI"
                  helperText="Error only shows on relevant actions"
                  state="error"
                />
              </div>

              <div className="grid grid-cols-3 gap-6">
                <ActionField
                  label="Label text"
                  showInfoIcon
                  placeholder="You only populate (minimum"
                  helperText="Error only shows on relevant actions"
                  state="error"
                />
                <ActionField
                  label="Label text"
                  showInfoIcon
                  value="SBI"
                  helperText="Error only shows on relevant actions"
                  state="error"
                />
                <ActionField
                  label="Label text"
                  showInfoIcon
                  placeholder="You only populate (minimum"
                  helperText="30 days to"
                />
              </div>

              <div>
                <ActionField
                  label="Label text"
                  showInfoIcon
                  placeholder="Input Nominal/ Nilai"
                  helperText="It has a minimum transaction amount of Rp. 1,000,000 and can only be purchased by users with verified status."
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <ActionField
                  label="Label text"
                  showInfoIcon
                  placeholder="Input Nominal/ Nilai"
                  helperText="Currency amount converted to IDR 5,000,000. Use calculator based on current value"
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Usage Guidelines</h2>

            <div className="space-y-6 text-gray-700">
              <div>
                <h3 className="font-semibold mb-2 text-lg">When to Use</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>For user input in forms and data entry interfaces</li>
                  <li>When collecting text-based information from users</li>
                  <li>For search functionality within the application</li>
                  <li>When displaying read-only data that looks like an input field</li>
                  <li>For tagging or labeling with removable items</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Variants</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Default:</strong> Standard text input field for general use</li>
                  <li><strong className="text-[indigo-600]">Search:</strong> Input with search icon for search functionality</li>
                  <li><strong className="text-[indigo-600]">Removable Tag:</strong> Input with X icon for removable items or tags</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">States</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Default:</strong> Normal state ready for user interaction</li>
                  <li><strong className="text-[indigo-600]">Hover:</strong> Visual feedback when user hovers over the field</li>
                  <li><strong className="text-[indigo-600]">Focused:</strong> Active state when user is typing or field has focus</li>
                  <li><strong className="text-[indigo-600]">Disabled:</strong> Field cannot be interacted with</li>
                  <li><strong className="text-[indigo-600]">Read Only:</strong> Field displays data but cannot be edited</li>
                  <li><strong className="text-[indigo-600]">Error:</strong> Validation failed, shows error message</li>
                  <li><strong className="text-[indigo-600]">Warning:</strong> Shows warning about input but allows submission</li>
                  <li><strong className="text-[indigo-600]">Success:</strong> Validation passed, confirms correct input</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Sizes</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li><strong className="text-[indigo-600]">Normal:</strong> Default size for most form inputs</li>
                  <li><strong className="text-[indigo-600]">Small:</strong> Compact size for dense layouts or inline forms</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Best Practices</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Always provide clear, descriptive labels for inputs</li>
                  <li>Use helper text to provide additional context or instructions</li>
                  <li>Show validation feedback immediately after user interaction</li>
                  <li>Use placeholder text as examples, not as labels</li>
                  <li>Keep error messages specific and actionable</li>
                  <li>Use appropriate input types for better mobile keyboards</li>
                  <li>Include info icons for fields that need additional explanation</li>
                  <li>Disable fields only when absolutely necessary</li>
                  <li>Use read-only state to display data that shouldn't be edited</li>
                  <li>Ensure sufficient color contrast for accessibility</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-lg">Accessibility</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Always associate labels with inputs using proper HTML semantics</li>
                  <li>Provide clear focus indicators for keyboard navigation</li>
                  <li>Use aria-describedby for helper text and error messages</li>
                  <li>Ensure error states are not conveyed by color alone</li>
                  <li>Use aria-invalid for fields with validation errors</li>
                  <li>Make sure placeholder text has sufficient contrast</li>
                  <li>Provide adequate touch targets (minimum 44x44px)</li>
                  <li>Test with screen readers to ensure proper announcement</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
