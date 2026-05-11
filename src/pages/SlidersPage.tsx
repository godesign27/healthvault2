import { useState } from 'react';
import { Slider } from '../components/ui/Slider';

export function SlidersPage() {
  const [standardValue, setStandardValue] = useState(50);
  const [dynamicValue, setDynamicValue] = useState(50);
  const [errorValue, setErrorValue] = useState(50);

  return (
    <div className="w-full min-h-0">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-content-primary mb-2">Sliders</h1>
          <p className="text-content-secondary">
            Interactive range sliders for selecting numeric values
          </p>
        </div>

        <div className="bg-surface-raised rounded-lg shadow-sm border border-stroke-subtle p-8 mb-8">
          <h2 className="text-2xl font-bold text-content-primary mb-6">Interactive Examples</h2>

          <div className="space-y-12">
            <div>
              <h3 className="text-lg font-semibold text-content-primary mb-4">Standard Sliders</h3>
              <div className="space-y-8">
                <div>
                  <p className="text-sm text-content-secondary mb-4">Default State</p>
                  <Slider
                    value={standardValue}
                    onChange={setStandardValue}
                    showTicks
                  />
                </div>

                <div>
                  <p className="text-sm text-content-secondary mb-4">With Dynamic Value Display</p>
                  <Slider
                    value={dynamicValue}
                    onChange={setDynamicValue}
                    showValue
                  />
                </div>

                <div>
                  <p className="text-sm text-content-secondary mb-4">Error State</p>
                  <Slider
                    value={errorValue}
                    onChange={setErrorValue}
                    error
                    showTicks
                  />
                </div>

                <div>
                  <p className="text-sm text-content-secondary mb-4">Disabled State</p>
                  <Slider
                    value={50}
                    disabled
                    showTicks
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-content-primary mb-4">Slider Variants</h3>
              <div className="space-y-8">
                <Slider
                  label="Volume"
                  defaultValue={75}
                  showValue
                />

                <Slider
                  label="Brightness"
                  min={0}
                  max={100}
                  step={5}
                  defaultValue={60}
                  showTicks
                />

                <Slider
                  label="Temperature"
                  min={60}
                  max={80}
                  defaultValue={72}
                  showValue
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-content-primary mb-4">States Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-medium text-content-secondary mb-3">Default</p>
                    <Slider defaultValue={30} />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-content-secondary mb-3">With Value</p>
                    <Slider defaultValue={50} showValue />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-content-secondary mb-3">With Ticks</p>
                    <Slider defaultValue={70} showTicks />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-medium text-content-secondary mb-3">Error</p>
                    <Slider defaultValue={30} error />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-content-secondary mb-3">Error with Value</p>
                    <Slider defaultValue={50} error showValue />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-content-secondary mb-3">Disabled</p>
                    <Slider defaultValue={70} disabled />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface-raised rounded-lg shadow-sm border border-stroke-subtle p-8">
          <h2 className="text-2xl font-bold text-content-primary mb-4">Usage Guidelines</h2>
          <div className="prose max-w-none">
            <h3 className="text-lg font-semibold text-content-primary mt-6 mb-3">When to Use</h3>
            <ul className="text-content-secondary space-y-2">
              <li>For selecting a value from a continuous range</li>
              <li>When the exact value is less important than the approximate range</li>
              <li>For adjusting settings like volume, brightness, or zoom</li>
              <li>When space is limited and you need a compact input method</li>
            </ul>

            <h3 className="text-lg font-semibold text-content-primary mt-6 mb-3">Best Practices</h3>
            <ul className="text-content-secondary space-y-2">
              <li>Show tick marks for sliders with discrete steps</li>
              <li>Display the current value for precise adjustments</li>
              <li>Use appropriate min/max ranges for the context</li>
              <li>Provide clear labels to indicate what the slider controls</li>
              <li>Use the error state to indicate invalid ranges or values</li>
            </ul>

            <h3 className="text-lg font-semibold text-content-primary mt-6 mb-3">Accessibility</h3>
            <ul className="text-content-secondary space-y-2">
              <li>Sliders are keyboard accessible using arrow keys</li>
              <li>Always include a label for screen readers</li>
              <li>Provide visual feedback for focus states</li>
              <li>Consider providing alternative input methods for precise values</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
