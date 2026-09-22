import clsx from 'clsx';

import { LOCALES, LOCALE_NAMES } from './index';
import { useLocale } from './locale-context';

/**
 * The language control.
 *
 * Four chips rather than a `<select>`: there are four options and they all fit, so a
 * dropdown would hide the choice behind a tap and then hide the other three behind a
 * scroll. The same chip pattern the day form and the exercise form use, so this reads
 * as furniture of this app and not as a browser control dropped into it.
 *
 * **Each language names itself.** "Portuguese / English / Spanish / French" written in
 * the language you are trying to leave is no use to somebody who cannot read it; a
 * person looking for French looks for the word "Français". That list lives in
 * `LOCALE_NAMES` and is the one piece of copy that is deliberately not translated.
 *
 * `role="radiogroup"` with `aria-checked`, not a row of buttons: it is one choice out
 * of four, and that is what a screen reader should be told. The `lang` attribute on
 * each chip is what stops a screen reader announcing "Français" with Portuguese
 * phonetics while the page is still Portuguese.
 */
export function LocalePicker({ className }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();

  return (
    <fieldset className={clsx('flex flex-col gap-2', className)}>
      <legend className="font-ui text-[13px] font-500 text-text-muted">
        {t.settings.language}
      </legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t.settings.language}>
        {LOCALES.map((option) => {
          const selected = option === locale;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              lang={option}
              onClick={() => setLocale(option)}
              className={clsx(
                'min-h-[44px] rounded-full px-5 font-ui text-[13px] font-500',
                'transition-colors duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
                'active:scale-[0.97] motion-reduce:active:scale-100',
                selected
                  ? 'bg-chip-selected font-600 text-chip-selected-ink'
                  : 'bg-chip text-chip-ink',
              )}
            >
              {LOCALE_NAMES[option]}
            </button>
          );
        })}
      </div>
      <p className="font-ui text-[12px] leading-snug text-text-muted">
        {t.settings.languageHint}
      </p>
    </fieldset>
  );
}
