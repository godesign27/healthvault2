import { Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

export type WizardVariant = 'default' | 'success' | 'error' | 'warning' | 'info';
export type IconType = 'check' | 'error' | 'warning' | 'info';

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

const variantConfig = {
  default: {
    active: '#0F766E',
    completed: 'indigo-900',
    default: '#9CA3AF'
  },
  success: {
    active: '#059669',
    completed: 'indigo-900',
    default: '#9CA3AF'
  },
  error: {
    active: '#DC2626',
    completed: 'indigo-900',
    default: '#9CA3AF'
  },
  warning: {
    active: '#D97706',
    completed: 'indigo-900',
    default: '#9CA3AF'
  },
  info: {
    active: '#2563EB',
    completed: 'indigo-900',
    default: '#9CA3AF'
  }
};

function getIcon(iconType: IconType) {
  switch (iconType) {
    case 'check':
      return CheckCircle;
    case 'error':
      return AlertCircle;
    case 'warning':
      return AlertTriangle;
    case 'info':
      return Info;
    default:
      return CheckCircle;
  }
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
  isClickable = false
}: WizardStepProps) {
  const config = variantConfig[variant];
  const Icon = getIcon(iconType);

  const getBgColor = () => {
    if (isCompleted) return config.completed;
    if (isActive) return config.active;
    return config.default;
  };

  const bgColor = getBgColor();

  return (
    <div className={`relative flex items-center ${className}`}>
      <div
        className={`flex items-center pl-6 pr-6 relative z-10 ${isClickable ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
        style={{
          backgroundColor: bgColor,
          color: 'white',
          height: '40px',
          fontSize: '14px',
          clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 0 100%, 20px 50%)'
        }}
        onClick={isClickable ? onClick : undefined}
      >
        {showIcon && <Icon className="w-4 h-4 mr-2" />}
        {number && (
          <span className="mr-2 font-bold">
            {number}
          </span>
        )}
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

export function Wizard({
  steps,
  currentStep = 0,
  showIcons = false,
  className = '',
  onStepClick
}: WizardProps) {
  return (
    <div className={`flex items-center -space-x-2 ${className}`}>
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep || step.state === 'completed';
        const isClickable = onStepClick && (isActive || isCompleted);

        return (
          <WizardStep
            key={step.id}
            label={step.label}
            number={step.number}
            isActive={isActive && step.state !== 'completed'}
            isCompleted={isCompleted}
            variant={step.status || 'default'}
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
