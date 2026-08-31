import { useEffect, useState } from 'react';

/**
 * Theme preference, chosen inside the app.
 *
 * Three states, not two. "system" writes no attribute and lets the
 * `prefers-color-scheme` block in tokens.css decide, so a user who never chose
 * follows their phone. An explicit choice stamps `data-theme` and wins in both
 * directions, including against a phone that disagrees.
 *
 * Stored locally for now. Per the approved plan (section 8.1) theme is *synced*
 * user state and belongs in `user_settings` alongside `lang`, so choosing dark on
 * the phone turns the PC dark too. That is Phase 3. This is deliberately not
 * `next-themes`: that library owns its own persistence and would fight the sync
 * layer for the same fact.
 */
export type ThemePreference = 'light' | 'dark' | 'system';

/*
 * Bumped from 'vw.theme'. The previous version wrote the default on first load, so
 * browsers that had already opened the app carry a stored 'system' nobody chose.
 * A new key retires those silently instead of asking anyone to clear site data.
 */
const STORAGE_KEY = 'vw.theme.v2';

export function applyTheme(preference: ThemePreference): void {
  const root = document.documentElement;
  if (preference === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', preference);
}

function readStored(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === 'light' || value === 'dark' || value === 'system') return value;
  } catch {
    // Private mode, or site data blocked. Fall through to the brand default.
  }
  /*
   * Light, not 'system'. The pinned reference is a light product, so the brand
   * insists on a mode and the OS preference does not get to override it on first
   * run. Leaving this as 'system' meant a user whose phone is in dark mode saw a
   * brown-and-dark app that looked nothing like the reference, which is exactly
   * what happened. The user can still choose dark; it is just not the default.
   */
  return 'light';
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemePreference>(readStored);

  // Applying the theme is a render concern; persisting it is not.
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  /*
   * Only an explicit choice is written down. The previous version persisted the
   * value on every mount, which meant the first visit silently stored whatever the
   * default happened to be. When the default later changed from 'system' to
   * 'light', every browser that had ever loaded the app was already pinned to
   * 'system' and kept following the OS into dark mode. A default nobody chose must
   * never be recorded as if they had.
   */
  function setTheme(next: ThemePreference) {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not being able to remember the choice must never break using the app.
    }
  }

  return { theme, setTheme };
}

/** What the user actually sees now, after the system preference resolves. */
export function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (preference !== 'system') return preference;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
