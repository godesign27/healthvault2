import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export type TagSize    = 'small' | 'medium' | 'large';
export type TagVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
export type TagStyle   = 'filled' | 'outlined' | 'subtle';

const sizeClasses: Record<TagSize, string> = {
  small:  'px-2 py-0.5 text-xs',
  medium: 'px-3 py-1 text-sm',
  large:  'px-4 py-2 text-base',
};

const filledClasses: Record<TagVariant, string> = {
  default: 'bg-surface-sunken text-content-secondary',
  primary: 'bg-action-primary text-content-on-action',
  success: 'bg-surface-feedback-success text-content-feedback-success',
  warning: 'bg-surface-feedback-warning text-content-feedback-warning',
  error:   'bg-surface-feedback-error text-content-feedback-error',
  info:    'bg-surface-feedback-info text-content-feedback-info',
};

const outlinedClasses: Record<TagVariant, string> = {
  default: 'border border-stroke-default text-content-secondary bg-surface-raised',
  primary: 'border border-action-primary text-action-primary bg-surface-raised',
  success: 'border border-stroke-feedback-success text-content-feedback-success bg-surface-raised',
  warning: 'border border-stroke-feedback-warning text-content-feedback-warning bg-surface-raised',
  error:   'border border-stroke-feedback-error text-content-feedback-error bg-surface-raised',
  info:    'border border-stroke-feedback-info text-content-feedback-info bg-surface-raised',
};

const subtleClasses: Record<TagVariant, string> = {
  default: 'bg-surface-sunken text-content-secondary',
  primary: 'bg-action-primary-subtle text-action-primary',
  success: 'bg-surface-feedback-success text-content-feedback-success',
  warning: 'bg-surface-feedback-warning text-content-feedback-warning',
  error:   'bg-surface-feedback-error text-content-feedback-error',
  info:    'bg-surface-feedback-info text-content-feedback-info',
};

const styleMap = { filled: filledClasses, outlined: outlinedClasses, subtle: subtleClasses };

const iconSizeMap: Record<TagSize, string> = {
  small:  'w-3 h-3',
  medium: 'w-3.5 h-3.5',
  large:  'w-4 h-4',
};

interface TagProps {
  children: React.ReactNode;
  size?: TagSize;
  variant?: TagVariant;
  style?: TagStyle;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

export function Tag({
  children,
  size = 'medium',
  variant = 'default',
  style: tagStyle = 'filled',
  removable = false,
  onRemove,
  className = '',
}: TagProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full font-medium',
      sizeClasses[size],
      styleMap[tagStyle][variant],
      className,
    )}>
      <span>{children}</span>
      {removable && (
        <button
          onClick={onRemove}
          className="hover:opacity-70 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-current rounded-full"
          aria-label="Remove tag"
        >
          <X className={iconSizeMap[size]} />
        </button>
      )}
    </span>
  );
}

interface TagGroupProps {
  tags: Array<{ id: string; label: string; variant?: TagVariant }>;
  onRemove?: (id: string) => void;
  size?: TagSize;
  style?: TagStyle;
  maxDisplay?: number;
  className?: string;
}

export function TagGroup({
  tags,
  onRemove,
  size = 'medium',
  style = 'filled',
  maxDisplay,
  className = '',
}: TagGroupProps) {
  const displayTags    = maxDisplay ? tags.slice(0, maxDisplay) : tags;
  const remainingCount = maxDisplay && tags.length > maxDisplay ? tags.length - maxDisplay : 0;

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {displayTags.map((tag) => (
        <Tag
          key={tag.id}
          variant={tag.variant ?? 'default'}
          size={size}
          style={style}
          removable={!!onRemove}
          onRemove={() => onRemove?.(tag.id)}
        >
          {tag.label}
        </Tag>
      ))}
      {remainingCount > 0 && (
        <Tag variant="default" size={size} style={style}>
          +{remainingCount}
        </Tag>
      )}
    </div>
  );
}
