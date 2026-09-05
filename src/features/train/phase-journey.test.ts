import { describe, expect, it } from 'vitest';

import { BLOCKS, type BlockKey } from '../../content';
import { pt } from '../../i18n/pt';

const t = pt.train;
const keys = BLOCKS.map((b) => b.k as BlockKey);

/**
 * The per-phase panel copy, held to what it may and may not say.
 *
 * `pt.train.phaseInfo` no longer narrates a phase's position in the cycle — that rule
 * was revoked when the line was rewritten to say what each level trains for instead of
 * where it sits. What survives are the constraints that outlast any wording: the panel
 * exists for every phase the rail can show, it does not bring back the jargon phase 001
 * and 002 took off the screen, and it does not print a week number the app has not
 * measured.
 */
describe('o painel de cada fase', () => {
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
   */
  it('não diz em que semana do ciclo a pessoa está', () => {
    escritas().forEach((frase) => {
      expect(frase, `"${frase}" não pode nomear uma semana`).not.toMatch(/\bsemanas?\s*\d/i);
    });
  });

  /**
   * The two words phase 001 and 002 were built to take off the screen, kept off it.
   *
   * "Bloco" is a position in a list and "Deload" is the technical term §8.1 names as
   * the problem. The copy that exists to retire the jargon must not reintroduce it
   * while doing so.
   */
  it('não traz de volta "Bloco" nem "Deload"', () => {
    escritas().forEach((frase) => {
      expect(frase).not.toMatch(/\bblocos?\b/i);
      expect(frase).not.toMatch(/\bdeload\b/i);
    });
  });
});

/** Every string the panel can put on screen: each phase's title and its body. */
function escritas(): string[] {
  return keys.flatMap((k) => [t.phaseInfo[k].title, t.phaseInfo[k].body]);
}
