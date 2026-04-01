import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  isActive?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  size?: 'normal' | 'small' | 'x-small';
  theme?: 'light' | 'dark';
  showHomeIcon?: boolean;
  showBackLink?: boolean;
  onBackClick?: () => void;
}

export function Breadcrumb({
  items,
  size = 'normal',
  theme = 'light',
  showHomeIcon = false,
  showBackLink = false,
  onBackClick
}: BreadcrumbProps) {
  const sizeClasses = {
    'x-small': {
      text: 'text-[10px]',
      icon: 'w-3 h-3',
      gap: 'gap-2',
      padding: 'px-2 py-0.5'
    },
    'small': {
      text: 'text-xs',
      icon: 'w-4 h-4',
      gap: 'gap-2',
      padding: 'px-2.5 py-1'
    },
    'normal': {
      text: 'text-base',
      icon: 'w-6 h-6',
      gap: 'gap-2',
      padding: 'px-3 py-1.5'
    }
  };

  const themeClasses = {
    light: {
      active: 'text-gray-900 font-bold',
      previous: 'text-[indigo-700] italic font-normal hover:text-[indigo-900]',
      separator: 'text-[#5B5864]',
      back: 'text-[indigo-600] hover:text-[indigo-700]'
    },
    dark: {
      active: 'text-white font-bold',
      previous: 'text-gray-400 italic hover:text-white',
      separator: 'text-gray-600',
      back: 'text-white hover:text-gray-300'
    }
  };

  const sizes = sizeClasses[size];
  const colors = themeClasses[theme];

  return (
    <nav className="flex flex-col gap-2">
      <div className={`flex items-center ${sizes.gap}`}>
        {showHomeIcon && (
          <>
            <button
              onClick={items[0]?.onClick}
              className={`inline-flex items-center ${colors.previous} transition-colors`}
              aria-label="Home"
            >
              <Home className={sizes.icon} />
            </button>
            <ChevronRight className={`${sizes.icon} ${colors.separator}`} />
          </>
        )}

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isActive = item.isActive || isLast;

          return (
            <div key={index} className={`flex items-center ${sizes.gap}`}>
              {isActive ? (
                <span className={`${sizes.text} ${colors.active} tracking-tight`}>
                  {item.label}
                </span>
              ) : (
                <>
                  <button
                    onClick={item.onClick}
                    className={`${sizes.text} ${colors.previous} transition-colors cursor-pointer tracking-tight`}
                  >
                    {item.label}
                  </button>
                  <ChevronRight className={`${sizes.icon} ${colors.separator}`} />
                </>
              )}
            </div>
          );
        })}
      </div>

      {showBackLink && (
        <button
          onClick={onBackClick}
          className={`inline-flex items-center ${sizes.gap} ${sizes.text} ${colors.back} transition-colors w-fit`}
        >
          <ChevronRight className={`${sizes.icon} rotate-180`} />
          <span>Back to page</span>
        </button>
      )}
    </nav>
  );
}

interface BreadcrumbLinkProps {
  label: string;
  isActive?: boolean;
  isPrevious?: boolean;
  isIconOnly?: boolean;
  size?: 'normal' | 'small' | 'x-small';
  theme?: 'light' | 'dark';
  onClick?: () => void;
}

export function BreadcrumbLink({
  label,
  isActive = false,
  isPrevious = false,
  isIconOnly = false,
  size = 'normal',
  theme = 'light',
  onClick
}: BreadcrumbLinkProps) {
  const sizeClasses = {
    'x-small': {
      text: 'text-[10px]',
      icon: 'w-2.5 h-2.5',
      padding: 'px-2 py-0.5'
    },
    'small': {
      text: 'text-xs',
      icon: 'w-3 h-3',
      padding: 'px-2.5 py-1'
    },
    'normal': {
      text: 'text-sm',
      icon: 'w-4 h-4',
      padding: 'px-3 py-1.5'
    }
  };

  const sizes = sizeClasses[size];

  const getClasses = () => {
    const base = `inline-flex items-center justify-center gap-1.5 rounded transition-colors ${sizes.text} ${sizes.padding}`;

    if (theme === 'dark') {
      if (isActive) {
        return `${base} bg-[indigo-600] text-white border-2 border-[indigo-600]`;
      } else if (isPrevious) {
        return `${base} border-2 border-gray-600 text-gray-400`;
      } else {
        return `${base} border-2 border-transparent text-gray-400`;
      }
    } else {
      if (isActive) {
        return `${base} bg-white text-[indigo-600] border-2 border-[indigo-600]`;
      } else if (isPrevious) {
        return `${base} border-2 border-gray-300 text-gray-600`;
      } else {
        return `${base} border-2 border-transparent text-gray-600`;
      }
    }
  };

  return (
    <button onClick={onClick} className={getClasses()}>
      {isIconOnly ? (
        <Home className={sizes.icon} />
      ) : (
        <>
          <Home className={sizes.icon} />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

interface BreadcrumbSeparatorProps {
  size?: 'normal' | 'small' | 'x-small';
  theme?: 'light' | 'dark';
}

export function BreadcrumbSeparator({
  size = 'normal',
  theme = 'light'
}: BreadcrumbSeparatorProps) {
  const sizeClasses = {
    'x-small': 'w-2.5 h-2.5',
    'small': 'w-3 h-3',
    'normal': 'w-4 h-4'
  };

  const colorClass = theme === 'dark' ? 'text-gray-600' : 'text-gray-400';

  return <ChevronRight className={`${sizeClasses[size]} ${colorClass}`} />;
}
