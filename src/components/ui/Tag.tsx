import { X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export type TagSize = 'small' | 'medium' | 'large';
export type TagVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
export type TagStyle = 'filled' | 'outlined' | 'subtle';

const tagVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full font-medium',
  {
    variants: {
      size: {
        small:  'px-2 py-0.5 text-xs',
        medium: 'px-3 py-1 text-sm',
        large:  'px-4 py-2 text-base',
      },
      variant: {
        default: '',
        primary: '',
        success: '',
        warning: '',
        error:   '',
        info:    '',
      },
      tagStyle: {
        filled:   '',
        outlined: 'border',
        subtle:   '',
      },
    },
    compoundVariants: [
      /* filled */
      { tagStyle: 'filled', variant: 'default',  class: 'bg-surface-sunken text-content-secondary' },
      { tagStyle: 'filled', variant: 'primary',  class: 'bg-action-primary text-content-on-action' },
      { tagStyle: 'filled', variant: 'success',  class: 'bg-surface-feedback-success text-content-feedback-success' },
      { tagStyle: 'filled', variant: 'warning',  class: 'bg-surface-feedback-warning text-content-feedback-warning' },
      { tagStyle: 'filled', variant: 'error',    class: 'bg-surface-feedback-error text-content-feedback-error' },
      { tagStyle: 'filled', variant: 'info',     class: 'bg-surface-feedback-info text-content-feedback-info' },
      /* outlined */
      { tagStyle: 'outlined', variant: 'default',  class: 'border-stroke-default text-content-secondary bg-surface-raised' },
      { tagStyle: 'outlined', variant: 'primary',  class: 'border-action-primary text-action-primary bg-surface-raised' },
      { tagStyle: 'outlined', variant: 'success',  class: 'border-stroke-feedback-success text-content-feedback-success bg-surface-raised' },
      { tagStyle: 'outlined', variant: 'warning',  class: 'border-stroke-feedback-warning text-content-feedback-warning bg-surface-raised' },
      { tagStyle: 'outlined', variant: 'error',    class: 'border-stroke-feedback-error text-content-feedback-error bg-surface-raised' },
      { tagStyle: 'outlined', variant: 'info',     class: 'border-stroke-feedback-info text-content-feedback-info bg-surface-raised' },
      /* subtle */
      { tagStyle: 'subtle', variant: 'default',  class: 'bg-surface-sunken text-content-secondary' },
      { tagStyle: 'subtle', variant: 'primary',  class: 'bg-action-primary-subtle text-action-primary' },
      { tagStyle: 'subtle', variant: 'success',  class: 'bg-surface-feedback-success text-content-feedback-success' },
      { tagStyle: 'subtle', variant: 'warning',  class: 'bg-surface-feedback-warning text-content-feedback-warning' },
      { tagStyle: 'subtle', variant: 'error',    class: 'bg-surface-feedback-error text-content-feedback-error' },
      { tagStyle: 'subtle', variant: 'info',     class: 'bg-surface-feedback-info text-content-feedback-info' },
    ],
    defaultVariants: {
      size:     'medium',
      variant:  'default',
      tagStyle: 'filled',
    },
  }
);

const iconSizeMap = { small: 'w-3 h-3', medium: 'w-3.5 h-3.5', large: 'w-4 h-4' } as const;

interface TagProps extends VariantProps<typeof tagVariants> {
  children: React.ReactNode;
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
    <span className={cn(tagVariants({ size, variant, tagStyle }), className)}>
      <span>{children}</span>
      {removable && (
        <button
          onClick={onRemove}
          className="hover:opacity-70 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-current rounded-full"
          aria-label="Remove tag"
        >
          <X className={iconSizeMap[size ?? 'medium']} />
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
  const displayTags = maxDisplay ? tags.slice(0, maxDisplay) : tags;
  const remainingCount =
    maxDisplay && tags.length > maxDisplay ? tags.length - maxDisplay : 0;

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
