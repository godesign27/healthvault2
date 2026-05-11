import { useState } from 'react';
import { Wizard, WizardStep } from '../components/ui/Wizard';

export function WizardsPage() {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { id: '1', label: 'Definition', number: 1 },
    { id: '2', label: 'Dimensions', number: 2 },
    { id: '3', label: 'Modeling', number: 3 },
    { id: '4', label: 'Segmentation', number: 4 }
  ];

  return (
    <div className="w-full min-h-0">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-content-primary mb-2">Wizards</h1>
          <p className="text-content-secondary">
            Step-by-step navigation components with visual progress indicators
          </p>
        </div>

        <div className="bg-surface-raised rounded-lg shadow-sm border border-stroke-subtle p-8 mb-8">
          <h2 className="text-2xl font-bold text-content-primary mb-6">Interactive Examples</h2>

          <div className="space-y-12">
            <div>
              <h3 className="text-lg font-semibold text-content-primary mb-4">Active State</h3>
              <div className="bg-surface-sunken rounded-lg p-8">
                <div className="flex items-center -space-x-2">
                  <WizardStep label="Definition" number={1} isActive />
                  <WizardStep label="Dimensions" number={2} />
                  <WizardStep label="Modeling" number={3} />
                  <WizardStep label="Segmentation" number={4} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-content-primary mb-4">Completed State</h3>
              <div className="bg-surface-sunken rounded-lg p-8">
                <div className="flex items-center -space-x-2">
                  <WizardStep label="Definition" number={1} isCompleted />
                  <WizardStep label="Dimensions" number={2} isCompleted />
                  <WizardStep label="Modeling" number={3} isActive />
                  <WizardStep label="Segmentation" number={4} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-content-primary mb-4">Variants with Icons</h3>
              <div className="bg-surface-sunken rounded-lg p-8 space-y-6">
                <div>
                  <p className="text-sm font-medium text-content-secondary mb-3">Success Variant</p>
                  <div className="flex items-center -space-x-2">
                    <WizardStep label="Wizard" isActive variant="success" showIcon iconType="check" />
                    <WizardStep label="Wizard" isActive variant="success" showIcon iconType="check" />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-content-secondary mb-3">Error Variant</p>
                  <div className="flex items-center -space-x-2">
                    <WizardStep label="Wizard" isActive variant="error" showIcon iconType="error" />
                    <WizardStep label="Wizard" isActive variant="error" showIcon iconType="error" />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-content-secondary mb-3">Warning Variant</p>
                  <div className="flex items-center -space-x-2">
                    <WizardStep label="Wizard" isActive variant="warning" showIcon iconType="warning" />
                    <WizardStep label="Wizard" isActive variant="warning" showIcon iconType="warning" />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-content-secondary mb-3">Info Variant</p>
                  <div className="flex items-center -space-x-2">
                    <WizardStep label="Wizard" isActive variant="info" showIcon iconType="info" />
                    <WizardStep label="Wizard" isActive variant="info" showIcon iconType="info" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-content-primary mb-4">Interactive Demo</h3>
              <div className="bg-surface-sunken rounded-lg p-8">
                <Wizard
                  steps={steps.map((step, index) => ({
                    ...step,
                    state: index < currentStep ? 'completed' : index === currentStep ? 'active' : 'default'
                  }))}
                  currentStep={currentStep}
                  onStepClick={(stepIndex) => setCurrentStep(stepIndex)}
                />

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                    className="px-6 py-2 bg-surface-overlay text-content-secondary rounded-lg hover:bg-surface-overlay disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
                    disabled={currentStep === 3}
                    className="px-6 py-2 bg-[indigo-600] text-white rounded-lg hover:bg-[indigo-700] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-content-primary mb-4">All States Combined</h3>
              <div className="bg-surface-sunken rounded-lg p-8">
                <div className="flex items-center -space-x-2">
                  <WizardStep label="Completed" isCompleted />
                  <WizardStep label="Completed" isCompleted />
                  <WizardStep label="Active" isActive />
                  <WizardStep label="Default" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface-raised rounded-lg shadow-sm border border-stroke-subtle p-8">
          <h2 className="text-2xl font-bold text-content-primary mb-4">Usage Guidelines</h2>
          <div className="prose max-w-none">
            <h3 className="text-lg font-semibold text-content-primary mt-6 mb-3">States</h3>
            <ul className="text-content-secondary space-y-2">
              <li><strong>Active:</strong> Current step the user is on (teal-700 or variant color)</li>
              <li><strong>Completed:</strong> Steps that have been finished (dark navy indigo-900)</li>
              <li><strong>Default:</strong> Upcoming steps that haven't been reached yet (gray)</li>
            </ul>

            <h3 className="text-lg font-semibold text-content-primary mt-6 mb-3">When to Use</h3>
            <ul className="text-content-secondary space-y-2">
              <li>For complex multi-step processes that require sequential completion</li>
              <li>When users need clear visual feedback about their progress</li>
              <li>For forms or workflows with multiple distinct stages</li>
              <li>When steps have dependencies or must be completed in order</li>
            </ul>

            <h3 className="text-lg font-semibold text-content-primary mt-6 mb-3">Best Practices</h3>
            <ul className="text-content-secondary space-y-2">
              <li>Keep wizard flows between 3-7 steps for optimal user experience</li>
              <li>Use clear, concise labels that describe each step's purpose</li>
              <li>Show progress visually with completed, active, and upcoming states</li>
              <li>Allow users to go back to previous steps when appropriate</li>
              <li>Use status colors (success, error, warning) to indicate step outcomes</li>
            </ul>

            <h3 className="text-lg font-semibold text-content-primary mt-6 mb-3">Variants</h3>
            <ul className="text-content-secondary space-y-2">
              <li><strong>Default:</strong> Teal color scheme for standard workflows</li>
              <li><strong>Success:</strong> Green for successful completion</li>
              <li><strong>Error:</strong> Red for error states</li>
              <li><strong>Warning:</strong> Orange for warnings</li>
              <li><strong>Info:</strong> Blue for informational steps</li>
            </ul>

            <h3 className="text-lg font-semibold text-content-primary mt-6 mb-3">Accessibility</h3>
            <ul className="text-content-secondary space-y-2">
              <li>Use semantic HTML and ARIA labels to describe wizard structure</li>
              <li>Ensure keyboard navigation between steps is intuitive</li>
              <li>Don't rely solely on color to convey step status</li>
              <li>Provide clear text labels for all steps</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
