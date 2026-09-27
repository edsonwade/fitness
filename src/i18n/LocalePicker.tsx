import { LOCALES, LOCALE_NAMES } from './index';
import { useLocale } from './locale-context';

/**
 * The language control — one component, in the two places he chose (skill
 * `lingua-na-entrada-e-definicoes`, 2026-09-27: "Entrada + Definições"):
 *
 * - `settings`: the label and four presets in Perfil › Definições, the look B8 settled
 *   (four names in equal columns do not fit at 320–390 px, presets wrap).
 * - `auth`: four quiet words under the footer of Entrar / Criar conta, so the language is
 *   chosen before signing in. The choice is kept on this device by the LocaleProvider,
 *   so it is still there after the sign-in.
 *
 * **Each language names itself.** "Portuguese / English / Spanish / French" written in
 * the language you are trying to leave is no use to somebody who cannot read it; a
 * person looking for French looks for the word "Français". That list lives in
 * `LOCALE_NAMES` and is the one piece of copy that is deliberately not translated.
 *
 * `role="radiogroup"` with `aria-checked`: it is one choice out of four, and that is
 * what a screen reader should be told. The `lang` attribute on each option stops a
 * screen reader announcing "Français" with Portuguese phonetics.
 */
export function LocalePicker({ variant = 'settings' }: { variant?: 'settings' | 'auth' }) {
  const { locale, setLocale, t } = useLocale();
  const label = t.settings.language;

  if (variant === 'auth') {
    return (
      <div className="auth-lang" role="radiogroup" aria-label={label}>
        {LOCALES.map((l) => (
          <button key={l} type="button" role="radio" lang={l} aria-checked={locale === l} onClick={() => setLocale(l)}>
            {LOCALE_NAMES[l]}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div>
      <p className="label mb-2">{label}</p>
      <div className="presetrow" role="radiogroup" aria-label={label}>
        {LOCALES.map((l) => (
          <button
            key={l}
            type="button"
            className="preset"
            role="radio"
            lang={l}
            aria-checked={locale === l}
            aria-pressed={locale === l}
            onClick={() => setLocale(l)}
          >
            {LOCALE_NAMES[l]}
          </button>
        ))}
      </div>
    </div>
  );
}
