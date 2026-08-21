import { createContext, useContext, ReactNode } from 'react';

type SurfaceName = 'default' | 'bold' | 'subdued' | 'overlay' | 'steel';

interface SurfaceContextValue {
  surface: SurfaceName;
}

const SurfaceContext = createContext<SurfaceContextValue>({ surface: 'default' });

export function useSurface() {
  return useContext(SurfaceContext);
}

interface SurfaceProps {
  name: SurfaceName;
  children: ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Wraps children in a surface context. Applies data-surface attribute so
 * CSS token theme files (theme.bold.css, theme.subdued.css, etc.) remap
 * semantic token values automatically — zero component code changes needed.
 *
 * Usage:
 *   <Surface name="subdued">  ← sidebar, nav panels
 *   <Surface name="bold">     ← hero sections, branded headers
 *   <Surface name="overlay">  ← modals, drawers, popovers
 *   <Surface name="steel">    ← design-system frosted-glass gallery
 */
export function Surface({
  name,
  children,
  className,
  as: Tag = 'div',
}: SurfaceProps) {
  return (
    <SurfaceContext.Provider value={{ surface: name }}>
      <Tag
        data-surface={name}
        className={className}
      >
        {children}
      </Tag>
    </SurfaceContext.Provider>
  );
}
