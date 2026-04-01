import { Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

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

export function Validation({
  type,
  title,
  message,
  size = 'normal',
  layout = 'text',
  className = ''
}: ValidationProps) {
  const getTypeStyles = () => {
    switch (type) {
      case 'info':
        return {
          bg: 'bg-[#EFF6FF]',
          border: 'border-[#3B82F6]',
          text: 'text-[#1E3A8A]',
          iconColor: 'text-[#3B82F6]'
        };
      case 'negative':
        return {
          bg: 'bg-[#FEF2F2]',
          border: 'border-[#EF4444]',
          text: 'text-[#7F1D1D]',
          iconColor: 'text-[#EF4444]'
        };
      case 'positive':
        return {
          bg: 'bg-[#F0FDF4]',
          border: 'border-[#10B981]',
          text: 'text-[#064E3B]',
          iconColor: 'text-[#10B981]'
        };
      case 'warning':
        return {
          bg: 'bg-[#FEFCE8]',
          border: 'border-[#EAB308]',
          text: 'text-[#713F12]',
          iconColor: 'text-[#EAB308]'
        };
    }
  };

  const getIcon = () => {
    const iconSize = size === 'small' ? 'w-4 h-4' : 'w-5 h-5';

    switch (type) {
      case 'info':
        return <Info className={iconSize} />;
      case 'negative':
        return <AlertTriangle className={iconSize} />;
      case 'positive':
        return <CheckCircle className={iconSize} />;
      case 'warning':
        return <AlertCircle className={iconSize} />;
    }
  };

  const styles = getTypeStyles();
  const fontSize = size === 'small' ? 'text-sm' : 'text-base';
  const padding = size === 'small' ? 'p-3' : 'p-4';

  const renderContent = () => {
    switch (layout) {
      case 'text':
        return (
          <div className={`${styles.bg} ${styles.border} border-l-4 ${padding} ${className}`}>
            <p className={`${styles.text} ${fontSize} font-medium`}>
              {title || message}
            </p>
          </div>
        );

      case 'icon-left':
        return (
          <div className={`${styles.bg} ${styles.border} border-l-4 ${padding} flex items-start gap-3 ${className}`}>
            <div className={`${styles.iconColor} flex-shrink-0 mt-0.5`}>
              {getIcon()}
            </div>
            <p className={`${styles.text} ${fontSize} font-medium`}>
              {title || message}
            </p>
          </div>
        );

      case 'title':
        return (
          <div className={`${styles.bg} ${styles.border} border-l-4 ${padding} ${className}`}>
            <h4 className={`${styles.text} ${fontSize} font-bold mb-1`}>
              {title}
            </h4>
            <p className={`${styles.text} ${fontSize === 'text-sm' ? 'text-xs' : 'text-sm'}`}>
              {message}
            </p>
          </div>
        );

      case 'title-icon':
        return (
          <div className={`${styles.bg} ${styles.border} border-l-4 ${padding} ${className}`}>
            <div className="flex items-start gap-3">
              <div className={`${styles.iconColor} flex-shrink-0 mt-0.5`}>
                {getIcon()}
              </div>
              <div className="flex-1">
                <h4 className={`${styles.text} ${fontSize} font-bold mb-1`}>
                  {title}
                </h4>
                <p className={`${styles.text} ${fontSize === 'text-sm' ? 'text-xs' : 'text-sm'}`}>
                  {message}
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return renderContent();
}

interface ValidationMessageProps {
  title: string;
  message: string;
  type: ValidationType;
  size?: ValidationSize;
  showIcon?: boolean;
  className?: string;
}

export function ValidationMessage({
  title,
  message,
  type,
  size = 'normal',
  showIcon = false,
  className = ''
}: ValidationMessageProps) {
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
