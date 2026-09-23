import { describe, expect, it } from 'vitest';

import { sheetQueue, wheelNames } from './run-queue';

describe('sheetQueue — por baixo das séries nunca fica vazio (erro 4)', () => {
  it('a meio do dia: os seguintes primeiro, depois os de trás que faltam', () => {
    expect(sheetQueue([false, false, false, false], 1)).toEqual({ next: [2, 3, 0], finished: [] });
  });

  it('no último exercício, com os outros feitos: a lista passa aos já feitos', () => {
    expect(sheetQueue([true, true, true, false], 3)).toEqual({ next: [], finished: [0, 1, 2] });
  });

  it('os feitos vão para "Já feitos", pela ordem do dia', () => {
    expect(sheetQueue([true, false, true, false], 1)).toEqual({ next: [3], finished: [0, 2] });
  });

  it('o exercício a decorrer nunca aparece na própria lista', () => {
    const { next, finished } = sheetQueue([true, true, false], 0);
    expect([...next, ...finished]).not.toContain(0);
  });

  it('só um dia com um exercício fica sem lista', () => {
    expect(sheetQueue([false], 0)).toEqual({ next: [], finished: [] });
  });
});

describe('the day wheel names', () => {
  it('keeps the names as they are, and numbers only the repeated ones', () => {
    expect(wheelNames(['Leg Press', 'Squat'])).toEqual(['Leg Press', 'Squat']);
    expect(wheelNames(['Row', 'Curl', 'Row'])).toEqual(['Row · 1', 'Curl', 'Row · 3']);
  });
});
