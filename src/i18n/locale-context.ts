import { createContext, useContext } from 'react';

import { copyFor, FALLBACK, type Copy, type Locale } from './index';

export type LocaleState = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: Copy;
};

/**
 * The chosen language, set once at the root and read anywhere.
 *
 * Split from the provider for the same reason the theme is: a module that exports
 * both a component and a hook breaks fast refresh, and this is the file every screen
 * imports.
 *
 * The context has a real default rather than `null`, and that is deliberate — it is
 * the opposite of `useThemeState`, which throws. A screen rendered outside the
 * provider (a unit test mounting one card, say) must still render words; throwing
 * would mean every test that touches copy has to wrap in a provider it does not care
 * about. Portuguese is the source language, so the default is not a degraded state.
 */
export const LocaleContext = createContext<LocaleState>({
  locale: FALLBACK,
  setLocale: () => {},
  t: copyFor(FALLBACK),
});

/** The whole language state: what it is, and how to change it. */
export function useLocale(): LocaleState {
  return useContext(LocaleContext);
}

/**
 * The copy, in the current language.
 *
 * `const t = useT()` then `t.train.title`. The same shape as the old
 * `import { pt }`, so a screen that used to read `pt.train.title` reads
 * `t.train.title` and nothing else about it changes.
 */
export function useT(): Copy {
  return useContext(LocaleContext).t;
}
