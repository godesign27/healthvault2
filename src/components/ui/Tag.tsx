import { X } from 'lucide-react';

export type TagSize = 'small' | 'medium' | 'large';
export type TagVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
export type TagStyle = 'filled' | 'outlined' | 'subtle';

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
  style = 'filled',
  removable = false,
  onRemove,
  className = ''
}: TagProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          container: 'px-2 py-0.5 text-xs',
          icon: 'w-3 h-3'
        };
      case 'large':
        return {
          container: 'px-4 py-2 text-base',
          icon: 'w-4 h-4'
        };
      default:
        return {
          container: 'px-3 py-1 text-sm',
          icon: 'w-3.5 h-3.5'
        };
    }
  };

  const getVariantClasses = () => {
    switch (style) {
      case 'filled':
        switch (variant) {
          case 'primary':
            return 'bg-[indigo-600] text-white';
          case 'success':
            return 'bg-[#10B981] text-white';
          case 'warning':
            return 'bg-[#EAB308] text-gray-900';
          case 'error':
            return 'bg-[#EF4444] text-white';
          case 'info':
            return 'bg-[#3B82F6] text-white';
          default:
            return 'bg-gray-200 text-gray-900';
        }

      case 'outlined':
        switch (variant) {
          case 'primary':
            return 'border border-[indigo-600] text-[indigo-600] bg-white';
          case 'success':
            return 'border border-[#10B981] text-[#10B981] bg-white';
          case 'warning':
            return 'border border-[#EAB308] text-[#854D0E] bg-white';
          case 'error':
            return 'border border-[#EF4444] text-[#EF4444] bg-white';
          case 'info':
            return 'border border-[#3B82F6] text-[#3B82F6] bg-white';
          default:
            return 'border border-gray-300 text-gray-700 bg-white';
        }

      case 'subtle':
        switch (variant) {
          case 'primary':
            return 'bg-[#E6F4F7] text-[indigo-600]';
          case 'success':
            return 'bg-[#D1FAE5] text-[#065F46]';
          case 'warning':
            return 'bg-[#FEF3C7] text-[#854D0E]';
          case 'error':
            return 'bg-[#FEE2E2] text-[#991B1B]';
          case 'info':
            return 'bg-[#DBEAFE] text-[#1E40AF]';
          default:
            return 'bg-gray-100 text-gray-700';
        }

      default:
        return 'bg-gray-200 text-gray-900';
    }
  };

  const sizes = getSizeClasses();

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizes.container} ${getVariantClasses()} ${className}`}>
      <span>{children}</span>
      {removable && (
        <button
          onClick={onRemove}
          className="hover:opacity-70 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-current rounded-full"
          aria-label="Remove tag"
        >
          <X className={sizes.icon} />
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
  className = ''
}: TagGroupProps) {
  const displayTags = maxDisplay ? tags.slice(0, maxDisplay) : tags;
  const remainingCount = maxDisplay && tags.length > maxDisplay ? tags.length - maxDisplay : 0;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {displayTags.map(tag => (
        <Tag
          key={tag.id}
          variant={tag.variant || 'default'}
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
