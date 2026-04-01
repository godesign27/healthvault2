import { Check } from 'lucide-react';

export type StepStatus = 'pending' | 'active' | 'success' | 'disabled' | 'info' | 'warning' | 'danger';

interface Step {
  id: string;
  title: string;
  description?: string;
  status: StepStatus;
}

interface StepperProps {
  steps: Step[];
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'compact';
  className?: string;
}

const statusColors = {
  pending: {
    bg: 'bg-gray-200',
    border: 'border-gray-300',
    text: 'text-gray-500',
    line: 'bg-gray-300'
  },
  active: {
    bg: 'bg-[indigo-600]',
    border: 'border-[indigo-600]',
    text: 'text-white',
    line: 'bg-[indigo-600]'
  },
  success: {
    bg: 'bg-[indigo-600]',
    border: 'border-[indigo-600]',
    text: 'text-white',
    line: 'bg-[indigo-600]'
  },
  disabled: {
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    text: 'text-gray-400',
    line: 'bg-gray-200'
  },
  info: {
    bg: 'bg-blue-500',
    border: 'border-blue-500',
    text: 'text-white',
    line: 'bg-blue-500'
  },
  warning: {
    bg: 'bg-yellow-500',
    border: 'border-yellow-500',
    text: 'text-white',
    line: 'bg-yellow-500'
  },
  danger: {
    bg: 'bg-red-500',
    border: 'border-red-500',
    text: 'text-white',
    line: 'bg-red-500'
  }
};

export function Stepper({ steps, orientation = 'horizontal', variant = 'default', className = '' }: StepperProps) {
  if (orientation === 'vertical') {
    return (
      <div className={`flex flex-col ${className}`}>
        {steps.map((step, index) => {
          const colors = statusColors[step.status];
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${colors.bg} ${colors.border} ${colors.text} font-semibold`}
                >
                  {step.status === 'success' ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm">{index + 1}</span>
                  )}
                </div>
                {!isLast && (
                  <div className={`w-0.5 h-16 ${colors.line} my-2`} />
                )}
              </div>

              <div className="flex-1 pb-8">
                <div className={`font-semibold ${step.status === 'disabled' ? 'text-gray-400' : 'text-gray-900'}`}>
                  {step.title}
                </div>
                {step.description && variant === 'default' && (
                  <div className="text-sm text-gray-600 mt-1">
                    {step.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      {steps.map((step, index) => {
        const colors = statusColors[step.status];
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${colors.bg} ${colors.border} ${colors.text} font-semibold`}
              >
                {step.status === 'success' ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm">{index + 1}</span>
                )}
              </div>
              <div className={`text-center mt-2 ${step.status === 'disabled' ? 'text-gray-400' : 'text-gray-900'}`}>
                <div className="font-medium text-sm">{step.title}</div>
                {step.description && variant === 'default' && (
                  <div className="text-xs text-gray-600 mt-1">
                    {step.description}
                  </div>
                )}
              </div>
            </div>

            {!isLast && (
              <div className={`flex-1 h-0.5 ${colors.line} mx-4`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
