import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

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

const statusStyle = {
  pending:  { circle: 'bg-surface-sunken border-stroke-default text-content-tertiary',       line: 'bg-stroke-default' },
  active:   { circle: 'bg-action-primary border-action-primary text-content-on-action',       line: 'bg-action-primary' },
  success:  { circle: 'bg-action-primary border-action-primary text-content-on-action',       line: 'bg-action-primary' },
  disabled: { circle: 'bg-surface-sunken border-stroke-subtle text-content-disabled',         line: 'bg-stroke-subtle' },
  info:     { circle: 'bg-surface-feedback-info border-content-feedback-info text-content-feedback-info',       line: 'bg-content-feedback-info' },
  warning:  { circle: 'bg-surface-feedback-warning border-content-feedback-warning text-content-feedback-warning', line: 'bg-content-feedback-warning' },
  danger:   { circle: 'bg-surface-feedback-error border-content-feedback-error text-content-feedback-error',     line: 'bg-content-feedback-error' },
} as const;

function StepCircle({ step, index }: { step: Step; index: number }) {
  const s = statusStyle[step.status];
  return (
    <div className={cn('w-10 h-10 rounded-full border-2 flex items-center justify-center font-semibold', s.circle)}>
      {step.status === 'success' ? (
        <Check className="w-5 h-5" />
      ) : (
        <span className="text-sm">{index + 1}</span>
      )}
    </div>
  );
}

export function Stepper({ steps, orientation = 'horizontal', variant = 'default', className = '' }: StepperProps) {
  if (orientation === 'vertical') {
    return (
      <div className={cn('flex flex-col', className)}>
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const s      = statusStyle[step.status];

          return (
            <div key={step.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <StepCircle step={step} index={index} />
                {!isLast && <div className={cn('w-0.5 h-16 my-2', s.line)} />}
              </div>
              <div className="flex-1 pb-8">
                <div className={cn('font-semibold', step.status === 'disabled' ? 'text-content-disabled' : 'text-content-primary')}>
                  {step.title}
                </div>
                {step.description && variant === 'default' && (
                  <div className="text-sm text-content-secondary mt-1">{step.description}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center', className)}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const s      = statusStyle[step.status];

        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <StepCircle step={step} index={index} />
              <div className={cn('text-center mt-2', step.status === 'disabled' ? 'text-content-disabled' : 'text-content-primary')}>
                <div className="font-medium text-sm">{step.title}</div>
                {step.description && variant === 'default' && (
                  <div className="text-xs text-content-secondary mt-1">{step.description}</div>
                )}
              </div>
            </div>
            {!isLast && <div className={cn('flex-1 h-0.5 mx-4 mb-8', s.line)} />}
          </div>
        );
      })}
    </div>
  );
}
