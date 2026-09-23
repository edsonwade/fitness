import { describe, expect, it } from 'vitest';

import { DUCK_VOLUME, fmtTime, parseTracks, shouldDuck } from './music';

describe('a música do treino', () => {
  it('escreve o tempo como o protótipo', () => {
    expect(fmtTime(0)).toBe('0:00');
    expect(fmtTime(187.9)).toBe('3:07');
    expect(fmtTime(Number.NaN)).toBe('0:00');
  });

  it('baixa para 30% só nos últimos 3 segundos do descanso', () => {
    expect(DUCK_VOLUME).toBe(0.3);
    expect([5, 4, 3, 2, 1, 0].map(shouldDuck)).toEqual([false, false, true, true, true, false]);
  });

  it('a lista só leva faixas com ficheiro; sem lista, nada', () => {
    expect(parseTracks(null)).toEqual([]);
    expect(parseTracks({})).toEqual([]);
    expect(
      parseTracks([{ file: 'a.mp3', title: 'A', artist: 'X' }, { title: 'sem ficheiro' }, { file: 'b.mp3' }]),
    ).toEqual([
      { file: 'a.mp3', title: 'A', artist: 'X' },
      { file: 'b.mp3', title: 'b.mp3', artist: '' },
    ]);
  });
});
