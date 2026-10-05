import { useState } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface WizardStepProps {
  number?: number;
  label: string;
  subtext?: string;
  isActive?: boolean;
  isCompleted?: boolean;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  size?: 'default' | 'small' | 'large';
  showIcon?: boolean;
  iconType?: 'check' | 'error' | 'warning' | 'info';
}

// Base Wizard Step Component
export const WizardStep = ({
  number, 
  label,
  subtext,
  isActive = false, 
  isCompleted = false,
  variant = 'default',
  size = 'default',
  showIcon = false,
  iconType = 'check'
}: WizardStepProps) => {
  const getVariantClasses = () => {
    if (isCompleted) return 'bg-action-primary text-content-on-action';
    if (isActive) {
      switch(variant) {
        case 'success': return 'bg-surface-feedback-success text-content-primary';
        case 'error': return 'bg-surface-feedback-error text-content-primary';
        case 'warning': return 'bg-surface-feedback-warning text-content-primary';
        case 'info': return 'bg-surface-feedback-info text-content-primary';
        default: return 'bg-action-primary text-content-on-action';
      }
    }
    return 'bg-surface-sunken text-content-secondary';
  };
  

  const getSizeClasses = () => {
    switch(size) {
      case 'small': return 'min-h-8 py-2 text-sm';
      case 'large': return 'min-h-12 py-2 text-base';
      default: return 'min-h-10 py-2 text-sm';
    }
  };

  const getIcon = () => {
    switch(iconType) {
      case 'check': return <CheckCircle className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'info': return <Info className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="relative flex items-center">
      <div 
        className={`flex items-center ${getVariantClasses()} ${getSizeClasses()} pl-6 pr-6 clip-path-chevron relative z-10`}
        aria-current={isActive ? 'step' : undefined}
      >
        {showIcon && (
          <span className="mr-2">{getIcon()}</span>
        )}
        {number && (
          <span className="mr-2 text-sm font-bold">
            {number}
          </span>
        )}
        <span className="font-medium">{label}{subtext && <span className="block font-normal text-sm">{subtext}</span>}</span>
      </div>
      <div 
        className={`absolute right-0 w-0 h-0 border-l-[20px] border-y-[20px] border-y-transparent z-20`}
        style={isCompleted ? { borderLeftColor: 'var(--hv-color-action-primary-default)' } : {}}
      ></div>
    </div>
  );
};

// Wizard Demo Component
const WizardDemo = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { number: 1, label: 'Definition' },
    { number: 2, label: 'Dimensions' },
    { number: 3, label: 'Modeling' },
    { number: 4, label: 'Segmentation' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Main Process Flow */}
        <div className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Process Flow</h2>
          <div className="flex items-center -space-x-2">
            {steps.map((step, idx) => (
              <WizardStep
                key={idx}
                number={step.number}
                label={step.label}
                isActive={idx === activeStep}
                isCompleted={idx < activeStep}
              />
            ))}
          </div>
          <div className="mt-6 flex gap-4">
            <button
              onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              disabled={activeStep === 0}
            >
              Previous
            </button>
            <button
              onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))}
              className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
              disabled={activeStep === steps.length - 1}
            >
              Next
            </button>
          </div>
        </div>

        {/* State Variants */}
        <div className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">State Variants</h2>
          
          <div className="space-y-8">
            {/* Default */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-3">DEFAULT</h3>
              <div className="flex items-center -space-x-2">
                <WizardStep label="Wizard" />
                <WizardStep label="Wizard" subtext="Description text" />
              </div>
            </div>

            {/* Active */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-3">ACTIVE</h3>
              <div className="flex items-center flex-wrap gap-y-4 -space-x-2">
                <WizardStep label="Wizard" isActive />
                <WizardStep label="Wizard" subtext="Description text" isActive />
                <WizardStep label="Wizard" isActive variant="success" showIcon iconType="check" />
                <WizardStep label="Wizard" subtext="Description text" isActive variant="success" showIcon iconType="check" />
                <WizardStep label="Wizard" isActive variant="error" showIcon iconType="error" />
                <WizardStep label="Wizard" subtext="Description text" isActive variant="error" showIcon iconType="error" />
                <WizardStep label="Wizard" isActive variant="warning" showIcon iconType="warning" />
                <WizardStep label="Wizard" subtext="Description text" isActive variant="warning" showIcon iconType="warning" />
              </div>
              <div className="flex items-center flex-wrap gap-y-4 -space-x-2 mt-4">
                <WizardStep label="Wizard" isActive variant="info" showIcon iconType="info" />
                <WizardStep label="Wizard" subtext="Description text" isActive variant="info" showIcon iconType="info" />
              </div>
            </div>

            {/* Hover */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-3">HOVER</h3>
              <div className="flex items-center -space-x-2 hover:opacity-80 cursor-pointer">
                <WizardStep label="Wizard" isActive />
                <WizardStep label="Wizard" subtext="Description text" isActive />
              </div>
            </div>

            {/* Focus */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-3">FOCUS</h3>
              <div className="flex items-center -space-x-2 ring-2 ring-blue-500 ring-offset-2 rounded">
                <WizardStep label="Wizard" isActive />
                <WizardStep label="Wizard" subtext="Description text" isActive />
              </div>
            </div>

            {/* Completed & Disabled */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-3">COMPLETED / DISABLED</h3>
              <div className="flex items-center -space-x-2">
                <WizardStep label="Wizard" isCompleted />
                <WizardStep label="Wizard" subtext="Description text" isCompleted />
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal & Vertical Wizards */}
        <div className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Layout Examples</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Horizontal */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-3">HORIZONTAL WIZARD</h3>
              <div className="flex items-center -space-x-2">
                <WizardStep label="Wizard" isCompleted />
                <WizardStep label="Wizard" isActive />
                <WizardStep label="Wizard" />
                <WizardStep label="Wizard" />
              </div>
            </div>

            {/* Vertical */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-3">VERTICAL WIZARD</h3>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center">
                  <WizardStep label="Wizard" isActive variant="success" showIcon iconType="check" />
                </div>
                <div className="flex items-center">
                  <WizardStep label="Wizard" />
                </div>
                <div className="flex items-center">
                  <WizardStep label="Wizard" />
                </div>
                <div className="flex items-center">
                  <WizardStep label="Wizard" />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* CSS for chevron shape */}
      <style>{`
        .clip-path-chevron {
          clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 0 100%, 20px 50%);
        }
      `}</style>
    </div>
  );
};

export default WizardDemo;