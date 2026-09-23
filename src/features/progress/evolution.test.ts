import { describe, expect, it } from 'vitest';

import { evolving, longestWeekStreak, monthly } from './evolution';
import type { ExerciseLine } from './progress';

const line = (key: string, pts: [string, number | null][]): ExerciseLine => ({
  key,
  name: key,
  points: pts.map(([date, kg]) => ({ date, kg, sets: 3, reps: 10 })),
  latestKg: null,
  deltaKg: null,
});

describe('a Evolução', () => {
  it('a carga de cada mês é a mais alta desse mês', () => {
    expect(
      monthly(line('legpress', [['2026-08-02', 50], ['2026-08-20', 55], ['2026-09-01', 60], ['2026-09-03', null]])),
    ).toEqual([
      { month: '2026-08', kg: 55 },
      { month: '2026-09', kg: 60 },
    ]);
  });

  it('só entra quem tem pelo menos dois meses', () => {
    const lines = [line('a', [['2026-09-01', 50]]), line('b', [['2026-08-01', 40], ['2026-09-01', 45]])];
    expect(evolving(lines).map((x) => x.line.key)).toEqual(['b']);
  });

  it('semanas seguidas com treino', () => {
    expect(longestWeekStreak(['2026-09-01', '2026-09-03', '2026-09-08', '2026-09-15', '2026-09-29'])).toBe(3);
    expect(longestWeekStreak([])).toBe(0);
  });
});
