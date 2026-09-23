import { describe, expect, it } from 'vitest';

import { dialAt } from './run-dial';
import { COUNT_MS, GO_MS, countFrom, finishAction, shiftAnchor } from './run-pause';

describe('countFrom — a contagem retoma onde ia', () => {
  it('do princípio: 3 à vista, e os três passos por dar', () => {
    expect(countFrom(0)).toEqual({
      digit: 3,
      next: [
        { delay: 1000, step: 2 },
        { delay: 2000, step: 1 },
        { delay: COUNT_MS - GO_MS, step: 'go' },
      ],
    });
  });

  it('pausada a 1,5 s: o 2 à vista, e só faltam o 1 e o arranque', () => {
    expect(countFrom(1500)).toEqual({
      digit: 2,
      next: [
        { delay: 500, step: 1 },
        { delay: COUNT_MS - GO_MS - 1500, step: 'go' },
      ],
    });
  });

  it('depois do arranque não sobra nada para dar', () => {
    expect(countFrom(COUNT_MS - GO_MS).next).toEqual([]);
  });
});

describe('shiftAnchor — o mostrador não conta a pausa', () => {
  it('uma série a 20 s, pausada 60 s, continua a 20 s', () => {
    const since = 1_000_000;
    const pausedAt = since + 20_000;
    const shifted = shiftAnchor({ mode: 'set', since }, 60_000);
    expect(dialAt(shifted, pausedAt + 60_000)).toEqual({ mode: 'set', up: 20 });
  });

  it('um descanso de 90 s, pausado a 30 s, ainda tem 60 s depois da pausa', () => {
    const since = 5_000;
    const shifted = shiftAnchor({ mode: 'rest', since, total: 90 }, 45_000);
    expect(dialAt(shifted, since + 30_000 + 45_000)).toEqual({ mode: 'rest', left: 60, total: 90 });
  });

  it('um tempo negativo não recua a âncora', () => {
    expect(shiftAnchor({ mode: 'set', since: 10 }, -5)).toEqual({ mode: 'set', since: 10 });
  });
});

describe('finishAction — "Terminar e guardar"', () => {
  it('com séries feitas grava a sessão', () => {
    expect(finishAction(3)).toBe('record');
  });
  it('sem nenhuma, não houve treino: só sai', () => {
    expect(finishAction(0)).toBe('leave');
  });
});
