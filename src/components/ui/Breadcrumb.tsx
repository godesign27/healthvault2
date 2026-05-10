import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../lib/utils';

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

const sizeMap = {
  'x-small': { text: 'text-[10px]', icon: 'w-3 h-3',   gap: 'gap-1.5' },
  'small':   { text: 'text-xs',     icon: 'w-3.5 h-3.5', gap: 'gap-2' },
  'normal':  { text: 'text-sm',     icon: 'w-4 h-4',    gap: 'gap-2' },
} as const;

const themeMap = {
  light: {
    active:    'text-content-primary font-semibold',
    previous:  'text-action-link italic hover:text-action-primary transition-colors',
    separator: 'text-content-tertiary',
    back:      'text-action-link hover:text-action-primary transition-colors',
  },
  dark: {
    active:    'text-hv-neutral-0 font-semibold',
    previous:  'text-hv-neutral-400 italic hover:text-hv-neutral-0 transition-colors',
    separator: 'text-hv-neutral-600',
    back:      'text-hv-neutral-0 hover:text-hv-neutral-300 transition-colors',
  },
} as const;

export function Breadcrumb({
  items,
  size = 'normal',
  theme = 'light',
  showHomeIcon = false,
  showBackLink = false,
  onBackClick,
}: BreadcrumbProps) {
  const s = sizeMap[size];
  const t = themeMap[theme];

  return (
    <nav className="flex flex-col gap-2" aria-label="Breadcrumb">
      <ol className={cn('flex items-center flex-wrap', s.gap)}>
        {showHomeIcon && (
          <>
            <li>
              <button
                onClick={items[0]?.onClick}
                className={cn('inline-flex items-center', t.previous)}
                aria-label="Home"
              >
                <Home className={s.icon} />
              </button>
            </li>
            <li aria-hidden><ChevronRight className={cn(s.icon, t.separator)} /></li>
          </>
        )}

        {items.map((item, index) => {
          const isLast   = index === items.length - 1;
          const isActive = item.isActive || isLast;

          return (
            <li key={index} className={cn('flex items-center', s.gap)}>
              {isActive ? (
                <span className={cn(s.text, t.active, 'tracking-tight')} aria-current="page">
                  {item.label}
                </span>
              ) : (
                <>
                  <button
                    onClick={item.onClick}
                    className={cn(s.text, t.previous, 'tracking-tight cursor-pointer')}
                  >
                    {item.label}
                  </button>
                  <ChevronRight aria-hidden className={cn(s.icon, t.separator)} />
                </>
              )}
            </li>
          );
        })}
      </ol>

      {showBackLink && (
        <button
          onClick={onBackClick}
          className={cn('inline-flex items-center', s.gap, s.text, t.back, 'w-fit')}
        >
          <ChevronRight className={cn(s.icon, 'rotate-180')} />
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
  onClick,
}: BreadcrumbLinkProps) {
  const s = sizeMap[size];

  const base = cn('inline-flex items-center justify-center gap-1.5 rounded transition-colors', s.text, 'px-2.5 py-1');

  const cls = theme === 'dark'
    ? isActive    ? cn(base, 'bg-action-primary text-content-on-action border-2 border-action-primary')
      : isPrevious ? cn(base, 'border-2 border-stroke-strong text-content-secondary')
                   : cn(base, 'border-2 border-transparent text-content-secondary')
    : isActive    ? cn(base, 'bg-surface-raised text-action-primary border-2 border-action-primary')
      : isPrevious ? cn(base, 'border-2 border-stroke-default text-content-secondary')
                   : cn(base, 'border-2 border-transparent text-content-secondary');

  return (
    <button onClick={onClick} className={cls}>
      {isIconOnly ? (
        <Home className={s.icon} />
      ) : (
        <>
          <Home className={s.icon} />
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

export function BreadcrumbSeparator({ size = 'normal', theme = 'light' }: BreadcrumbSeparatorProps) {
  const iconClass = sizeMap[size].icon;
  const color = theme === 'dark' ? 'text-hv-neutral-600' : 'text-content-tertiary';
  return <ChevronRight aria-hidden className={cn(iconClass, color)} />;
}
