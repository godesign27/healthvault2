import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface MenuItem {
  label: string;
  onClick?: () => void;
  submenu?: MenuItem[];
}

interface PopupMenuProps {
  items: MenuItem[];
  size?: 'normal' | 'small' | 'xsmall';
  showScrollbar?: boolean;
  maxHeight?: string;
}

export function PopupMenu({
  items,
  size = 'normal',
  showScrollbar = false,
  maxHeight = '300px'
}: PopupMenuProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const sizeClasses = {
    normal: 'text-base py-2 px-4',
    small: 'text-sm py-1.5 px-3',
    xsmall: 'text-xs py-1 px-2'
  };

  const widthClasses = {
    normal: 'min-w-[200px]',
    small: 'min-w-[160px]',
    xsmall: 'min-w-[140px]'
  };

  return (
    <div
      className={`
        bg-white border border-gray-200 rounded shadow-lg
        ${widthClasses[size]}
        ${showScrollbar ? 'overflow-y-auto' : 'overflow-hidden'}
      `}
      style={{ maxHeight: showScrollbar ? maxHeight : 'none' }}
    >
      {items.map((item, index) => (
        <div
          key={index}
          className={`
            flex items-center justify-between
            ${sizeClasses[size]}
            cursor-pointer transition-colors
            ${hoveredIndex === index ? 'bg-[indigo-600] text-white' : 'text-gray-700'}
            ${index !== items.length - 1 ? 'border-b border-gray-100' : ''}
          `}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          onClick={item.onClick}
        >
          <span>{item.label}</span>
          {item.submenu && (
            <ChevronRight className={`w-4 h-4 ${hoveredIndex === index ? 'text-white' : 'text-gray-400'}`} />
          )}
        </div>
      ))}
    </div>
  );
}
