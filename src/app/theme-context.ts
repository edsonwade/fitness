import { createContext, useContext } from 'react';

import type { ThemePreference } from './theme';

export type ThemeState = {
  theme: ThemePreference;
  setTheme: (next: ThemePreference) => void;
};

/**
 * The theme preference, applied once at the root and read anywhere.
 *
 * This exists because applying the theme used to be a side effect of the Programs
 * screen rendering: `useTheme` was called inside its top bar, so any route that did
 * not mount that screen, the gate above all, ignored a stored dark preference
 * entirely and rendered light. A preference that only applies on some screens is
 * not a preference.
 */
export const ThemeContext = createContext<ThemeState | null>(null);

export function useThemeState(): ThemeState {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useThemeState used outside <ThemeProvider>');
  return value;
}
