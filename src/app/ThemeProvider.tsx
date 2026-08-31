import type { ReactNode } from 'react';

import { ThemeContext } from './theme-context';
import { useTheme } from './theme';

/**
 * Applies the theme for the whole application, on every route.
 *
 * Mounted above the router so the attribute is set before any screen paints,
 * whichever screen that turns out to be.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const state = useTheme();
  return <ThemeContext value={state}>{children}</ThemeContext>;
}
