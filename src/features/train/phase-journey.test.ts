import { describe, expect, it } from 'vitest';

import { BLOCKS, type BlockKey } from '../../content';
import { DICTIONARIES, LOCALES, type Locale } from '../../i18n';

const keys = BLOCKS.map((b) => b.k as BlockKey);

/**
 * The per-phase panel copy, held to what it may and may not say — in all four
 * languages, not only the one it was written in.
 *
 * `train.phaseInfo` no longer narrates a phase's position in the cycle: that rule was
 * revoked when the line was rewritten to say what each level trains for instead of
 * where it sits. What survives are the constraints that outlast any wording, and they
 * outlast translation too. A rule enforced on Portuguese alone is a rule three
 * dictionaries can quietly break.
 *
 * The jargon ban is the clearest case. §8.1 retires "Deload" because the word does not
 * say what the phase is for, and a beginner reading English does not know it either —
 * so `en` says "Lighter week", not the term a coach would use.
 */
describe.each(LOCALES)('o painel de cada fase · %s', (locale: Locale) => {
  const t = DICTIONARIES[locale].train;

  it('tem um título e uma descrição para cada fase do rail', () => {
    keys.forEach((key) => {
      const info = t.phaseInfo[key];
      expect(info, `${key} tem de existir em phaseInfo`).toBeTruthy();
      expect(info.title.trim(), `${key} tem de ter título`).not.toBe('');
      expect(info.body.trim(), `${key} tem de ter descrição`).not.toBe('');
    });
  });

  /**
   * The line §14 of the plan draws, kept where it can be checked.
   *
   * The app does not know which week of the cycle anyone is in: nothing is recorded
   * with a date until phase 005. The plan's own figures are examples and "não devem ser
   * interpretados como dados reais", so copy here that named a week would be inventing
   * the user's position and printing it as fact. The authored block subtitles
   * ("Descarga · Sem 12") are the programme's own text and not this file's to judge;
   * this panel's title and body are.
   *
   * Four spellings of the word, because the sentence is now written in four languages.
   */
  it('não diz em que semana do ciclo a pessoa está', () => {
    escritas(locale).forEach((frase) => {
      expect(frase, `"${frase}" não pode nomear uma semana`).not.toMatch(
        /\b(semanas?|weeks?|semaines?)\s*\d/i,
      );
    });
  });

  /**
   * The two words phase 001 and 002 were built to take off the screen, kept off it.
   *
   * "Bloco" is a position in a list and "Deload" is the technical term §8.1 names as
   * the problem. The copy that exists to retire the jargon must not reintroduce it
   * while doing so — in any language, which is the half that used to go unchecked.
   */
  it('não traz de volta "Bloco" nem "Deload"', () => {
    escritas(locale).forEach((frase) => {
      expect(frase).not.toMatch(/\b(blocos?|blocks?|blocs?|bloques?)\b/i);
      expect(frase).not.toMatch(/\bdeload\b/i);
    });
  });
});

/** Every string the panel can put on screen: each phase's title and its body. */
function escritas(locale: Locale): string[] {
  const t = DICTIONARIES[locale].train;
  return keys.flatMap((k) => [t.phaseInfo[k].title, t.phaseInfo[k].body]);
}
