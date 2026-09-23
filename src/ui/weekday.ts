import { INTL_LOCALE, type Locale } from '../i18n';

/**
 * O dia da semana em três letras, para as tiras da semana — B8 de
 * .claude/skills/nutricao-sem-erros/PLANO.md. O `weekday: 'short'` do pt-PT é "segunda",
 * "quarta", "domingo" (é assim no CLDR), e numa coluna de 32–42 px a 320–390 px isso corta.
 * Três letras cabem em todas as línguas: SEG · MON · LUN · LUN.
 */
const cache = new Map<Locale, Intl.DateTimeFormat>();

export function shortWeekday(locale: Locale, date: Date): string {
  let f = cache.get(locale);
  if (!f) {
    f = new Intl.DateTimeFormat(INTL_LOCALE[locale], { weekday: 'short' });
    cache.set(locale, f);
  }
  return f.format(date).replace('.', '').slice(0, 3);
}
