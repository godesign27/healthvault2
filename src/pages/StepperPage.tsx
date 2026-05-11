import { useState } from 'react';
import { Stepper, StepStatus } from '../components/ui/Stepper';

export function StepperPage() {
  const [currentStep, setCurrentStep] = useState(1);

  const horizontalSteps = [
    {
      id: '1',
      title: 'Step Title',
      description: 'Step Description',
      status: currentStep > 0 ? 'success' : 'pending' as StepStatus
    },
    {
      id: '2',
      title: 'Round 1',
      description: 'Step Description',
      status: currentStep > 1 ? 'success' : currentStep === 1 ? 'active' : 'pending' as StepStatus
    },
    {
      id: '3',
      title: 'Round 2',
      description: 'Step Description',
      status: currentStep > 2 ? 'success' : currentStep === 2 ? 'active' : 'pending' as StepStatus
    },
    {
      id: '4',
      title: 'Round 3',
      description: 'Step Description',
      status: currentStep > 3 ? 'success' : currentStep === 3 ? 'active' : 'pending' as StepStatus
    },
    {
      id: '5',
      title: 'Step Post Score',
      description: 'Step Description',
      status: currentStep === 4 ? 'active' : 'pending' as StepStatus
    }
  ];

  const verticalStepsDefault = [
    { id: '1', title: 'Step Title', description: 'Step Description', status: 'success' as StepStatus },
    { id: '2', title: 'Step Title', description: 'Step Description', status: 'active' as StepStatus },
    { id: '3', title: 'Step Title', description: 'Step Description', status: 'pending' as StepStatus }
  ];

  const verticalStepsDisabled = [
    { id: '1', title: 'Step Title', description: 'Step Description', status: 'disabled' as StepStatus }
  ];

  const verticalStepsSuccess = [
    { id: '1', title: 'Step Title', description: 'Approved', status: 'success' as StepStatus }
  ];

  const verticalStepsInfo = [
    { id: '1', title: 'Step Title', description: 'Information', status: 'info' as StepStatus }
  ];

  const verticalStepsWarning = [
    { id: '1', title: 'Step Title', description: 'Warning', status: 'warning' as StepStatus }
  ];

  const verticalStepsDanger = [
    { id: '1', title: 'Step Title', description: 'Danger', status: 'danger' as StepStatus }
  ];

  return (
    <div className="w-full min-h-0">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-content-primary mb-2">Stepper</h1>
          <p className="text-content-secondary">
            Guide users through multi-step processes with clear progress indicators
          </p>
        </div>

        <div className="hv-surface-card p-8 mb-8">
          <h2 className="text-2xl font-bold text-content-primary mb-6">Interactive Examples</h2>

          <div className="space-y-12">
            <div>
              <h3 className="text-lg font-semibold text-content-primary mb-4">Horizontal Stepper</h3>
              <div className="bg-surface-sunken rounded-lg p-8">
                <Stepper steps={horizontalSteps} orientation="horizontal" />

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                    className="px-6 py-2 bg-surface-overlay text-content-secondary rounded-lg hover:bg-surface-overlay disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
                    disabled={currentStep === 4}
                    className="px-6 py-2 bg-[indigo-600] text-white rounded-lg hover:bg-[indigo-700] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-content-primary mb-4">Vertical Stepper - All States</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-surface-sunken rounded-lg p-6">
                  <h4 className="text-sm font-semibold text-content-secondary mb-4">Default</h4>
                  <Stepper steps={verticalStepsDefault} orientation="vertical" />
                </div>

                <div className="bg-surface-sunken rounded-lg p-6">
                  <h4 className="text-sm font-semibold text-content-secondary mb-4">Disabled</h4>
                  <Stepper steps={verticalStepsDisabled} orientation="vertical" />
                </div>

                <div className="bg-surface-sunken rounded-lg p-6">
                  <h4 className="text-sm font-semibold text-content-secondary mb-4">Success</h4>
                  <Stepper steps={verticalStepsSuccess} orientation="vertical" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-content-primary mb-4">Status Variants</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-surface-sunken rounded-lg p-6">
                  <h4 className="text-sm font-semibold text-content-secondary mb-4">Info</h4>
                  <Stepper steps={verticalStepsInfo} orientation="vertical" />
                </div>

                <div className="bg-surface-sunken rounded-lg p-6">
                  <h4 className="text-sm font-semibold text-content-secondary mb-4">Warning</h4>
                  <Stepper steps={verticalStepsWarning} orientation="vertical" />
                </div>

                <div className="bg-surface-sunken rounded-lg p-6">
                  <h4 className="text-sm font-semibold text-content-secondary mb-4">Danger</h4>
                  <Stepper steps={verticalStepsDanger} orientation="vertical" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-content-primary mb-4">Compact Variant</h3>
              <div className="bg-surface-sunken rounded-lg p-8">
                <Stepper
                  steps={[
                    { id: '1', title: 'Account', status: 'success' as StepStatus },
                    { id: '2', title: 'Profile', status: 'active' as StepStatus },
                    { id: '3', title: 'Verify', status: 'pending' as StepStatus },
                    { id: '4', title: 'Complete', status: 'pending' as StepStatus }
                  ]}
                  orientation="horizontal"
                  variant="compact"
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-content-primary mb-4">Section Labels</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-content-secondary w-32">Pending Approval</span>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-2 border-blue-500 bg-surface-raised" />
                    <span className="text-sm text-blue-600 font-medium uppercase">PENDING APPROVAL</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-content-secondary w-32">Approved</span>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-2 border-green-500 bg-surface-raised" />
                    <span className="text-sm text-green-600 font-medium uppercase">APPROVED</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-content-secondary w-32">Rejected</span>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-2 border-red-500 bg-surface-raised" />
                    <span className="text-sm text-red-600 font-medium uppercase">REJECTED</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-content-secondary w-32">Revision Requested</span>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-2 border-yellow-500 bg-surface-raised" />
                    <span className="text-sm text-yellow-600 font-medium uppercase">REVISION REQUESTED</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-content-secondary w-32">Failed</span>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-2 border-red-600 bg-surface-raised" />
                    <span className="text-sm text-red-600 font-medium uppercase">FAILED</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hv-surface-card p-8">
          <h2 className="text-2xl font-bold text-content-primary mb-4">Usage Guidelines</h2>
          <div className="prose max-w-none">
            <h3 className="text-lg font-semibold text-content-primary mt-6 mb-3">When to Use</h3>
            <ul className="text-content-secondary space-y-2">
              <li>For multi-step processes like checkout, registration, or onboarding</li>
              <li>When users need to complete tasks in a specific order</li>
              <li>To show progress through a linear workflow</li>
              <li>When each step has dependencies on previous steps</li>
            </ul>

            <h3 className="text-lg font-semibold text-content-primary mt-6 mb-3">Best Practices</h3>
            <ul className="text-content-secondary space-y-2">
              <li>Keep step titles concise and descriptive</li>
              <li>Use 3-7 steps for optimal user experience</li>
              <li>Show clear visual distinction between completed, active, and pending steps</li>
              <li>Include step descriptions for complex workflows</li>
              <li>Allow users to review previous steps when possible</li>
              <li>Use appropriate status colors to convey meaning (success, warning, error)</li>
            </ul>

            <h3 className="text-lg font-semibold text-content-primary mt-6 mb-3">Accessibility</h3>
            <ul className="text-content-secondary space-y-2">
              <li>Provide clear labels for each step</li>
              <li>Use semantic HTML and ARIA labels</li>
              <li>Ensure color is not the only indicator of status</li>
              <li>Make navigation buttons keyboard accessible</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
