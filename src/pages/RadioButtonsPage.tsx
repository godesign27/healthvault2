import { useState } from 'react';
import { RadioButton } from '../components/ui/RadioButton';

export function RadioButtonsPage() {
  const [selectedRadio, setSelectedRadio] = useState<string>('option1');

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Radio Buttons</h1>
          <p className="text-gray-600">Interactive radio button components with multiple states and sizes</p>
        </div>

        <div className="space-y-12">
          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">States Overview</h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Without Labels</h3>
                <div className="grid grid-cols-6 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-3 font-medium">Default</p>
                    <RadioButton size="16px" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-3 font-medium">Hover</p>
                    <RadioButton size="16px" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-3 font-medium">Disabled</p>
                    <RadioButton size="16px" disabled />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-3 font-medium">Selected</p>
                    <RadioButton size="16px" checked />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-3 font-medium">Selected Disabled</p>
                    <RadioButton size="16px" checked disabled />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-3 font-medium">Focus</p>
                    <RadioButton size="16px" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Size Variants</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-3 font-medium">14px</p>
                    <div className="flex gap-4">
                      <RadioButton size="14px" />
                      <RadioButton size="14px" checked />
                      <RadioButton size="14px" disabled />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-3 font-medium">16px</p>
                    <div className="flex gap-4">
                      <RadioButton size="16px" />
                      <RadioButton size="16px" checked />
                      <RadioButton size="16px" disabled />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">With Labels</h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Interactive Example</h3>
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
                    label="Option 3"
                    size="16px"
                    checked={selectedRadio === 'option3'}
                    onChange={() => setSelectedRadio('option3')}
                    name="radio-group"
                  />
                  <RadioButton
                    label="Option 4 (Disabled)"
                    size="16px"
                    disabled
                    name="radio-group"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">All States with Labels</h3>
                <div className="space-y-3">
                  <RadioButton label="Default state" size="16px" />
                  <RadioButton label="Selected state" size="16px" checked />
                  <RadioButton label="Disabled state" size="16px" disabled />
                  <RadioButton label="Selected and disabled" size="16px" checked disabled />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Usage Guidelines</h2>

            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold mb-2">When to Use</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>When users need to select exactly one option from a list</li>
                  <li>For mutually exclusive choices</li>
                  <li>When you want all options visible at once</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Best Practices</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Keep labels short and descriptive</li>
                  <li>Use 16px size for better accessibility</li>
                  <li>Always group related radio buttons with the same name attribute</li>
                  <li>Provide clear visual feedback for all states</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Design Tokens</h3>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="border border-gray-200 rounded p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-[indigo-600] border-2 border-[indigo-600]"></div>
                      <span className="text-sm font-medium">Selected State</span>
                    </div>
                    <p className="text-xs text-gray-500 font-mono">indigo-600</p>
                  </div>
                  <div className="border border-gray-200 rounded p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full border-2 border-[#3B9CFF] ring-2 ring-[#3B9CFF] ring-offset-2"></div>
                      <span className="text-sm font-medium">Focus State</span>
                    </div>
                    <p className="text-xs text-gray-500 font-mono">#3B9CFF</p>
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
