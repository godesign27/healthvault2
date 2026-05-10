import { Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export type WizardVariant = 'default' | 'success' | 'error' | 'warning' | 'info';
export type IconType = 'check' | 'error' | 'warning' | 'info';

const variantColor: Record<WizardVariant, { active: string; completed: string; pending: string }> = {
  default: { active: 'var(--hv-color-action-primary-default)', completed: 'var(--hv-color-neutral-900)', pending: 'var(--hv-color-neutral-400)' },
  success: { active: 'var(--hv-color-success-600)',            completed: 'var(--hv-color-neutral-900)', pending: 'var(--hv-color-neutral-400)' },
  error:   { active: 'var(--hv-color-error-600)',              completed: 'var(--hv-color-neutral-900)', pending: 'var(--hv-color-neutral-400)' },
  warning: { active: 'var(--hv-color-warning-600)',            completed: 'var(--hv-color-neutral-900)', pending: 'var(--hv-color-neutral-400)' },
  info:    { active: 'var(--hv-color-info-600)',               completed: 'var(--hv-color-neutral-900)', pending: 'var(--hv-color-neutral-400)' },
};

const iconMap: Record<IconType, typeof CheckCircle> = {
  check:   CheckCircle,
  error:   AlertCircle,
  warning: AlertTriangle,
  info:    Info,
};

interface WizardStepProps {
  label: string;
  number?: number;
  isActive?: boolean;
  isCompleted?: boolean;
  variant?: WizardVariant;
  showIcon?: boolean;
  iconType?: IconType;
  className?: string;
  onClick?: () => void;
  isClickable?: boolean;
}

export function WizardStep({
  label,
  number,
  isActive = false,
  isCompleted = false,
  variant = 'default',
  showIcon = false,
  iconType = 'check',
  className = '',
  onClick,
  isClickable = false,
}: WizardStepProps) {
  const Icon = iconMap[iconType];
  const colors = variantColor[variant];
  const bgColor = isCompleted ? colors.completed : isActive ? colors.active : colors.pending;

  return (
    <div className={cn('relative flex items-center', className)}>
      <div
        onClick={isClickable ? onClick : undefined}
        className={cn(
          'flex items-center pl-6 pr-6 relative z-10',
          isClickable && 'cursor-pointer hover:opacity-90 transition-opacity',
        )}
        style={{
          backgroundColor: bgColor,
          color: 'white',
          height: '40px',
          fontSize: '14px',
          clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 0 100%, 20px 50%)',
        }}
      >
        {showIcon && <Icon className="w-4 h-4 mr-2" />}
        {number !== undefined && <span className="mr-2 font-bold">{number}</span>}
        <span className="font-medium whitespace-nowrap">{label}</span>
      </div>
      <div
        className="absolute right-0 w-0 h-0 border-l-[20px] border-y-[20px] border-y-transparent z-20"
        style={{ borderLeftColor: bgColor }}
      />
    </div>
  );
}

interface WizardProps {
  steps: Array<{
    id: string;
    label: string;
    number?: number;
    status?: WizardVariant;
    state?: 'active' | 'completed' | 'default';
  }>;
  currentStep?: number;
  showIcons?: boolean;
  className?: string;
  onStepClick?: (stepIndex: number) => void;
}

export function Wizard({ steps, currentStep = 0, showIcons = false, className = '', onStepClick }: WizardProps) {
  return (
    <div className={cn('flex items-center -space-x-2', className)}>
      {steps.map((step, index) => {
        const isActive    = index === currentStep;
        const isCompleted = index < currentStep || step.state === 'completed';
        const isClickable = !!(onStepClick && (isActive || isCompleted));

        return (
          <WizardStep
            key={step.id}
            label={step.label}
            number={step.number}
            isActive={isActive && step.state !== 'completed'}
            isCompleted={isCompleted}
            variant={step.status ?? 'default'}
            showIcon={showIcons}
            iconType="check"
            onClick={() => onStepClick?.(index)}
            isClickable={isClickable}
          />
        );
      })}
    </div>
  );
}
