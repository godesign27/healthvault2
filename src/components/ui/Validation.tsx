import { Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ValidationType = 'info' | 'negative' | 'positive' | 'warning';
export type ValidationSize = 'normal' | 'small';
export type ValidationLayout = 'text' | 'icon-left' | 'title' | 'title-icon';

interface ValidationProps {
  type: ValidationType;
  title?: string;
  message: string;
  size?: ValidationSize;
  layout?: ValidationLayout;
  className?: string;
}

const typeMap = {
  info:     { bg: 'bg-surface-feedback-info',    border: 'border-content-feedback-info',    text: 'text-content-feedback-info',    icon: Info },
  negative: { bg: 'bg-surface-feedback-error',   border: 'border-content-feedback-error',   text: 'text-content-feedback-error',   icon: AlertTriangle },
  positive: { bg: 'bg-surface-feedback-success', border: 'border-content-feedback-success', text: 'text-content-feedback-success', icon: CheckCircle },
  warning:  { bg: 'bg-surface-feedback-warning', border: 'border-content-feedback-warning', text: 'text-content-feedback-warning', icon: AlertCircle },
} as const;

export function Validation({ type, title, message, size = 'normal', layout = 'text', className = '' }: ValidationProps) {
  const { bg, border, text, icon: Icon } = typeMap[type];
  const iconSize = size === 'small' ? 'w-4 h-4' : 'w-5 h-5';
  const fontSize = size === 'small' ? 'text-sm' : 'text-base';
  const subFont  = size === 'small' ? 'text-xs'  : 'text-sm';
  const padding  = size === 'small' ? 'p-3' : 'p-4';

  const base = cn(bg, `border-l-4 ${border}`, padding, className);

  if (layout === 'text') {
    return (
      <div className={base}>
        <p className={cn(text, fontSize, 'font-medium')}>{title || message}</p>
      </div>
    );
  }

  if (layout === 'icon-left') {
    return (
      <div className={cn(base, 'flex items-start gap-3')}>
        <Icon className={cn(iconSize, text, 'shrink-0 mt-0.5')} />
        <p className={cn(text, fontSize, 'font-medium')}>{title || message}</p>
      </div>
    );
  }

  if (layout === 'title') {
    return (
      <div className={base}>
        <h4 className={cn(text, fontSize, 'font-bold mb-1')}>{title}</h4>
        <p className={cn(text, subFont)}>{message}</p>
      </div>
    );
  }

  return (
    <div className={base}>
      <div className="flex items-start gap-3">
        <Icon className={cn(iconSize, text, 'shrink-0 mt-0.5')} />
        <div className="flex-1">
          <h4 className={cn(text, fontSize, 'font-bold mb-1')}>{title}</h4>
          <p className={cn(text, subFont)}>{message}</p>
        </div>
      </div>
    </div>
  );
}

interface ValidationMessageProps {
  title: string;
  message: string;
  type: ValidationType;
  size?: ValidationSize;
  showIcon?: boolean;
  className?: string;
}

export function ValidationMessage({ title, message, type, size = 'normal', showIcon = false, className = '' }: ValidationMessageProps) {
  return (
    <Validation
      type={type}
      title={title}
      message={message}
      size={size}
      layout={showIcon ? 'title-icon' : 'title'}
      className={className}
    />
  );
}
