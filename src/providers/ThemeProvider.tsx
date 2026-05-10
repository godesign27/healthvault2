import { ReactNode } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { Theme } from '@radix-ui/themes';

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Wraps the app in:
 *  1. next-themes ThemeProvider — applies .light/.dark class to <html> for
 *     class-based switching (compatible with Radix Themes convention).
 *  2. Radix <Theme> — wires Radix component variables. We deliberately do NOT
 *     pass appearance={resolvedTheme} to avoid flash-of-wrong-theme on load;
 *     class switching on <html> handles it instead.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <Theme
        accentColor="blue"
        grayColor="slate"
        panelBackground="solid"
        radius="medium"
        scaling="100%"
      >
        {children}
      </Theme>
    </NextThemesProvider>
  );
}
