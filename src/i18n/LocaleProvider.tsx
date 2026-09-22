import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { copyFor, initialLocale, storeLocale, type Locale } from './index';
import { LocaleContext } from './locale-context';

/**
 * Applies the chosen language to the whole application, on every route.
 *
 * Mounted above the router, like <ThemeProvider>, so the first screen to paint is
 * already in the right language. A language that only applies on some screens is not
 * a language.
 *
 * `<html lang>` is set here and not in index.html. It is what a screen reader uses
 * to pick its voice, and a French page announced with Portuguese phonetics is
 * unusable — the words are right and none of them are understandable. It is also
 * what the browser uses for hyphenation and for offering to translate the page.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    document.documentElement.setAttribute('lang', locale);
  }, [locale]);

  /*
   * Only an explicit choice is written down — the same rule the theme learned the
   * hard way. `initialLocale()` may have GUESSED from `navigator.languages`, and a
   * guess stored on first load would pin a browser to a language nobody picked.
   */
  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    storeLocale(next);
  }, []);

  const value = useMemo(
    () => ({ locale, setLocale, t: copyFor(locale) }),
    [locale, setLocale],
  );

  return <LocaleContext value={value}>{children}</LocaleContext>;
}
