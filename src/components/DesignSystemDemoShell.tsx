import type { HTMLAttributes, ReactNode } from 'react';
import { useSurface } from '../providers/SurfaceProvider';

export type DesignSystemDemoShellProps = {
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>;

/**
 * Scrollable content region for design-system gallery routes.
 * Uses semantic surfaces so `data-theme` on an ancestor can theme the gallery.
 * Under `data-surface="steel"`, adds `data-steel-glass` wrapper for frosted demo chrome.
 */
export function DesignSystemDemoShell({ children, className = '', ...rest }: DesignSystemDemoShellProps) {
  const { surface } = useSurface();
  const isSteel = surface === 'steel';

  return (
    <div
      data-steel-chrome={isSteel ? 'main' : undefined}
      className={`flex flex-1 flex-col min-h-0 overflow-auto bg-surface-page text-content-primary ${className}`.trim()}
      {...rest}
    >
      {isSteel ? (
        <div data-steel-glass="true" className="flex min-h-0 min-w-0 flex-1 flex-col">
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}
