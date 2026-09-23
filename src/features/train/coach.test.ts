import { describe, expect, it } from 'vitest';

import { weekdayIndex } from '../calendar/calendar';
import { coachRead } from './coach';

const REST = new Set([3, 6]); // Qui e Dom
const read = (done: string[], first: string | null, today = '2026-09-12') =>
  coachRead(today, REST, new Set(done), first, weekdayIndex);

describe('o Coach', () => {
  it('sem dados: nenhum cartão', () => {
    expect(read([], null)).toBeNull();
  });

  it('com uma sessão só, ontem: não há facto que chegue', () => {
    expect(read(['2026-09-11'], '2026-09-11')).toBeNull();
  });

  it('semana cheia: as 4 últimas planeadas feitas', () => {
    // antes de sáb 12: sex 11, qua 9, ter 8, seg 7 (qui 10 é descanso)
    expect(read(['2026-09-11', '2026-09-09', '2026-09-08', '2026-09-07'], '2026-09-01')).toEqual({
      done: 4,
      planned: 4,
      kind: 'full',
    });
  });

  it('3 das últimas 4: mantém a intensidade', () => {
    expect(read(['2026-09-11', '2026-09-09', '2026-09-07'], '2026-09-01')?.kind).toBe('most');
  });

  it('semana falhada: diz o facto, sem culpa', () => {
    expect(read(['2026-09-07'], '2026-09-01')).toEqual({ done: 1, planned: 4, kind: 'low' });
  });
});
