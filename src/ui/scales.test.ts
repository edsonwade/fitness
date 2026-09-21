import { describe, expect, it } from 'vitest';

import { EFFORT_STEPS, SCALES, buildValues, formatValue, nearestIndex, stepValue } from './scales';

/**
 * As escalas são a peça que torna impossível escrever um valor que não existe.
 * Se elas estiverem erradas, a roda oferece degraus que nenhum disco faz — e isso
 * não se vê num screenshot.
 *
 * Testes verdes aqui provam a aritmética como eu a entendi. A prova de que a app
 * faz o que foi pedido continua a ser ele, no browser.
 */

describe('formatValue', () => {
  it('escreve em português, com vírgula e sem zeros pendurados', () => {
    expect(formatValue(62.5, 1)).toBe('62,5');
    expect(formatValue(60, 1)).toBe('60');
    expect(formatValue(1.25, 2)).toBe('1,25');
  });

  it('arredonda quando a escala não tem casas decimais', () => {
    expect(formatValue(12, 0)).toBe('12');
    expect(formatValue(12.4, 0)).toBe('12');
  });
});

describe('buildValues', () => {
  it('anda de disco em disco e chega ao máximo', () => {
    const v = buildValues(SCALES.kg);
    expect(v[0]).toBe(0);
    expect(v[1]).toBe(2.5);
    expect(v.at(-1)).toBe(200);
  });

  it('não perde o último degrau por causa da vírgula flutuante', () => {
    // 2,5 somado oitenta vezes não dá 200 exatamente em binário.
    expect(buildValues(SCALES.kg)).toHaveLength(81);
    expect(buildValues(SCALES.kgfino).at(-1)).toBe(60);
    expect(buildValues(SCALES.rpe)).toEqual([5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10]);
  });
});

describe('nearestIndex', () => {
  it('aproxima um valor que não é degrau, em vez de o recusar', () => {
    const v = buildValues(SCALES.kg);
    // 61 não existe na escala; o degrau mais perto é 60.
    expect(v[nearestIndex(v, 61)]).toBe(60);
    expect(v[nearestIndex(v, 61.5)]).toBe(62.5);
  });

  it('prende-se aos extremos', () => {
    const v = buildValues(SCALES.reps);
    expect(v[nearestIndex(v, -5)]).toBe(1);
    expect(v[nearestIndex(v, 999)]).toBe(40);
  });
});

describe('stepValue', () => {
  it('sobe e desce pelo degrau real', () => {
    expect(stepValue(60, 1, SCALES.kg)).toBe(62.5);
    expect(stepValue(60, -1, SCALES.kg)).toBe(57.5);
  });

  it('não passa dos limites da escala', () => {
    expect(stepValue(200, 1, SCALES.kg)).toBe(200);
    expect(stepValue(0, -1, SCALES.kg)).toBe(0);
  });

  it('aceita um degrau à medida sem sair da escala', () => {
    expect(stepValue(60, 1, SCALES.kg, 1.25)).toBe(61.25);
  });
});

describe('EFFORT_STEPS', () => {
  it('são os oito do protótipo, e o 9,5 não existe', () => {
    expect(EFFORT_STEPS).toEqual([6, 6.5, 7, 7.5, 8, 8.5, 9, 10]);
    expect(EFFORT_STEPS).not.toContain(9.5);
  });
});
