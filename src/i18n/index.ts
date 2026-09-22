import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { pt, type Copy } from './pt';

/**
 * The four languages, and how one is chosen.
 *
 * Portuguese is the source language and the fallback. The other three are
 * translations of it, held to the same shape by `satisfies Copy` in their own files:
 * a key that exists in one dictionary and not the others fails the build. There is
 * no runtime key lookup here and no "missing key" path, because there cannot be a
 * missing key.
 *
 * `locale` is stored locally for now, like the theme. Per the approved plan it is
 * synced user state and belongs in `user_settings` next to `theme`, so choosing
 * French on the phone turns the PC French too. That is a later phase; this is
 * written so that moving it is one file, not twenty-two.
 */
export const DICTIONARIES = { pt, en, es, fr } as const;

export type Locale = keyof typeof DICTIONARIES;

export const FALLBACK: Locale = 'pt';

/**
 * The picker's own list, each language named IN that language.
 *
 * "Portuguese / English / Spanish / French" written in the language you are leaving
 * is no use to somebody who cannot read it. A person looking for French looks for
 * the word "Français".
 */
export const LOCALE_NAMES: Record<Locale, string> = {
  pt: 'Português',
  en: 'English',
  es: 'Español',
  fr: 'Français',
};

export const LOCALES = Object.keys(DICTIONARIES) as Locale[];

/**
 * The BCP-47 tag to hand `Intl` for each language.
 *
 * Not the same as our two-letter code, and the difference is visible on the screen.
 * `Intl.DateTimeFormat('pt')` is not `'pt-PT'`: it resolves to Brazilian Portuguese,
 * which writes the date differently. `'en'` leans American and gives "September 12"
 * where the rest of this product says "12 September". A date is copy too.
 */
export const INTL_LOCALE: Record<Locale, string> = {
  pt: 'pt-PT',
  en: 'en-GB',
  es: 'es-ES',
  fr: 'fr-FR',
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && value in DICTIONARIES;
}

export function copyFor(locale: Locale): Copy {
  return DICTIONARIES[locale];
}

/* Bumped-style key, matching `vw.theme.v2`, so the two settings read alike. */
const STORAGE_KEY = 'vw.locale.v1';

export function readStoredLocale(): Locale | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isLocale(value) ? value : null;
  } catch {
    // Private mode, or site data blocked. Not remembering is not a failure.
    return null;
  }
}

export function storeLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Not being able to remember the choice must never break using the app.
  }
}

/**
 * The browser's language, reduced to one of ours.
 *
 * Only the primary subtag matters: `pt-BR`, `pt-PT` and `pt` are all Portuguese to
 * this app, and `en-GB` is English. `navigator.languages` is walked in order,
 * because a browser set to Spanish first and English second should land on Spanish
 * rather than on whichever we happened to check first.
 *
 * Nothing here is written down. A guess is not a choice, and the theme already
 * taught us what happens when a default nobody picked gets stored as if they had.
 */
export function detectLocale(
  languages: readonly string[] = typeof navigator === 'undefined' ? [] : navigator.languages,
): Locale {
  for (const tag of languages) {
    const primary = tag.toLowerCase().split('-')[0];
    if (isLocale(primary)) return primary;
  }
  return FALLBACK;
}

/** The language to start in: the stored choice if there is one, otherwise a guess. */
export function initialLocale(): Locale {
  return readStoredLocale() ?? detectLocale();
}

export { pt, en, es, fr };
export type { Copy };
